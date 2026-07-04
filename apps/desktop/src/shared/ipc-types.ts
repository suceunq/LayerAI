import type {
  AnalyzedMesh,
  ComparisonMetrics,
  ExplanationSet,
  GeneratedConfig,
  IntentResult,
  IntentTag,
  MeshGeometryData,
  PrintOutcomeId,
} from "@layerai/shared-types";
import type { ImportedFilePayload } from "../preload/api.js";

export interface AnalysisRunRequest {
  file: ImportedFilePayload;
}

export type AnalysisRunResponse = AnalyzedMesh;

export interface AnalysisRescaleRequest {
  geometry: MeshGeometryData;
  scaleFactor: number;
}

export type AnalysisRescaleResponse = AnalyzedMesh;

export interface ConfigGenerateRequest {
  geometry: MeshGeometryData;
  analysis: AnalyzedMesh["analysis"];
  intentText: string;
  printerId: string;
  filamentId: string;
}

export interface ConfigGenerateResponse {
  intent: IntentResult;
  config: GeneratedConfig;
  explanations: ExplanationSet;
  comparison: ComparisonMetrics;
}

export interface ExportThreeMfRequest {
  geometry: MeshGeometryData;
  config: GeneratedConfig;
  printerId: string;
  filamentId: string;
  objectName?: string;
}

export type ExportThreeMfResponse = { saved: true; filePath: string } | { saved: false };

export interface CustomProfile {
  id: string;
  name: string;
  intentText: string;
  printerId: string;
  filamentId: string;
  createdAt: string;
}

export type SaveCustomProfileRequest = Omit<CustomProfile, "id" | "createdAt">;

export interface ExportIniRequest {
  config: GeneratedConfig;
  printerId: string;
  filamentId: string;
}

export type ExportIniResponse = { saved: true; filePath: string } | { saved: false };

export interface OpenInSlicerRequest {
  geometry: MeshGeometryData;
  config: GeneratedConfig;
  printerId: string;
  filamentId: string;
  objectName?: string;
}

export type OpenInSlicerResponse =
  | { opened: true; slicerName: string }
  | { opened: false; canceled: true }
  | { opened: false; canceled: false; message: string };

export interface ExportPdfReportRequest {
  fileName: string;
  printerId: string;
  filamentId: string;
  analysis: AnalyzedMesh["analysis"];
  intent: IntentResult;
  config: GeneratedConfig;
  explanations: ExplanationSet;
  comparison: ComparisonMetrics;
}

export type ExportPdfReportResponse = { saved: true; filePath: string } | { saved: false };

export interface RecordOutcomeRequest {
  analysis: AnalyzedMesh["analysis"];
  printerId: string;
  filamentId: string;
  intentTags: IntentTag[];
  configUsed: GeneratedConfig;
  outcome: PrintOutcomeId;
  notes?: string;
}

export interface AppSettings {
  onboardingCompleted: boolean;
  prusaSlicerPath?: string;
  bambuStudioPath?: string;
}
