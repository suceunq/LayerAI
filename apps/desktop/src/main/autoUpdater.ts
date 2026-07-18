import { app, BrowserWindow, powerMonitor } from "electron";
import { autoUpdater, CancellationToken } from "electron-updater";
import { IpcChannels } from "../shared/ipc-channels.js";
import type { UpdateState } from "../shared/ipc-types.js";
import {
  acknowledgeInstalledUpdate,
  isVersionBlocked,
  markCurrentVersionHealthy,
  prepareRollbackTransaction,
  recoverInterruptedUpdate,
  startRollbackWatchdog,
} from "./update-rollback.js";
import { logUpdate, updaterLogger } from "./update-logger.js";

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1_000;
const STARTUP_CHECK_DELAY_MS = 12_000;
const RETRY_DELAYS_MS = [0, 5_000, 30_000, 2 * 60_000];

let state: UpdateState = { status: "idle", currentVersion: app.getVersion() };
let checking = false;
let downloadRunning = false;
let installFlowStarted = false;
let periodicTimer: NodeJS.Timeout | null = null;

function broadcast(): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IpcChannels.updateStateChanged, state);
  }
}

function setState(patch: Partial<UpdateState>): void {
  state = { ...state, ...patch };
  broadcast();
}

function releaseNotesOf(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return undefined;
  return value
    .map((entry) => (entry && typeof entry === "object" && "note" in entry && typeof entry.note === "string" ? entry.note : ""))
    .filter(Boolean)
    .join("\n\n");
}

async function downloadAutomatically(): Promise<void> {
  if (downloadRunning || installFlowStarted) return;
  downloadRunning = true;
  let lastError: unknown;
  try {
    for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
      const delay = RETRY_DELAYS_MS[attempt] ?? 0;
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
      try {
        logUpdate("info", "download-attempt", { attempt: attempt + 1, version: state.availableVersion });
        await autoUpdater.downloadUpdate(new CancellationToken());
        return;
      } catch (error) {
        lastError = error;
        logUpdate("warn", "download-retry", { attempt: attempt + 1, message: error instanceof Error ? error.message : String(error) });
      }
    }
    setState({ status: "error", errorMessage: lastError instanceof Error ? lastError.message : String(lastError) });
  } finally {
    downloadRunning = false;
  }
}

async function installAutomatically(version: string, releaseNotes?: string): Promise<void> {
  if (installFlowStarted) return;
  installFlowStarted = true;
  try {
    setState({ status: "preparing", availableVersion: version, releaseNotes });
    logUpdate("info", "integrity-verified", { version });
    await prepareRollbackTransaction(version, releaseNotes);
    await startRollbackWatchdog();
    setState({ status: "installing", availableVersion: version, progressPercent: 100 });
    logUpdate("info", "silent-install-started", { fromVersion: app.getVersion(), toVersion: version });
    setTimeout(() => autoUpdater.quitAndInstall(true, true), 1_500).unref();
  } catch (error) {
    installFlowStarted = false;
    logUpdate("error", "install-preparation-failed", error instanceof Error ? error.message : String(error));
    setState({ status: "error", errorMessage: error instanceof Error ? error.message : String(error) });
  }
}

export async function setupAutoUpdater(): Promise<void> {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.autoRunAppAfterInstall = true;
  autoUpdater.fullChangelog = false;
  autoUpdater.disableWebInstaller = true;
  autoUpdater.logger = updaterLogger;

  const installed = await recoverInterruptedUpdate();
  if (installed) {
    state = {
      status: "installed",
      currentVersion: app.getVersion(),
      previousVersion: installed.previousVersion,
      availableVersion: installed.version,
      releaseNotes: installed.releaseNotes,
    };
  }

  autoUpdater.on("checking-for-update", () => {
    logUpdate("info", "checking", { currentVersion: app.getVersion() });
    if (state.status !== "installed") setState({ status: "checking", errorMessage: undefined });
  });

  autoUpdater.on("update-available", (info) => {
    const releaseNotes = releaseNotesOf(info.releaseNotes);
    void (async () => {
      if (await isVersionBlocked(info.version)) {
        logUpdate("warn", "blocked-version-skipped", { version: info.version });
        setState({ status: "not-available", availableVersion: undefined });
        return;
      }
      setState({ status: "available", availableVersion: info.version, releaseNotes, errorMessage: undefined });
      await downloadAutomatically();
    })();
  });

  autoUpdater.on("update-not-available", () => {
    logUpdate("info", "up-to-date", { currentVersion: app.getVersion() });
    if (state.status !== "installed") setState({ status: "not-available", availableVersion: undefined });
  });

  autoUpdater.on("download-progress", (progress) => {
    setState({
      status: "downloading",
      progressPercent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      totalBytes: progress.total,
      transferredBytes: progress.transferred,
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    const releaseNotes = releaseNotesOf(info.releaseNotes) ?? state.releaseNotes;
    setState({ status: "downloaded", availableVersion: info.version, releaseNotes, progressPercent: 100 });
    void installAutomatically(info.version, releaseNotes);
  });

  autoUpdater.on("error", (error) => {
    logUpdate("warn", "updater-error", error.message);
  });
}

export function getUpdateState(): UpdateState {
  return state;
}

export async function checkForUpdates(): Promise<void> {
  if (!app.isPackaged) {
    setState({ status: "dev-unavailable" });
    return;
  }
  if (checking || downloadRunning || installFlowStarted || state.status === "installed") return;
  checking = true;
  let lastError: unknown;
  try {
    for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
      const delay = RETRY_DELAYS_MS[attempt] ?? 0;
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
      try {
        await autoUpdater.checkForUpdates();
        return;
      } catch (error) {
        lastError = error;
        logUpdate("warn", "check-retry", { attempt: attempt + 1, message: error instanceof Error ? error.message : String(error) });
      }
    }
    setState({ status: "error", errorMessage: lastError instanceof Error ? lastError.message : String(lastError) });
  } finally {
    checking = false;
  }
}

export function startAutomaticUpdateChecks(): void {
  setTimeout(() => void checkForUpdates(), STARTUP_CHECK_DELAY_MS).unref();
  periodicTimer = setInterval(() => void checkForUpdates(), CHECK_INTERVAL_MS);
  periodicTimer.unref();
  powerMonitor.on("resume", () => setTimeout(() => void checkForUpdates(), 15_000).unref());
}

export async function confirmApplicationHealthy(): Promise<void> {
  await markCurrentVersionHealthy();
}

export async function acknowledgeReleaseNotes(): Promise<void> {
  await acknowledgeInstalledUpdate();
  setState({ status: "idle", releaseNotes: undefined, previousVersion: undefined, availableVersion: undefined });
}

