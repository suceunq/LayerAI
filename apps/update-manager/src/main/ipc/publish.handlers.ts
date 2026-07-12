import { ipcMain, dialog, BrowserWindow, app } from "electron";
import { basename, dirname, join, relative, isAbsolute } from "node:path";
import { stat, readFile } from "node:fs/promises";
import { publishRelease, appendHistoryEntry, readHistory, type PublishHistoryEntry } from "@layerai/update-publisher";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type { PickedFile, PublishRunRequest, PublishRunResponse, ReleaseManifest } from "../../shared/ipc-types.js";
import * as projectStore from "../project-store.js";

/** Raw, minimal manifest a project's own build script may drop into its staging folder - file names
 * only, resolved against the manifest's own folder at import time so the whole folder can be moved. */
interface RawReleaseManifest {
  version: string;
  title: string;
  changelog: string;
  files: string[];
}

function isRawReleaseManifest(value: unknown): value is RawReleaseManifest {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["version"] === "string" &&
    typeof v["title"] === "string" &&
    typeof v["changelog"] === "string" &&
    Array.isArray(v["files"]) &&
    v["files"].every((f) => typeof f === "string")
  );
}

function broadcastProgress(event: unknown): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IpcChannels.publishProgress, event);
  }
}

export function registerPublishHandlers(): void {
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

  ipcMain.handle(IpcChannels.manifestPick, async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Manifeste de version", extensions: ["json"] }],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0]!;
  });

  ipcMain.handle(IpcChannels.manifestImport, async (_event, manifestPath: string): Promise<ReleaseManifest> => {
    const raw = JSON.parse(await readFile(manifestPath, "utf-8")) as unknown;
    if (!isRawReleaseManifest(raw)) {
      throw new Error("Ce fichier n'est pas un manifeste de version valide.");
    }

    const manifestDir = dirname(manifestPath);
    const files: PickedFile[] = [];
    const missing: string[] = [];
    for (const fileName of raw.files) {
      const filePath = join(manifestDir, fileName);
      // Manifest file names must resolve to siblings of the manifest itself - reject any entry
      // whose relative path escapes manifestDir (e.g. "../../secrets.txt") before touching disk.
      const rel = relative(manifestDir, filePath);
      if (rel.startsWith("..") || isAbsolute(rel)) {
        missing.push(fileName);
        continue;
      }
      try {
        const stats = await stat(filePath);
        files.push({ path: filePath, name: fileName, sizeBytes: stats.size });
      } catch {
        missing.push(fileName);
      }
    }
    if (missing.length > 0) {
      throw new Error(`Fichier(s) introuvable(s) à côté du manifeste : ${missing.join(", ")}`);
    }

    return { version: raw.version, title: raw.title, changelog: raw.changelog, files };
  });

  ipcMain.handle(IpcChannels.historyList, async (_event, projectId: string): Promise<PublishHistoryEntry[]> =>
    readHistory(projectStore.historyFilePath(projectId))
  );

  ipcMain.handle(IpcChannels.publishRun, async (_event, request: PublishRunRequest): Promise<PublishRunResponse> => {
    const config = await projectStore.resolveGitHubConfig(request.projectId);
    if (!config) {
      return {
        success: false,
        errorMessage: "Ce projet n'a pas de compte GitHub configuré. Ouvrez le projet et associez-lui un compte GitHub.",
      };
    }

    const files = request.filePaths.map((filePath) => ({ path: filePath, name: basename(filePath) }));
    const historyPath = projectStore.historyFilePath(request.projectId);

    try {
      const result = await publishRelease(
        config,
        {
          version: request.version,
          title: request.title,
          changelog: request.changelog,
          files,
          prerelease: request.prerelease,
          verifyAll: request.verifyAll,
        },
        (event) => broadcastProgress(event)
      );
      await appendHistoryEntry(historyPath, {
        version: request.version,
        title: request.title,
        publishedAt: new Date().toISOString(),
        status: "success",
        releaseUrl: result.releaseUrl,
        fileNames: files.map((f) => f.name),
        verified: result.verified,
      });
      if (!request.prerelease) await projectStore.setProjectVersion(request.projectId, request.version);
      return { success: true, releaseUrl: result.releaseUrl, verified: result.verified };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await appendHistoryEntry(historyPath, {
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
