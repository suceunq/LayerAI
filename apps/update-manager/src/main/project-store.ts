import { safeStorage, app } from "electron";
import { randomUUID } from "node:crypto";
import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { join, extname } from "node:path";
import type { GitHubConfig } from "@layerai/update-publisher";
import type { Project, SaveProjectRequest, GitHubProfile, SaveGitHubProfileRequest } from "../shared/ipc-types.js";

interface StoredGitHubProfile {
  id: string;
  label: string;
  owner: string;
  tokenEncryptedBase64: string;
  createdAt: string;
}

type StoredProject = Omit<Project, "iconDataUrl">;

interface StoreShape {
  schemaVersion: 2;
  githubProfiles: StoredGitHubProfile[];
  projects: StoredProject[];
}

const EMPTY_STORE: StoreShape = { schemaVersion: 2, githubProfiles: [], projects: [] };

function filePath(): string {
  return join(app.getPath("userData"), "update-manager-store.json");
}

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(filePath(), "utf-8");
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    return { schemaVersion: 2, githubProfiles: parsed.githubProfiles ?? [], projects: parsed.projects ?? [] };
  } catch {
    return EMPTY_STORE;
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  await mkdir(app.getPath("userData"), { recursive: true });
  const tempPath = `${filePath()}.tmp`;
  await writeFile(tempPath, JSON.stringify(store, null, 2), "utf-8");
  await rename(tempPath, filePath());
}

/**
 * OS-level encryption (DPAPI on Windows) via Electron safeStorage. Refuses to persist a token when
 * encryption is unavailable on this system rather than silently falling back to plaintext base64 -
 * a token stored that way would be trivially recoverable by anything that can read userData.
 */
function encryptToken(plain: string): string {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(
      "Le chiffrement sécurisé (Windows DPAPI) n'est pas disponible sur ce système. Impossible d'enregistrer le jeton en toute sécurité - le compte GitHub n'a pas été ajouté."
    );
  }
  return safeStorage.encryptString(plain).toString("base64");
}

function decryptToken(encryptedBase64: string): string {
  try {
    return safeStorage.decryptString(Buffer.from(encryptedBase64, "base64"));
  } catch {
    throw new Error("Le jeton enregistré est illisible sur cette machine (compte Windows différent ?). Reconfigurez ce compte GitHub.");
  }
}

function toPublicProfile(p: StoredGitHubProfile): GitHubProfile {
  return { id: p.id, label: p.label, owner: p.owner, hasToken: Boolean(p.tokenEncryptedBase64), createdAt: p.createdAt };
}

const ICON_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

async function resolveIconDataUrl(iconPath: string | null): Promise<string | null> {
  if (!iconPath) return null;
  const mime = ICON_MIME[extname(iconPath).toLowerCase()];
  if (!mime) return null;
  try {
    const data = await readFile(iconPath);
    return `data:${mime};base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}

async function toPublicProject(p: StoredProject): Promise<Project> {
  return { ...p, iconDataUrl: await resolveIconDataUrl(p.iconPath) };
}

// --- GitHub profiles ---

export async function listGitHubProfiles(): Promise<GitHubProfile[]> {
  const store = await readStore();
  return store.githubProfiles.map(toPublicProfile);
}

export async function saveGitHubProfile(input: SaveGitHubProfileRequest): Promise<GitHubProfile> {
  const store = await readStore();

  if (input.id) {
    const existing = store.githubProfiles.find((p) => p.id === input.id);
    if (!existing) throw new Error("Compte GitHub introuvable.");
    existing.label = input.label;
    existing.owner = input.owner;
    if (input.token) existing.tokenEncryptedBase64 = encryptToken(input.token);
    await writeStore(store);
    return toPublicProfile(existing);
  }

  if (!input.token) throw new Error("Un jeton d'accès personnel est requis pour ajouter un compte GitHub.");
  const profile: StoredGitHubProfile = {
    id: randomUUID(),
    label: input.label,
    owner: input.owner,
    tokenEncryptedBase64: encryptToken(input.token),
    createdAt: new Date().toISOString(),
  };
  store.githubProfiles.push(profile);
  await writeStore(store);
  return toPublicProfile(profile);
}

export async function deleteGitHubProfile(id: string): Promise<void> {
  const store = await readStore();
  if (store.projects.some((p) => p.githubProfileId === id)) {
    throw new Error("Ce compte GitHub est utilisé par au moins un projet. Réassignez ou supprimez ces projets avant de le supprimer.");
  }
  store.githubProfiles = store.githubProfiles.filter((p) => p.id !== id);
  await writeStore(store);
}

// --- Projects ---

export async function listProjects(): Promise<Project[]> {
  const store = await readStore();
  return Promise.all(store.projects.map(toPublicProject));
}

export async function getProject(id: string): Promise<Project | undefined> {
  const store = await readStore();
  const project = store.projects.find((p) => p.id === id);
  return project ? toPublicProject(project) : undefined;
}

export function stagingFolderPath(project: Pick<StoredProject, "workingDirectory" | "stagingFolderName">): string {
  return join(project.workingDirectory, project.stagingFolderName);
}

export async function saveProject(input: SaveProjectRequest): Promise<Project> {
  const store = await readStore();
  if (!store.githubProfiles.some((p) => p.id === input.githubProfileId)) {
    throw new Error("Compte GitHub introuvable pour ce projet.");
  }
  const now = new Date().toISOString();

  let project: StoredProject;
  if (input.id) {
    const existing = store.projects.find((p) => p.id === input.id);
    if (!existing) throw new Error("Projet introuvable.");
    Object.assign(existing, {
      name: input.name,
      description: input.description,
      iconPath: input.iconPath,
      workingDirectory: input.workingDirectory,
      stagingFolderName: input.stagingFolderName,
      rawManifestFileName: input.rawManifestFileName,
      githubProfileId: input.githubProfileId,
      repo: input.repo,
      downloadUrl: input.downloadUrl,
      updatedAt: now,
    });
    project = existing;
  } else {
    project = {
      id: randomUUID(),
      name: input.name,
      description: input.description,
      iconPath: input.iconPath,
      workingDirectory: input.workingDirectory,
      stagingFolderName: input.stagingFolderName,
      rawManifestFileName: input.rawManifestFileName,
      githubProfileId: input.githubProfileId,
      repo: input.repo,
      downloadUrl: input.downloadUrl,
      currentVersion: null,
      createdAt: now,
      updatedAt: now,
    };
    store.projects.push(project);
  }
  await writeStore(store);
  await mkdir(stagingFolderPath(project), { recursive: true });
  return toPublicProject(project);
}

export async function deleteProject(id: string): Promise<void> {
  const store = await readStore();
  store.projects = store.projects.filter((p) => p.id !== id);
  await writeStore(store);
}

export async function setProjectVersion(id: string, version: string): Promise<void> {
  const store = await readStore();
  const project = store.projects.find((p) => p.id === id);
  if (!project) return;
  project.currentVersion = version;
  project.updatedAt = new Date().toISOString();
  await writeStore(store);
}

export async function resolveGitHubConfig(projectId: string): Promise<GitHubConfig | null> {
  const store = await readStore();
  const project = store.projects.find((p) => p.id === projectId);
  if (!project) return null;
  const profile = store.githubProfiles.find((p) => p.id === project.githubProfileId);
  if (!profile) return null;
  return { owner: profile.owner, repo: project.repo, token: decryptToken(profile.tokenEncryptedBase64) };
}

export async function resolveProjectAndStagingFolder(projectId: string): Promise<{ project: Project; stagingFolder: string } | null> {
  const store = await readStore();
  const project = store.projects.find((p) => p.id === projectId);
  if (!project) return null;
  return { project: await toPublicProject(project), stagingFolder: stagingFolderPath(project) };
}

export function historyFilePath(projectId: string): string {
  return join(app.getPath("userData"), "history", `${projectId}.json`);
}
