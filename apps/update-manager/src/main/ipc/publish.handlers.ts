import { ipcMain, dialog, BrowserWindow, app } from "electron";
import { basename, join } from "node:path";
import { stat } from "node:fs/promises";
import { publishRelease, appendHistoryEntry, readHistory, type PublishHistoryEntry } from "@layerai/update-publisher";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type {
  PickedFile,
  PublisherConfig,
  PublishRunRequest,
  PublishRunResponse,
  SavePublisherConfigRequest,
} from "../../shared/ipc-types.js";
import * as configStore from "../config-store.js";

function historyFilePath(): string {
  return join(app.getPath("userData"), "publish-history.json");
}

function broadcastProgress(event: unknown): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IpcChannels.publishProgress, event);
  }
}

export function registerPublishHandlers(): void {
  ipcMain.handle(IpcChannels.configGet, async (): Promise<PublisherConfig> => configStore.getPublicConfig());

  ipcMain.handle(IpcChannels.configSave, async (_event, request: SavePublisherConfigRequest): Promise<void> => {
    await configStore.saveConfig(request);
  });

  ipcMain.handle(IpcChannels.filesPick, async (): Promise<PickedFile[]> => {
    const result = await dialog.showOpenDialog({ properties: ["openFile", "multiSelections"] });
    if (result.canceled) return [];
    const files: PickedFile[] = [];
    for (const filePath of result.filePaths) {
      const stats = await stat(filePath);
      files.push({ path: filePath, name: basename(filePath), sizeBytes: stats.size });
    }
    return files;
  });

  ipcMain.handle(IpcChannels.historyList, async (): Promise<PublishHistoryEntry[]> => readHistory(historyFilePath()));

  ipcMain.handle(IpcChannels.publishRun, async (_event, request: PublishRunRequest): Promise<PublishRunResponse> => {
    const config = await configStore.resolveGitHubConfig();
    if (!config) {
      return {
        success: false,
        errorMessage: "Configurez d'abord le dépôt GitHub et le jeton d'accès personnel dans l'onglet Configuration.",
      };
    }

    const files = request.filePaths.map((filePath) => ({ path: filePath, name: basename(filePath) }));

    try {
      const result = await publishRelease(
        config,
        { version: request.version, title: request.title, changelog: request.changelog, files, prerelease: request.prerelease },
        (event) => broadcastProgress(event)
      );
      await appendHistoryEntry(historyFilePath(), {
        version: request.version,
        title: request.title,
        publishedAt: new Date().toISOString(),
        status: "success",
        releaseUrl: result.releaseUrl,
        fileNames: files.map((f) => f.name),
      });
      return { success: true, releaseUrl: result.releaseUrl };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await appendHistoryEntry(historyFilePath(), {
        version: request.version,
        title: request.title,
        publishedAt: new Date().toISOString(),
        status: "failed",
        errorMessage,
        fileNames: files.map((f) => f.name),
      });
      return { success: false, errorMessage };
    }
  });

  ipcMain.handle(IpcChannels.appGetVersion, (): string => app.getVersion());
}
