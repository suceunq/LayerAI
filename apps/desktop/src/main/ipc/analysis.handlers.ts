import { ipcMain } from "electron";
import { analyzeMesh, parseStl, parseObj, parseThreeMf } from "@layerai/mesh-analysis";
import { resolveIntent } from "@layerai/intent-engine";
import { generateConfig } from "@layerai/config-generator";
import { generateExplanations } from "@layerai/explanation-engine";
import { getAllPrinters, getAllFilaments, getPrinterModel, getFilamentBase } from "@layerai/prusa-profile-db";
import type { MeshGeometryData } from "@layerai/shared-types";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type { AnalysisRunRequest, AnalysisRunResponse, ConfigGenerateRequest, ConfigGenerateResponse } from "../../shared/ipc-types.js";

async function parseImportedFile(file: AnalysisRunRequest["file"]): Promise<MeshGeometryData> {
  const bytes = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
  switch (file.format) {
    case "stl":
      return parseStl(bytes);
    case "obj":
      return parseObj(new TextDecoder("utf-8").decode(bytes));
    case "3mf":
      return parseThreeMf(bytes);
  }
}

export function registerAnalysisHandlers(): void {
  ipcMain.handle(IpcChannels.analysisRun, async (_event, request: AnalysisRunRequest): Promise<AnalysisRunResponse> => {
    const geometry = await parseImportedFile(request.file);
    return analyzeMesh(geometry);
  });

  ipcMain.handle(IpcChannels.configGenerate, async (_event, request: ConfigGenerateRequest): Promise<ConfigGenerateResponse> => {
    const printer = getPrinterModel(request.printerId);
    const filament = getFilamentBase(request.filamentId);
    if (!printer) throw new Error(`Imprimante inconnue : ${request.printerId}`);
    if (!filament) throw new Error(`Filament inconnu : ${request.filamentId}`);

    const intent = resolveIntent(request.intentText);
    const config = generateConfig({ analysis: request.analysis, intent, printer, filament });
    const explanations = generateExplanations(config, intent, request.analysis);

    return { intent, config, explanations };
  });

  ipcMain.handle(IpcChannels.profileDbGetPrinters, async () => getAllPrinters());
  ipcMain.handle(IpcChannels.profileDbGetFilaments, async () => getAllFilaments());
}
