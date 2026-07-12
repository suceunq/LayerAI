import { app, ipcMain } from "electron";
import { copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type { ProjectRecoverySnapshot, SaveProjectRecoveryRequest } from "../../shared/ipc-types.js";

function snapshotPath(): string {
  return join(app.getPath("userData"), "project-recovery.json");
}

function backupPath(): string {
  return `${snapshotPath()}.bak`;
}

function isSnapshot(value: unknown): value is ProjectRecoverySnapshot {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<ProjectRecoverySnapshot>;
  return item.schemaVersion === 1 && typeof item.updatedAt === "string" && typeof item.filePath === "string" && item.filePath.length > 0 &&
    typeof item.fileName === "string" && typeof item.printerId === "string" && typeof item.filamentId === "string" &&
    typeof item.intentText === "string" && (item.config === null || typeof item.config === "object") &&
    Number.isInteger(item.quantity) && Number(item.quantity) >= 1 && typeof item.multiPlateEnabled === "boolean" &&
    Number.isInteger(item.currentPlateIndex) && Number(item.currentPlateIndex) >= 0;
}

async function readCandidate(path: string): Promise<ProjectRecoverySnapshot | null> {
  try {
    const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
    return isSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function readSnapshot(): Promise<ProjectRecoverySnapshot | null> {
  return (await readCandidate(snapshotPath())) ?? readCandidate(backupPath());
}

async function writeSnapshot(snapshot: ProjectRecoverySnapshot): Promise<void> {
  const destination = snapshotPath();
  const temporary = `${destination}.tmp`;
  await mkdir(app.getPath("userData"), { recursive: true });
  try { await copyFile(destination, backupPath()); } catch { /* First save has no previous file. */ }
  await writeFile(temporary, JSON.stringify(snapshot, null, 2), "utf8");
  const verified = await readCandidate(temporary);
  if (!verified) throw new Error("La sauvegarde de récupération générée est invalide.");
  await rm(destination, { force: true });
  await rename(temporary, destination);
}

export function registerProjectRecoveryHandlers(): void {
  ipcMain.handle(IpcChannels.projectRecoveryGet, () => readSnapshot());
  ipcMain.handle(IpcChannels.projectRecoverySave, async (_event, request: SaveProjectRecoveryRequest): Promise<ProjectRecoverySnapshot> => {
    const snapshot: ProjectRecoverySnapshot = { ...request, schemaVersion: 1, updatedAt: new Date().toISOString() };
    if (!isSnapshot(snapshot)) throw new Error("Données de récupération invalides.");
    await writeSnapshot(snapshot);
    return snapshot;
  });
  ipcMain.handle(IpcChannels.projectRecoveryClear, async (): Promise<void> => {
    await Promise.all([rm(snapshotPath(), { force: true }), rm(backupPath(), { force: true }), rm(`${snapshotPath()}.tmp`, { force: true })]);
  });
}
