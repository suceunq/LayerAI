import type { PrinterProfile, FilamentProfile } from "@layerai/shared-types";
import type {
  AnalysisRunRequest,
  AnalysisRunResponse,
  ConfigGenerateRequest,
  ConfigGenerateResponse,
  ExportThreeMfRequest,
  ExportThreeMfResponse,
} from "../shared/ipc-types.js";

export interface ImportedFilePayload {
  fileName: string;
  format: "stl" | "obj" | "3mf";
  data: Uint8Array;
}

export interface LayerAiApi {
  importOpenDialog: () => Promise<ImportedFilePayload | null>;
  importReadDropped: (filePath: string) => Promise<ImportedFilePayload>;
  getPrinters: () => Promise<PrinterProfile[]>;
  getFilaments: () => Promise<FilamentProfile[]>;
  runAnalysis: (request: AnalysisRunRequest) => Promise<AnalysisRunResponse>;
  generateConfig: (request: ConfigGenerateRequest) => Promise<ConfigGenerateResponse>;
  exportThreeMf: (request: ExportThreeMfRequest) => Promise<ExportThreeMfResponse>;
  exportPdfReport: (payload: unknown) => Promise<unknown>;
  recordOutcome: (payload: unknown) => Promise<unknown>;
}
