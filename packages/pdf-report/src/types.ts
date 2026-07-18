import type {
  ComparisonMetrics,
  ExplanationSet,
  FilamentProfile,
  GeneratedConfig,
  IntentResult,
  MeshAnalysisResult,
  PrinterProfile,
} from "@layerai/shared-types";

export interface ReportData {
  language: "fr" | "en" | "de" | "es" | "it";
  fileName: string;
  printer: PrinterProfile;
  filament: FilamentProfile;
  analysis: MeshAnalysisResult;
  intent: IntentResult;
  config: GeneratedConfig;
  explanations: ExplanationSet;
  comparison: ComparisonMetrics;
  generatedAt: string;
  /** Number of copies of this part in the batch. Defaults to 1 (report describes a single piece). */
  quantity?: number;
}
