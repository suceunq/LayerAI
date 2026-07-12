import { ipcMain, dialog, BrowserWindow } from "electron";
import { readFile } from "node:fs/promises";
import { extname, basename } from "node:path";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type { ImportedFilePayload } from "../../preload/api.js";

const SUPPORTED_EXTENSIONS = new Set(["stl", "obj", "3mf"]);

function detectFormat(filePath: string): ImportedFilePayload["format"] | null {
  const ext = extname(filePath).slice(1).toLowerCase();
  return SUPPORTED_EXTENSIONS.has(ext) ? (ext as ImportedFilePayload["format"]) : null;
}

async function readModelFile(filePath: string): Promise<ImportedFilePayload> {
  const format = detectFormat(filePath);
  if (!format) throw new Error(`Format de fichier non supporté : ${filePath}`);
  const data = await readFile(filePath);
  return { fileName: basename(filePath), filePath, format, data: new Uint8Array(data.buffer, data.byteOffset, data.byteLength) };
}

export function registerImportHandlers(): void {
  ipcMain.handle(IpcChannels.importOpenDialog, async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const dialogOptions: Electron.OpenDialogOptions = {
      title: "Importer un modèle 3D",
      properties: ["openFile"],
      filters: [{ name: "Modèles 3D", extensions: ["stl", "obj", "3mf"] }],
    };
    const result = window
      ? await dialog.showOpenDialog(window, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions);
    if (result.canceled || result.filePaths.length === 0) return null;
    return readModelFile(result.filePaths[0]!);
  });

  ipcMain.handle(IpcChannels.importReadDropped, async (_event, filePath: string) => {
    return readModelFile(filePath);
  });
}
