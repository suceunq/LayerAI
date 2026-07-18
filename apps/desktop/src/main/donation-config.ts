import { app } from "electron";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parsePayPalDonationUrl } from "./security/donation-url.js";

const REMOTE_CONFIG_URL = "https://github.com/suceunq/LayerAI/releases/latest/download/donation.json";
const REMOTE_REFRESH_MS = 15 * 60 * 1000;
const MAX_CONFIG_BYTES = 4096;

export interface ResolvedDonationConfig {
  url: string | null;
  source: "remote" | "local" | "cache" | "none";
}

let memoryConfig: ResolvedDonationConfig | null = null;
let lastRemoteAttempt = 0;

function cachePath(): string {
  return join(app.getPath("userData"), "donation-config-cache.json");
}

function localConfigPath(): string {
  return app.isPackaged ? join(process.resourcesPath, "donation.json") : join(app.getAppPath(), "resources", "donation.json");
}

async function readCachedConfig(): Promise<ResolvedDonationConfig | null> {
  try {
    const parsed = JSON.parse(await readFile(cachePath(), "utf8")) as { paypalUrl?: unknown };
    if (typeof parsed.paypalUrl !== "string") return null;
    const url = parsePayPalDonationUrl(parsed.paypalUrl);
    return url ? { url, source: "cache" } : null;
  } catch {
    return null;
  }
}

async function readLocalConfig(): Promise<ResolvedDonationConfig | null> {
  try {
    const parsed = JSON.parse(await readFile(localConfigPath(), "utf8")) as { paypalUrl?: unknown };
    if (typeof parsed.paypalUrl !== "string" || !parsed.paypalUrl.trim()) return null;
    const url = parsePayPalDonationUrl(parsed.paypalUrl);
    return url ? { url, source: "local" } : null;
  } catch {
    return null;
  }
}

async function fetchRemoteConfig(): Promise<ResolvedDonationConfig | null> {
  try {
    const response = await fetch(REMOTE_CONFIG_URL, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;
    const declaredSize = Number(response.headers.get("content-length") ?? 0);
    if (declaredSize > MAX_CONFIG_BYTES) return null;
    const body = await response.text();
    if (Buffer.byteLength(body, "utf8") > MAX_CONFIG_BYTES) return null;
    const parsed = JSON.parse(body) as { paypalUrl?: unknown };
    if (typeof parsed.paypalUrl !== "string" || !parsed.paypalUrl.trim()) return null;
    const url = parsePayPalDonationUrl(parsed.paypalUrl);
    if (!url) return null;
    await writeFile(cachePath(), JSON.stringify({ paypalUrl: url }, null, 2), "utf8");
    return { url, source: "remote" };
  } catch {
    return null;
  }
}

export async function resolveDonationConfig(forceRefresh = false): Promise<ResolvedDonationConfig> {
  const now = Date.now();
  if (!forceRefresh && memoryConfig && now - lastRemoteAttempt < REMOTE_REFRESH_MS) return memoryConfig;
  lastRemoteAttempt = now;
  memoryConfig = (await fetchRemoteConfig()) ?? (await readLocalConfig()) ?? (await readCachedConfig()) ?? { url: null, source: "none" };
  return memoryConfig;
}
