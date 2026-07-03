import { ipcMain, dialog, BrowserWindow } from "electron";
import { writeFile } from "node:fs/promises";
import { buildThreeMf } from "@layerai/threemf-writer";
import { getPrinterModel, getFilamentBase } from "@layerai/prusa-profile-db";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type { ExportThreeMfRequest, ExportThreeMfResponse } from "../../shared/ipc-types.js";

export function registerExportHandlers(): void {
  ipcMain.handle(IpcChannels.exportThreeMf, async (event, request: ExportThreeMfRequest): Promise<ExportThreeMfResponse> => {
    const printer = getPrinterModel(request.printerId);
    const filament = getFilamentBase(request.filamentId);
    if (!printer) throw new Error(`Imprimante inconnue : ${request.printerId}`);
    if (!filament) throw new Error(`Filament inconnu : ${request.filamentId}`);

    const window = BrowserWindow.fromWebContents(event.sender);
    const dialogOptions: Electron.SaveDialogOptions = {
      title: "Exporter le projet PrusaSlicer",
      filters: [{ name: "Projet 3MF", extensions: ["3mf"] }],
      defaultPath: `${request.objectName ?? "projet-layerai"}.3mf`,
    };
    const result = window ? await dialog.showSaveDialog(window, dialogOptions) : await dialog.showSaveDialog(dialogOptions);
    if (result.canceled || !result.filePath) return { saved: false };

    const bytes = await buildThreeMf({
      geometry: request.geometry,
      config: request.config,
      printer,
      filament,
      objectName: request.objectName,
    });
    await writeFile(result.filePath, bytes);
    return { saved: true, filePath: result.filePath };
  });

  ipcMain.handle(IpcChannels.exportPdfReport, async () => {
    throw new Error("export:pdf-report not implemented yet");
  });
}
