import type { PrinterProfile, FilamentProfile } from "@layerai/shared-types";
import type {
  AnalysisRunRequest,
  AnalysisRunResponse,
  ConfigGenerateRequest,
  ConfigGenerateResponse,
  ExportThreeMfRequest,
  ExportThreeMfResponse,
  ExportIniRequest,
  ExportIniResponse,
  ExportPdfReportRequest,
  ExportPdfReportResponse,
  CustomProfile,
  SaveCustomProfileRequest,
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
  exportIni: (request: ExportIniRequest) => Promise<ExportIniResponse>;
  exportPdfReport: (request: ExportPdfReportRequest) => Promise<ExportPdfReportResponse>;
  recordOutcome: (payload: unknown) => Promise<unknown>;
  getCustomProfiles: () => Promise<CustomProfile[]>;
  saveCustomProfile: (request: SaveCustomProfileRequest) => Promise<CustomProfile>;
  deleteCustomProfile: (id: string) => Promise<void>;
}
