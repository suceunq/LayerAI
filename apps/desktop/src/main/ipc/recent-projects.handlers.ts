import { ipcMain, app } from "electron";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type { RecentProject, RecordRecentProjectRequest } from "../../shared/ipc-types.js";

const MAX_RECENT_PROJECTS = 20;

function recentProjectsFilePath(): string {
  return join(app.getPath("userData"), "recent-projects.json");
}

async function readRecentProjects(): Promise<RecentProject[]> {
  try {
    const raw = await readFile(recentProjectsFilePath(), "utf-8");
    return JSON.parse(raw) as RecentProject[];
  } catch {
    return [];
  }
}

async function writeRecentProjects(projects: RecentProject[]): Promise<void> {
  await mkdir(app.getPath("userData"), { recursive: true });
  await writeFile(recentProjectsFilePath(), JSON.stringify(projects, null, 2), "utf-8");
}

export function registerRecentProjectsHandlers(): void {
  ipcMain.handle(IpcChannels.recentProjectsList, async (): Promise<RecentProject[]> => readRecentProjects());

  ipcMain.handle(IpcChannels.recentProjectsRecord, async (_event, request: RecordRecentProjectRequest): Promise<RecentProject> => {
    const projects = await readRecentProjects();
    // Re-opening (or re-generating for) the same file replaces its previous entry instead of duplicating it.
    const withoutExisting = projects.filter((p) => p.filePath !== request.filePath);
    const entry: RecentProject = { ...request, id: randomUUID(), lastOpenedAt: new Date().toISOString() };
    const updated = [entry, ...withoutExisting].slice(0, MAX_RECENT_PROJECTS);
    await writeRecentProjects(updated);
    return entry;
  });

  ipcMain.handle(IpcChannels.recentProjectsRemove, async (_event, id: string): Promise<void> => {
    const projects = await readRecentProjects();
    await writeRecentProjects(projects.filter((p) => p.id !== id));
  });
}
