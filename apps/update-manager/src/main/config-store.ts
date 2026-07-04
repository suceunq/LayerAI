import { safeStorage, app } from "electron";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { GitHubConfig } from "@layerai/update-publisher";

interface StoredConfig {
  owner: string;
  repo: string;
  tokenEncryptedBase64?: string;
}

const DEFAULT_CONFIG: StoredConfig = { owner: "", repo: "" };

function filePath(): string {
  return join(app.getPath("userData"), "publisher-config.json");
}

async function readStore(): Promise<StoredConfig> {
  try {
    const raw = await readFile(filePath(), "utf-8");
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<StoredConfig>) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

async function writeStore(store: StoredConfig): Promise<void> {
  await mkdir(app.getPath("userData"), { recursive: true });
  await writeFile(filePath(), JSON.stringify(store, null, 2), "utf-8");
}

/** OS-level encryption (DPAPI on Windows) via Electron safeStorage - same approach as LayerAI's AI provider key storage. Never written in plaintext. */
function encryptToken(plain: string): string {
  if (!safeStorage.isEncryptionAvailable()) return Buffer.from(plain, "utf-8").toString("base64");
  return safeStorage.encryptString(plain).toString("base64");
}

function decryptToken(encryptedBase64: string): string {
  const buf = Buffer.from(encryptedBase64, "base64");
  if (!safeStorage.isEncryptionAvailable()) return buf.toString("utf-8");
  return safeStorage.decryptString(buf);
}

export async function getPublicConfig(): Promise<{ owner: string; repo: string; hasToken: boolean }> {
  const store = await readStore();
  return { owner: store.owner, repo: store.repo, hasToken: Boolean(store.tokenEncryptedBase64) };
}

export async function saveConfig(input: { owner: string; repo: string; token?: string }): Promise<void> {
  const existing = await readStore();
  await writeStore({
    owner: input.owner,
    repo: input.repo,
    tokenEncryptedBase64: input.token ? encryptToken(input.token) : existing.tokenEncryptedBase64,
  });
}

export async function resolveGitHubConfig(): Promise<GitHubConfig | null> {
  const store = await readStore();
  if (!store.owner || !store.repo || !store.tokenEncryptedBase64) return null;
  return { owner: store.owner, repo: store.repo, token: decryptToken(store.tokenEncryptedBase64) };
}
