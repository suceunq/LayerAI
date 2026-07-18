import { app, net } from "electron";
import { createHash, randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { logUpdate } from "./update-logger.js";

const RELEASE_BASE_URL = "https://github.com/suceunq/LayerAI/releases/download";
const RETRY_DELAYS_MS = [0, 2_000, 8_000, 30_000];

export interface UpdateTransaction {
  id: string;
  fromVersion: string;
  toVersion: string;
  releaseNotes?: string;
  startedAt: string;
  originalProcessId: number;
  rollbackInstallerPath: string;
  rollbackSha512Hex: string;
  healthMarkerPath: string;
  executablePath: string;
}

interface LastInstalledUpdate {
  version: string;
  previousVersion: string;
  releaseNotes?: string;
  installedAt: string;
  acknowledged: boolean;
}

interface BlockedVersion {
  version: string;
  failedAt: string;
}

function updatesDirectory(): string {
  return join(app.getPath("userData"), "updates");
}

function pendingTransactionPath(): string {
  return join(updatesDirectory(), "pending-update.json");
}

function lastInstalledPath(): string {
  return join(updatesDirectory(), "last-installed-update.json");
}

function blockedVersionPath(): string {
  return join(updatesDirectory(), "blocked-version.json");
}

function ensureSafeVersion(version: string): string {
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) throw Error("Invalid update version");
  return version;
}

async function writeJsonAtomic(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(value, null, 2), "utf-8");
  await rm(path, { force: true });
  await rename(temporary, path);
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, "utf-8")) as T;
  } catch {
    return null;
  }
}

async function retry<T>(event: string, operation: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
    const delay = RETRY_DELAYS_MS[attempt] ?? 0;
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logUpdate("warn", `${event}-retry`, { attempt: attempt + 1, message: error instanceof Error ? error.message : String(error) });
    }
  }
  throw lastError;
}

function parseLatestYml(source: string): { sha512: string; size: number } {
  const sha512 = /^sha512:\s*(\S+)\s*$/m.exec(source)?.[1];
  const sizeText = /^\s*size:\s*(\d+)\s*$/m.exec(source)?.[1];
  const size = Number(sizeText);
  if (!sha512 || !/^[A-Za-z0-9+/]+={0,2}$/.test(sha512) || !Number.isSafeInteger(size) || size <= 0) {
    throw Error("Invalid rollback metadata");
  }
  return { sha512, size };
}

async function sha512Base64(path: string): Promise<string> {
  const hash = createHash("sha512");
  await pipeline(createReadStream(path), hash);
  return hash.digest("base64");
}

async function downloadWithResume(url: string, destination: string, expectedSize: number, expectedSha512: string): Promise<void> {
  const partial = `${destination}.partial`;
  await mkdir(dirname(destination), { recursive: true });

  try {
    if ((await stat(destination)).size === expectedSize && (await sha512Base64(destination)) === expectedSha512) return;
  } catch {
    // Cache miss: continue with the resumable download.
  }

  let existingBytes: number;
  try {
    existingBytes = (await stat(partial)).size;
    if (existingBytes > expectedSize) {
      await rm(partial, { force: true });
      existingBytes = 0;
    }
  } catch {
    existingBytes = 0;
  }

  const headers = existingBytes > 0 ? { Range: `bytes=${existingBytes}-` } : undefined;
  const response = await net.fetch(url, { headers, redirect: "follow" });
  if (!response.ok || !response.body) throw Error(`Rollback download failed (${response.status})`);

  const append = existingBytes > 0 && response.status === 206;
  await pipeline(
    Readable.fromWeb(response.body as never),
    createWriteStream(partial, { flags: append ? "a" : "w" }),
  );

  const downloadedSize = (await stat(partial)).size;
  if (downloadedSize !== expectedSize) throw Error(`Rollback size mismatch (${downloadedSize}/${expectedSize})`);
  if ((await sha512Base64(partial)) !== expectedSha512) {
    await rm(partial, { force: true });
    throw Error("Rollback checksum mismatch");
  }

  await rm(destination, { force: true });
  await rename(partial, destination);
}

export async function prepareRollbackTransaction(toVersion: string, releaseNotes?: string): Promise<UpdateTransaction> {
  const fromVersion = ensureSafeVersion(app.getVersion());
  ensureSafeVersion(toVersion);
  const tag = `v${fromVersion}`;
  const metadataUrl = `${RELEASE_BASE_URL}/${tag}/latest.yml`;
  const metadata = await retry("rollback-metadata", async () => {
    const response = await net.fetch(metadataUrl, { redirect: "follow" });
    if (!response.ok) throw Error(`Rollback metadata download failed (${response.status})`);
    return parseLatestYml(await response.text());
  });

  const rollbackDirectory = join(updatesDirectory(), "rollback", fromVersion);
  const rollbackInstallerPath = join(rollbackDirectory, "LayerAI_Setup.exe");
  const installerUrl = `${RELEASE_BASE_URL}/${tag}/LayerAI_Setup.exe`;
  await retry("rollback-installer", () => downloadWithResume(installerUrl, rollbackInstallerPath, metadata.size, metadata.sha512));

  const transaction: UpdateTransaction = {
    id: randomUUID(),
    fromVersion,
    toVersion,
    releaseNotes,
    startedAt: new Date().toISOString(),
    originalProcessId: process.pid,
    rollbackInstallerPath,
    rollbackSha512Hex: Buffer.from(metadata.sha512, "base64").toString("hex").toUpperCase(),
    healthMarkerPath: join(updatesDirectory(), `healthy-${toVersion}.json`),
    executablePath: app.getPath("exe"),
  };

  await rm(transaction.healthMarkerPath, { force: true });
  await writeJsonAtomic(pendingTransactionPath(), transaction);
  logUpdate("info", "rollback-ready", { fromVersion, toVersion });
  return transaction;
}

const WATCHDOG_SCRIPT = String.raw`param([Parameter(Mandatory=$true)][string]$StatePath)
$ErrorActionPreference = 'Stop'
$state = Get-Content -LiteralPath $StatePath -Raw | ConvertFrom-Json
$logPath = Join-Path (Split-Path (Split-Path $StatePath -Parent) -Parent) 'logs\updates.log'
function Write-UpdateLog([string]$level, [string]$eventName, [object]$details) {
  try {
    $entry = @{ timestamp = [DateTime]::UtcNow.ToString('o'); level = $level; event = $eventName; details = $details } | ConvertTo-Json -Compress
    Add-Content -LiteralPath $logPath -Value $entry -Encoding UTF8
  } catch {}
}

$oldProcessDeadline = [DateTime]::UtcNow.AddMinutes(2)
while ([DateTime]::UtcNow -lt $oldProcessDeadline) {
  if (-not (Get-Process -Id $state.originalProcessId -ErrorAction SilentlyContinue)) { break }
  Start-Sleep -Seconds 1
}

$healthDeadline = [DateTime]::UtcNow.AddMinutes(4)
while ([DateTime]::UtcNow -lt $healthDeadline) {
  if (Test-Path -LiteralPath $state.healthMarkerPath) {
    try {
      $health = Get-Content -LiteralPath $state.healthMarkerPath -Raw | ConvertFrom-Json
      if ($health.version -eq $state.toVersion) {
        Write-UpdateLog 'info' 'watchdog-health-confirmed' @{ version = $state.toVersion }
        exit 0
      }
    } catch {}
  }
  Start-Sleep -Seconds 2
}

Write-UpdateLog 'error' 'watchdog-rollback-started' @{ fromVersion = $state.fromVersion; failedVersion = $state.toVersion }
Get-Process -Name 'LayerAI' -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
$actualHash = (Get-FileHash -LiteralPath $state.rollbackInstallerPath -Algorithm SHA512).Hash
if ($actualHash -ne $state.rollbackSha512Hex) {
  Write-UpdateLog 'error' 'watchdog-rollback-checksum-failed' @{}
  exit 12
}
$blockedPath = Join-Path (Split-Path $StatePath -Parent) 'blocked-version.json'
@{ version = $state.toVersion; failedAt = [DateTime]::UtcNow.ToString('o') } | ConvertTo-Json | Set-Content -LiteralPath $blockedPath -Encoding UTF8
$rollback = Start-Process -FilePath $state.rollbackInstallerPath -ArgumentList '/S' -WindowStyle Hidden -Wait -PassThru
if ($rollback.ExitCode -ne 0) {
  Write-UpdateLog 'error' 'watchdog-rollback-installer-failed' @{ exitCode = $rollback.ExitCode }
  exit $rollback.ExitCode
}
Start-Process -FilePath $state.executablePath -ArgumentList '--rollback-restored' -WindowStyle Hidden
Write-UpdateLog 'info' 'watchdog-rollback-complete' @{ version = $state.fromVersion }
`;

export async function startRollbackWatchdog(): Promise<void> {
  const scriptPath = join(updatesDirectory(), "rollback-watchdog.ps1");
  await writeFile(scriptPath, WATCHDOG_SCRIPT, "utf-8");
  const child = spawn(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-WindowStyle", "Hidden", "-File", scriptPath, "-StatePath", pendingTransactionPath()],
    { detached: true, stdio: "ignore", windowsHide: true },
  );
  child.unref();
  logUpdate("info", "rollback-watchdog-started", { pid: child.pid });
}

export async function readPendingTransaction(): Promise<UpdateTransaction | null> {
  return readJson<UpdateTransaction>(pendingTransactionPath());
}

export async function readUnacknowledgedInstalledUpdate(): Promise<LastInstalledUpdate | null> {
  const installed = await readJson<LastInstalledUpdate>(lastInstalledPath());
  return installed && installed.version === app.getVersion() && !installed.acknowledged ? installed : null;
}

export async function markCurrentVersionHealthy(): Promise<void> {
  const transaction = await readPendingTransaction();
  if (!transaction || transaction.toVersion !== app.getVersion()) return;

  await writeJsonAtomic(transaction.healthMarkerPath, { version: app.getVersion(), healthyAt: new Date().toISOString() });
  await writeJsonAtomic(lastInstalledPath(), {
    version: transaction.toVersion,
    previousVersion: transaction.fromVersion,
    releaseNotes: transaction.releaseNotes,
    installedAt: new Date().toISOString(),
    acknowledged: false,
  } satisfies LastInstalledUpdate);
  await rm(pendingTransactionPath(), { force: true });
  logUpdate("info", "update-health-confirmed", { version: app.getVersion() });
}

export async function acknowledgeInstalledUpdate(): Promise<void> {
  const installed = await readJson<LastInstalledUpdate>(lastInstalledPath());
  if (!installed || installed.version !== app.getVersion()) return;
  await writeJsonAtomic(lastInstalledPath(), { ...installed, acknowledged: true });
}

export async function recoverInterruptedUpdate(): Promise<LastInstalledUpdate | null> {
  const pending = await readPendingTransaction();
  if (pending && pending.toVersion === app.getVersion()) {
    return {
      version: pending.toVersion,
      previousVersion: pending.fromVersion,
      releaseNotes: pending.releaseNotes,
      installedAt: pending.startedAt,
      acknowledged: false,
    };
  }
  if (pending && pending.fromVersion === app.getVersion() && process.argv.includes("--rollback-restored")) {
    await rm(pendingTransactionPath(), { force: true });
    logUpdate("warn", "rollback-restored", { version: app.getVersion(), failedVersion: pending.toVersion });
  }
  return readUnacknowledgedInstalledUpdate();
}

export async function isVersionBlocked(version: string): Promise<boolean> {
  const blocked = await readJson<BlockedVersion>(blockedVersionPath());
  if (!blocked) return false;
  if (blocked.version === version) return true;
  await rm(blockedVersionPath(), { force: true });
  return false;
}

