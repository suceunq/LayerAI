import { ipcMain, dialog, BrowserWindow } from "electron";
import { writeFile } from "node:fs/promises";
import { buildThreeMf, buildStandaloneIniText, buildStandaloneBambuJsonText } from "@layerai/threemf-writer";
import { generatePdfReport } from "@layerai/pdf-report";
import { getPrinterModel, getFilamentBase } from "@layerai/prusa-profile-db";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type {
  ExportThreeMfRequest,
  ExportThreeMfResponse,
  ExportIniRequest,
  ExportIniResponse,
  ExportBambuProfileRequest,
  ExportBambuProfileResponse,
  ExportCaptureImageRequest,
  ExportCaptureImageResponse,
  ExportPdfReportRequest,
  ExportPdfReportResponse,
} from "../../shared/ipc-types.js";

const PNG_DATA_URL_PREFIX = "data:image/png;base64,";

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
      positions: request.positions,
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

  ipcMain.handle(IpcChannels.exportBambuProfile, async (event, request: ExportBambuProfileRequest): Promise<ExportBambuProfileResponse> => {
    const { printer, filament } = resolvePrinterAndFilament(request.printerId, request.filamentId);

    const isCreality = request.targetSlicer === "crealityPrint";
    const window = BrowserWindow.fromWebContents(event.sender);
    const dialogOptions: Electron.SaveDialogOptions = {
      title: isCreality ? "Exporter le profil Creality Print (.json)" : "Exporter le profil Bambu Studio (.json)",
      filters: [{ name: isCreality ? "Preset Creality Print" : "Preset Bambu Studio", extensions: ["json"] }],
      defaultPath: isCreality ? "profil-layerai-creality.json" : "profil-layerai-bambu.json",
    };
    const result = window ? await dialog.showSaveDialog(window, dialogOptions) : await dialog.showSaveDialog(dialogOptions);
    if (result.canceled || !result.filePath) return { saved: false };

    await writeFile(result.filePath, buildStandaloneBambuJsonText(request.config, printer, filament), "utf-8");
    return { saved: true, filePath: result.filePath };
  });

  ipcMain.handle(IpcChannels.exportCaptureImage, async (event, request: ExportCaptureImageRequest): Promise<ExportCaptureImageResponse> => {
    if (!request.dataUrl.startsWith(PNG_DATA_URL_PREFIX)) throw new Error("Format d'image de capture invalide.");
    const buffer = Buffer.from(request.dataUrl.slice(PNG_DATA_URL_PREFIX.length), "base64");

    const window = BrowserWindow.fromWebContents(event.sender);
    const dialogOptions: Electron.SaveDialogOptions = {
      title: "Enregistrer l'image",
      filters: [{ name: "Image PNG", extensions: ["png"] }],
      defaultPath: `${request.suggestedFileName ?? "layerai-capture"}.png`,
    };
    const result = window ? await dialog.showSaveDialog(window, dialogOptions) : await dialog.showSaveDialog(dialogOptions);
    if (result.canceled || !result.filePath) return { saved: false };

    await writeFile(result.filePath, buffer);
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
      quantity: request.quantity,
    });
    await writeFile(result.filePath, pdf);
    return { saved: true, filePath: result.filePath };
  });
}
