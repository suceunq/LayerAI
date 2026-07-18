import { ipcMain, dialog, BrowserWindow } from "electron";
import { readFile, stat } from "node:fs/promises";
import { extname, basename } from "node:path";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type { ImportBatchDialogResult, ImportedFilePayload } from "../../preload/api.js";
import { MAX_BATCH_FILES, MAX_MODEL_FILE_BYTES } from "../security/input-policy.js";
import { mainT } from "../localization.js";

const SUPPORTED_EXTENSIONS = new Set(["stl", "obj", "3mf"]);

function detectFormat(filePath: string): ImportedFilePayload["format"] | null {
  const ext = extname(filePath).slice(1).toLowerCase();
  return SUPPORTED_EXTENSIONS.has(ext) ? (ext as ImportedFilePayload["format"]) : null;
}

async function readModelFile(filePath: string): Promise<ImportedFilePayload> {
  const format = detectFormat(filePath);
  if (!format) throw new Error(mainT("native.import.unsupported", { path: filePath }));
  const info = await stat(filePath);
  if (!info.isFile()) throw new Error(mainT("native.import.notFile"));
  if (info.size <= 0 || info.size > MAX_MODEL_FILE_BYTES) throw new Error(mainT("native.import.tooLarge"));
  const data = await readFile(filePath);
  return { fileName: basename(filePath), filePath, format, data: new Uint8Array(data.buffer, data.byteOffset, data.byteLength) };
}

export function registerImportHandlers(): void {
  ipcMain.handle(IpcChannels.importOpenDialog, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const dialogOptions: Electron.OpenDialogOptions = {
      title: mainT("native.import.title"),
      properties: ["openFile"],
      filters: [{ name: mainT("native.import.filter"), extensions: ["stl", "obj", "3mf"] }],
    };
    const result = window
      ? await dialog.showOpenDialog(window, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions);
    if (result.canceled || result.filePaths.length === 0) return null;
    return readModelFile(result.filePaths[0]!);
  });

  ipcMain.handle(IpcChannels.importOpenBatchDialog, async (event): Promise<ImportBatchDialogResult> => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const dialogOptions: Electron.OpenDialogOptions = {
      title: mainT("native.import.title"),
      properties: ["openFile", "multiSelections"],
      filters: [{ name: mainT("native.import.filter"), extensions: ["stl", "obj", "3mf"] }],
    };
    const result = window
      ? await dialog.showOpenDialog(window, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions);
    if (result.canceled || result.filePaths.length === 0) return { files: [], failed: [] };

    const files: ImportedFilePayload[] = [];
    const failed: { path: string; error: string }[] = [];
    for (const path of result.filePaths.slice(0, MAX_BATCH_FILES)) {
      try {
        files.push(await readModelFile(path));
      } catch (err) {
        failed.push({ path, error: err instanceof Error ? err.message : String(err) });
      }
    }
    return { files, failed };
  });

  ipcMain.handle(IpcChannels.importReadDropped, async (_event, filePath: string) => {
    return readModelFile(filePath);
  });
}
