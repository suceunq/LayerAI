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
  fileName: string;
  printer: PrinterProfile;
  filament: FilamentProfile;
  analysis: MeshAnalysisResult;
  intent: IntentResult;
  config: GeneratedConfig;
  explanations: ExplanationSet;
  comparison: ComparisonMetrics;
  generatedAt: string;
}
