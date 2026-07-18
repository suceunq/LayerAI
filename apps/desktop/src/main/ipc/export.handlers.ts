import { ipcMain, dialog, BrowserWindow } from "electron";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  buildThreeMf,
  buildStandaloneIniText,
  buildStandaloneBambuJsonText,
  validateThreeMf,
  validateStandaloneIniText,
  validateStandaloneBambuJsonText,
} from "@layerai/threemf-writer";
import { generatePdfReport } from "@layerai/pdf-report";
import { getPrinterModel, getFilamentBase } from "@layerai/prusa-profile-db";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type {
  ExportThreeMfRequest,
  ExportThreeMfResponse,
  ExportIniRequest,
  ExportIniResponse,
  ExportBatchIniRequest,
  ExportBatchIniResponse,
  ExportBatchIniResultItem,
  ExportBambuProfileRequest,
  ExportBambuProfileResponse,
  ExportCaptureImageRequest,
  ExportCaptureImageResponse,
  ExportPdfReportRequest,
  ExportPdfReportResponse,
} from "../../shared/ipc-types.js";
import { mainT } from "../localization.js";
import { readSettings } from "../settings-store.js";

const PNG_DATA_URL_PREFIX = "data:image/png;base64,";
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

async function writeAndVerifyThreeMf(path: string, bytes: Uint8Array): Promise<void> {
  await writeFile(path, bytes);
  await validateThreeMf(new Uint8Array(await readFile(path)));
}

async function writeAndVerifyText(path: string, text: string, validate: (value: string) => void): Promise<void> {
  await writeFile(path, text, "utf-8");
  validate(await readFile(path, "utf-8"));
}

async function writeAndVerifyPdf(path: string, bytes: Uint8Array): Promise<void> {
  await writeFile(path, bytes);
  const written = await readFile(path);
  if (written.byteLength < 100 || written.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error(mainT("native.export.invalidPdf"));
  }
}

async function writeAndVerifyPng(path: string, bytes: Uint8Array): Promise<void> {
  await writeFile(path, bytes);
  const written = await readFile(path);
  if (written.byteLength < PNG_SIGNATURE.length || !written.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error(mainT("native.export.invalidPng"));
  }
}

function sanitizeFileNameStem(fileName: string): string {
  const stem = fileName.replace(/\.[^./\\]+$/, "").replace(/[\\/:*?"<>|]+/g, "_").trim();
  return stem || mainT("native.filename.profile");
}

function resolvePrinterAndFilament(printerId: string, filamentId: string) {
  const printer = getPrinterModel(printerId);
  const filament = getFilamentBase(filamentId);
  if (!printer) throw new Error(mainT("native.printer.unknown", { id: printerId }));
  if (!filament) throw new Error(mainT("native.filament.unknown", { id: filamentId }));
  return { printer, filament };
}

export function registerExportHandlers(): void {
  ipcMain.handle(IpcChannels.exportThreeMf, async (event, request: ExportThreeMfRequest): Promise<ExportThreeMfResponse> => {
    const { printer, filament } = resolvePrinterAndFilament(request.printerId, request.filamentId);

    const window = BrowserWindow.fromWebContents(event.sender);
    const dialogOptions: Electron.SaveDialogOptions = {
      title: mainT("native.export.projectTitle"),
      filters: [{ name: mainT("native.export.projectFilter"), extensions: ["3mf"] }],
      defaultPath: `${request.objectName ?? mainT("native.filename.project")}.3mf`,
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
    await writeAndVerifyThreeMf(result.filePath, bytes);
    return { saved: true, filePath: result.filePath };
  });

  ipcMain.handle(IpcChannels.exportIni, async (event, request: ExportIniRequest): Promise<ExportIniResponse> => {
    const { printer, filament } = resolvePrinterAndFilament(request.printerId, request.filamentId);

    const window = BrowserWindow.fromWebContents(event.sender);
    const dialogOptions: Electron.SaveDialogOptions = {
      title: mainT("native.export.prusaTitle"),
      filters: [{ name: mainT("native.export.prusaFilter"), extensions: ["ini"] }],
      defaultPath: `${mainT("native.filename.profile")}.ini`,
    };
    const result = window ? await dialog.showSaveDialog(window, dialogOptions) : await dialog.showSaveDialog(dialogOptions);
    if (result.canceled || !result.filePath) return { saved: false };

    await writeAndVerifyText(result.filePath, buildStandaloneIniText(request.config, printer, filament), validateStandaloneIniText);
    return { saved: true, filePath: result.filePath };
  });

  ipcMain.handle(IpcChannels.exportBatchIni, async (event, request: ExportBatchIniRequest): Promise<ExportBatchIniResponse> => {
    const { printer, filament } = resolvePrinterAndFilament(request.printerId, request.filamentId);

    const window = BrowserWindow.fromWebContents(event.sender);
    const dialogOptions: Electron.OpenDialogOptions = {
      title: mainT("native.export.batchFolderTitle"),
      properties: ["openDirectory", "createDirectory"],
    };
    const result = window ? await dialog.showOpenDialog(window, dialogOptions) : await dialog.showOpenDialog(dialogOptions);
    if (result.canceled || result.filePaths.length === 0) return { folderPath: null, results: [] };
    const folderPath = result.filePaths[0]!;

    const usedNames = new Set<string>();
    const results: ExportBatchIniResultItem[] = [];
    for (const item of request.items) {
      const stem = sanitizeFileNameStem(item.fileName);
      let name = stem;
      for (let n = 2; usedNames.has(name); n += 1) name = `${stem}-${n}`;
      usedNames.add(name);
      const filePath = join(folderPath, `${name}.ini`);
      try {
        await writeAndVerifyText(filePath, buildStandaloneIniText(item.config, printer, filament), validateStandaloneIniText);
        results.push({ fileName: item.fileName, saved: true, filePath });
      } catch (err) {
        results.push({ fileName: item.fileName, saved: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
    return { folderPath, results };
  });

  ipcMain.handle(IpcChannels.exportBambuProfile, async (event, request: ExportBambuProfileRequest): Promise<ExportBambuProfileResponse> => {
    const { printer, filament } = resolvePrinterAndFilament(request.printerId, request.filamentId);

    const isCreality = request.targetSlicer === "crealityPrint";
    const window = BrowserWindow.fromWebContents(event.sender);
    const dialogOptions: Electron.SaveDialogOptions = {
      title: mainT(isCreality ? "native.export.crealityTitle" : "native.export.bambuTitle"),
      filters: [{ name: mainT(isCreality ? "native.export.crealityFilter" : "native.export.bambuFilter"), extensions: ["json"] }],
      defaultPath: `${mainT("native.filename.profile")}-${isCreality ? "creality" : "bambu"}.json`,
    };
    const result = window ? await dialog.showSaveDialog(window, dialogOptions) : await dialog.showSaveDialog(dialogOptions);
    if (result.canceled || !result.filePath) return { saved: false };

    await writeAndVerifyText(
      result.filePath,
      buildStandaloneBambuJsonText(request.config, printer, filament),
      validateStandaloneBambuJsonText,
    );
    return { saved: true, filePath: result.filePath };
  });

  ipcMain.handle(IpcChannels.exportCaptureImage, async (event, request: ExportCaptureImageRequest): Promise<ExportCaptureImageResponse> => {
    if (!request.dataUrl.startsWith(PNG_DATA_URL_PREFIX)) throw new Error(mainT("native.export.invalidCapture"));
    const buffer = Buffer.from(request.dataUrl.slice(PNG_DATA_URL_PREFIX.length), "base64");

    const window = BrowserWindow.fromWebContents(event.sender);
    const dialogOptions: Electron.SaveDialogOptions = {
      title: mainT("native.export.imageTitle"),
      filters: [{ name: mainT("native.export.imageFilter"), extensions: ["png"] }],
      defaultPath: `${request.suggestedFileName ?? mainT("native.filename.capture")}.png`,
    };
    const result = window ? await dialog.showSaveDialog(window, dialogOptions) : await dialog.showSaveDialog(dialogOptions);
    if (result.canceled || !result.filePath) return { saved: false };

    await writeAndVerifyPng(result.filePath, buffer);
    return { saved: true, filePath: result.filePath };
  });

  ipcMain.handle(IpcChannels.exportPdfReport, async (event, request: ExportPdfReportRequest): Promise<ExportPdfReportResponse> => {
    const { printer, filament } = resolvePrinterAndFilament(request.printerId, request.filamentId);
    const settings = await readSettings();

    const window = BrowserWindow.fromWebContents(event.sender);
    const dialogOptions: Electron.SaveDialogOptions = {
      title: mainT("native.export.reportTitle"),
      filters: [{ name: mainT("native.export.reportFilter"), extensions: ["pdf"] }],
      defaultPath: `${mainT("native.filename.report")}-${request.fileName.replace(/\.[^.]+$/, "")}.pdf`,
    };
    const result = window ? await dialog.showSaveDialog(window, dialogOptions) : await dialog.showSaveDialog(dialogOptions);
    if (result.canceled || !result.filePath) return { saved: false };

    const pdf = await generatePdfReport({
      language: settings.language ?? "fr",
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
    await writeAndVerifyPdf(result.filePath, pdf);
    return { saved: true, filePath: result.filePath };
  });
}
