import { ipcMain } from "electron";
import { analyzeMesh, parseStl, parseObj, parseThreeMf, scaleGeometry } from "@layerai/mesh-analysis";
import { generateConfig, computeComparisonMetrics } from "@layerai/config-generator";
import { generateExplanations } from "@layerai/explanation-engine";
import { getAllPrinters, getAllFilaments, getPrinterModel, getFilamentBase } from "@layerai/prusa-profile-db";
import { getOutcomeStats, computeAdjustments, type LearningAdjustment } from "@layerai/learning-store";
import type { GeneratedConfig, IntentTag, MeshGeometryData, IntentResult } from "@layerai/shared-types";
import { IpcChannels } from "../../shared/ipc-channels.js";
import { resolveIntentWithOptionalCloud } from "../ai/cloud-intent.js";
import type {
  AnalysisRunRequest,
  AnalysisRunResponse,
  AnalysisRescaleRequest,
  AnalysisRescaleResponse,
  ConfigGenerateRequest,
  ConfigGenerateResponse,
} from "../../shared/ipc-types.js";
import { getLearningDb } from "./learning.handlers.js";

const INTENT_TAG_THRESHOLD = 0.15;

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

/** Applies learning-store nudges as an additive layer on top of the rule-based config - never overwrites, only shifts. */
function applyLearningAdjustments(config: GeneratedConfig, adjustments: LearningAdjustment[]): GeneratedConfig {
  if (adjustments.length === 0) return config;
  const patched: GeneratedConfig = { ...config };
  for (const adjustment of adjustments) {
    const existing = patched[adjustment.parameterKey];
    if (!existing || typeof existing.value !== "number") continue;
    patched[adjustment.parameterKey] = {
      value: Math.max(0, existing.value + adjustment.delta),
      confidence: Math.max(existing.confidence, 0.55),
      ruleId: adjustment.ruleId,
    };
  }
  return patched;
}

export function registerAnalysisHandlers(): void {
  ipcMain.handle(IpcChannels.analysisRun, async (_event, request: AnalysisRunRequest): Promise<AnalysisRunResponse> => {
    const geometry = await parseImportedFile(request.file);
    return analyzeMesh(geometry);
  });

  ipcMain.handle(IpcChannels.analysisRescale, async (_event, request: AnalysisRescaleRequest): Promise<AnalysisRescaleResponse> => {
    return analyzeMesh(scaleGeometry(request.geometry, request.scaleFactor));
  });

  ipcMain.handle(IpcChannels.configGenerate, async (_event, request: ConfigGenerateRequest): Promise<ConfigGenerateResponse> => {
    const printer = getPrinterModel(request.printerId);
    const filament = getFilamentBase(request.filamentId);
    if (!printer) throw new Error(`Imprimante inconnue : ${request.printerId}`);
    if (!filament) throw new Error(`Filament inconnu : ${request.filamentId}`);

    const intent = await resolveIntentWithOptionalCloud(request.intentText);
    let config = generateConfig({ analysis: request.analysis, intent, printer, filament });

    const activeTags: IntentTag[] = intent.weights.filter((w) => w.weight >= INTENT_TAG_THRESHOLD).map((w) => w.tag);
    const stats = getOutcomeStats(getLearningDb(), request.printerId, request.filamentId, activeTags);
    config = applyLearningAdjustments(config, computeAdjustments(stats));

    const explanations = generateExplanations(config, intent, request.analysis, request.language ?? "fr");

    const neutralIntent: IntentResult = { rawText: "", weights: [], unrecognized: true, languageDetected: "unknown" };
    const baselineConfig = generateConfig({ analysis: request.analysis, intent: neutralIntent, printer, filament });
    const comparison = computeComparisonMetrics(baselineConfig, config, request.analysis, filament);

    return { intent, config, explanations, comparison };
  });

  ipcMain.handle(IpcChannels.profileDbGetPrinters, async () => getAllPrinters());
  ipcMain.handle(IpcChannels.profileDbGetFilaments, async () => getAllFilaments());
}
