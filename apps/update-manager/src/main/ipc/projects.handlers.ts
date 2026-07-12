import { ipcMain, dialog, shell } from "electron";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type { Project, SaveProjectRequest } from "../../shared/ipc-types.js";
import * as projectStore from "../project-store.js";

export function registerProjectsHandlers(): void {
  ipcMain.handle(IpcChannels.projectsList, async (): Promise<Project[]> => projectStore.listProjects());

  ipcMain.handle(IpcChannels.projectsGet, async (_event, id: string): Promise<Project | undefined> => projectStore.getProject(id));

  ipcMain.handle(IpcChannels.projectsCreate, async (_event, request: SaveProjectRequest): Promise<Project> =>
    projectStore.saveProject(request)
  );

  ipcMain.handle(IpcChannels.projectsUpdate, async (_event, request: SaveProjectRequest): Promise<Project> => {
    if (!request.id) throw new Error("Identifiant de projet manquant pour la mise à jour.");
    return projectStore.saveProject(request);
  });

  ipcMain.handle(IpcChannels.projectsDelete, async (_event, id: string): Promise<void> => projectStore.deleteProject(id));

  ipcMain.handle(IpcChannels.projectsOpenStagingFolder, async (_event, id: string): Promise<void> => {
    const resolved = await projectStore.resolveProjectAndStagingFolder(id);
    if (!resolved) throw new Error("Projet introuvable.");
    await shell.openPath(resolved.stagingFolder);
  });

  ipcMain.handle(IpcChannels.dialogPickDirectory, async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0]!;
  });

  ipcMain.handle(IpcChannels.dialogPickIcon, async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Image", extensions: ["png", "jpg", "jpeg", "svg", "ico", "webp"] }],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0]!;
  });
}
