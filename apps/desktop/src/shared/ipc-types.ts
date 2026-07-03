import type { AnalyzedMesh, ExplanationSet, GeneratedConfig, IntentResult, MeshGeometryData } from "@layerai/shared-types";
import type { ImportedFilePayload } from "../preload/api.js";

export interface AnalysisRunRequest {
  file: ImportedFilePayload;
}

export type AnalysisRunResponse = AnalyzedMesh;

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
}

export interface ExportThreeMfRequest {
  geometry: MeshGeometryData;
  config: GeneratedConfig;
  printerId: string;
  filamentId: string;
  objectName?: string;
}

export type ExportThreeMfResponse = { saved: true; filePath: string } | { saved: false };
