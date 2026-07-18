import { ipcMain } from "electron";
import { generateConfig, computeComparisonMetrics } from "@layerai/config-generator";
import { generateExplanations } from "@layerai/explanation-engine";
import { getAllPrinters, getAllFilaments, getPrinterModel, getFilamentBase } from "@layerai/prusa-profile-db";
import { getOutcomeStats, computeAdjustments, type LearningAdjustment } from "@layerai/learning-store";
import type { GeneratedConfig, IntentTag, IntentResult } from "@layerai/shared-types";
import { IpcChannels } from "../../shared/ipc-channels.js";
import { resolveIntentWithOptionalCloud } from "../ai/cloud-intent.js";
import type {
  AnalysisRunRequest,
  AnalysisRunResponse,
  AnalysisRescaleRequest,
  AnalysisRescaleResponse,
  AnalysisReorientRequest,
  AnalysisReorientResponse,
  ConfigGenerateRequest,
  ConfigGenerateResponse,
} from "../../shared/ipc-types.js";
import { getLearningDb } from "./learning.handlers.js";
import { runAnalysisJob } from "../analysis-worker-client.js";
import { mainT } from "../localization.js";

const INTENT_TAG_THRESHOLD = 0.15;

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
    const data = request.file.data instanceof Uint8Array ? request.file.data : new Uint8Array(request.file.data);
    return runAnalysisJob({ kind: "analyze", format: request.file.format, data });
  });

  ipcMain.handle(IpcChannels.analysisRescale, async (_event, request: AnalysisRescaleRequest): Promise<AnalysisRescaleResponse> => {
    return runAnalysisJob({ kind: "rescale", geometry: request.geometry, scaleFactor: request.scaleFactor });
  });

  ipcMain.handle(IpcChannels.analysisReorient, async (_event, request: AnalysisReorientRequest): Promise<AnalysisReorientResponse> => {
    return runAnalysisJob({ kind: "reorient", geometry: request.geometry, quaternion: request.quaternion });
  });

  ipcMain.handle(IpcChannels.configGenerate, async (_event, request: ConfigGenerateRequest): Promise<ConfigGenerateResponse> => {
    const printer = getPrinterModel(request.printerId);
    const filament = getFilamentBase(request.filamentId);
    if (!printer) throw new Error(mainT("native.printer.unknown", { id: request.printerId }));
    if (!filament) throw new Error(mainT("native.filament.unknown", { id: request.filamentId }));

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
