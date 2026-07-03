import type { MeshAnalysisResult } from "./mesh.js";
import type { IntentResult } from "./intent.js";
import type { PrinterProfile } from "./printer.js";
import type { FilamentProfile } from "./filament.js";

export type ConfigPrimitive = string | number | boolean;

export interface ConfigValue {
  value: ConfigPrimitive;
  /** 0..1 */
  confidence: number;
  /** Identifier of the rule that produced this value; links to an ExplanationSet entry. */
  ruleId: string;
  baselineValue?: ConfigPrimitive;
}

/** Key = PrusaSlicer parameter name, e.g. "layer_height", "fill_density", "nozzle_temperature". */
export type GeneratedConfig = Record<string, ConfigValue>;

export interface ConfigGenerationInput {
  analysis: MeshAnalysisResult;
  intent: IntentResult;
  printer: PrinterProfile;
  filament: FilamentProfile;
}

export interface ComparisonMetrics {
  baselineEstimatedTimeMin: number;
  aiEstimatedTimeMin: number;
  baselineFilamentG: number;
  aiFilamentG: number;
  /** 0..1 relative scores, baseline vs AI compared in the UI. */
  strengthScore: number;
  qualityScore: number;
  timeSavedPercent: number;
  filamentSavedPercent: number;
}
