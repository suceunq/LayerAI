import { safeStorage, app } from "electron";
import { readFile, writeFile, mkdir, rename, rm } from "node:fs/promises";
import { join } from "node:path";
import type { AiProviderId } from "../../shared/ai-providers.js";
import type { AiProviderPublic, SaveAiProviderRequest } from "../../shared/ipc-types.js";
import { mainT } from "../localization.js";

interface StoredAiProvider {
  id: AiProviderId;
  apiKeyEncryptedBase64?: string;
  model?: string;
  baseUrl?: string;
}

interface AiStoreFile {
  providers: StoredAiProvider[];
  defaultProviderId: AiProviderId | null;
  cloudIntentEnabled: boolean;
}

const DEFAULT_STORE: AiStoreFile = { providers: [], defaultProviderId: null, cloudIntentEnabled: false };

function filePath(): string {
  return join(app.getPath("userData"), "ai-providers.json");
}

async function readStore(): Promise<AiStoreFile> {
  try {
    const raw = await readFile(filePath(), "utf-8");
    return { ...DEFAULT_STORE, ...(JSON.parse(raw) as Partial<AiStoreFile>) };
  } catch {
    return DEFAULT_STORE;
  }
}

async function writeStore(store: AiStoreFile): Promise<void> {
  await mkdir(app.getPath("userData"), { recursive: true });
  const temporary = `${filePath()}.tmp`;
  await writeFile(temporary, JSON.stringify(store, null, 2), { encoding: "utf-8", mode: 0o600 });
  await rm(filePath(), { force: true });
  await rename(temporary, filePath());
}

/** OS-level encryption (DPAPI on Windows) via Electron safeStorage. A key is never persisted if secure encryption is unavailable. */
function encryptKey(plain: string): string {
  if (!safeStorage.isEncryptionAvailable()) throw new Error(mainT("native.secureStorage.saveUnavailable"));
  return safeStorage.encryptString(plain).toString("base64");
}

function decryptKey(encryptedBase64: string): string {
  const buf = Buffer.from(encryptedBase64, "base64");
  if (!safeStorage.isEncryptionAvailable()) throw new Error(mainT("native.secureStorage.unavailable"));
  return safeStorage.decryptString(buf);
}

export async function getPublicSettings(): Promise<{
  providers: AiProviderPublic[];
  defaultProviderId: AiProviderId | null;
  cloudIntentEnabled: boolean;
}> {
  const store = await readStore();
  return {
    providers: store.providers.map((p) => ({ id: p.id, hasApiKey: Boolean(p.apiKeyEncryptedBase64), model: p.model, baseUrl: p.baseUrl })),
    defaultProviderId: store.defaultProviderId,
    cloudIntentEnabled: store.cloudIntentEnabled,
  };
}

export async function setCloudIntentEnabled(enabled: boolean): Promise<void> {
  const store = await readStore();
  await writeStore({ ...store, cloudIntentEnabled: enabled });
}

export async function setDefaultProvider(id: AiProviderId | null): Promise<void> {
  const store = await readStore();
  await writeStore({ ...store, defaultProviderId: id });
}

export async function saveProvider(request: SaveAiProviderRequest): Promise<void> {
  const store = await readStore();
  const existing = store.providers.find((p) => p.id === request.id);
  const updated: StoredAiProvider = {
    id: request.id,
    apiKeyEncryptedBase64:
      request.apiKey !== undefined ? (request.apiKey ? encryptKey(request.apiKey) : undefined) : existing?.apiKeyEncryptedBase64,
    model: request.model !== undefined ? request.model || undefined : existing?.model,
    baseUrl: request.baseUrl !== undefined ? request.baseUrl || undefined : existing?.baseUrl,
  };
  const providers = existing ? store.providers.map((p) => (p.id === request.id ? updated : p)) : [...store.providers, updated];
  await writeStore({ ...store, providers });
}

export async function deleteProvider(id: AiProviderId): Promise<void> {
  const store = await readStore();
  const providers = store.providers.filter((p) => p.id !== id);
  const defaultProviderId = store.defaultProviderId === id ? null : store.defaultProviderId;
  await writeStore({ ...store, providers, defaultProviderId });
}

export async function resolveApiKey(id: AiProviderId, overrideKey?: string): Promise<string | undefined> {
  if (overrideKey) return overrideKey;
  const store = await readStore();
  const provider = store.providers.find((p) => p.id === id);
  return provider?.apiKeyEncryptedBase64 ? decryptKey(provider.apiKeyEncryptedBase64) : undefined;
}

export async function getStoredProviderConfig(id: AiProviderId): Promise<{ model?: string; baseUrl?: string } | undefined> {
  const store = await readStore();
  const provider = store.providers.find((p) => p.id === id);
  return provider ? { model: provider.model, baseUrl: provider.baseUrl } : undefined;
}

export async function getDefaultProviderId(): Promise<AiProviderId | null> {
  return (await readStore()).defaultProviderId;
}

export async function getCloudIntentEnabled(): Promise<boolean> {
  return (await readStore()).cloudIntentEnabled;
}
