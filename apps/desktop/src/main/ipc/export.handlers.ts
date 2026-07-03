import { ipcMain, dialog, BrowserWindow } from "electron";
import { writeFile } from "node:fs/promises";
import { buildThreeMf, buildStandaloneIniText } from "@layerai/threemf-writer";
import { generatePdfReport } from "@layerai/pdf-report";
import { getPrinterModel, getFilamentBase } from "@layerai/prusa-profile-db";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type {
  ExportThreeMfRequest,
  ExportThreeMfResponse,
  ExportIniRequest,
  ExportIniResponse,
  ExportPdfReportRequest,
  ExportPdfReportResponse,
} from "../../shared/ipc-types.js";

function resolvePrinterAndFilament(printerId: string, filamentId: string) {
  const printer = getPrinterModel(printerId);
  const filament = getFilamentBase(filamentId);
  if (!printer) throw new Error(`Imprimante inconnue : ${printerId}`);
  if (!filament) throw new Error(`Filament inconnu : ${filamentId}`);
  return { printer, filament };
}

export function registerExportHandlers(): void {
  ipcMain.handle(IpcChannels.exportThreeMf, async (event, request: ExportThreeMfRequest): Promise<ExportThreeMfResponse> => {
    const { printer, filament } = resolvePrinterAndFilament(request.printerId, request.filamentId);

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

  ipcMain.handle(IpcChannels.exportIni, async (event, request: ExportIniRequest): Promise<ExportIniResponse> => {
    const { printer, filament } = resolvePrinterAndFilament(request.printerId, request.filamentId);

    const window = BrowserWindow.fromWebContents(event.sender);
    const dialogOptions: Electron.SaveDialogOptions = {
      title: "Exporter le profil PrusaSlicer (.ini)",
      filters: [{ name: "Config PrusaSlicer", extensions: ["ini"] }],
      defaultPath: "profil-layerai.ini",
    };
    const result = window ? await dialog.showSaveDialog(window, dialogOptions) : await dialog.showSaveDialog(dialogOptions);
    if (result.canceled || !result.filePath) return { saved: false };

    await writeFile(result.filePath, buildStandaloneIniText(request.config, printer, filament), "utf-8");
    return { saved: true, filePath: result.filePath };
  });

  ipcMain.handle(IpcChannels.exportPdfReport, async (event, request: ExportPdfReportRequest): Promise<ExportPdfReportResponse> => {
    const { printer, filament } = resolvePrinterAndFilament(request.printerId, request.filamentId);

    const window = BrowserWindow.fromWebContents(event.sender);
    const dialogOptions: Electron.SaveDialogOptions = {
      title: "Exporter le rapport IA",
      filters: [{ name: "Rapport PDF", extensions: ["pdf"] }],
      defaultPath: `rapport-${request.fileName.replace(/\.[^.]+$/, "")}.pdf`,
    };
    const result = window ? await dialog.showSaveDialog(window, dialogOptions) : await dialog.showSaveDialog(dialogOptions);
    if (result.canceled || !result.filePath) return { saved: false };

    const pdf = await generatePdfReport({
      fileName: request.fileName,
      printer,
      filament,
      analysis: request.analysis,
      intent: request.intent,
      config: request.config,
      explanations: request.explanations,
      comparison: request.comparison,
      generatedAt: new Date().toISOString(),
    });
    await writeFile(result.filePath, pdf);
    return { saved: true, filePath: result.filePath };
  });
}
