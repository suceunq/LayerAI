import type { PrinterProfile, FilamentProfile } from "@layerai/shared-types";
import type {
  AnalysisRunRequest,
  AnalysisRunResponse,
  AnalysisRescaleRequest,
  AnalysisRescaleResponse,
  ConfigGenerateRequest,
  ConfigGenerateResponse,
  ExportThreeMfRequest,
  ExportThreeMfResponse,
  ExportIniRequest,
  ExportIniResponse,
  ExportPdfReportRequest,
  ExportPdfReportResponse,
  OpenInSlicerRequest,
  OpenInSlicerResponse,
  CustomProfile,
  SaveCustomProfileRequest,
  RecordOutcomeRequest,
  AppSettings,
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
  rescaleGeometry: (request: AnalysisRescaleRequest) => Promise<AnalysisRescaleResponse>;
  generateConfig: (request: ConfigGenerateRequest) => Promise<ConfigGenerateResponse>;
  exportThreeMf: (request: ExportThreeMfRequest) => Promise<ExportThreeMfResponse>;
  exportIni: (request: ExportIniRequest) => Promise<ExportIniResponse>;
  exportPdfReport: (request: ExportPdfReportRequest) => Promise<ExportPdfReportResponse>;
  openInSlicer: (request: OpenInSlicerRequest) => Promise<OpenInSlicerResponse>;
  recordOutcome: (request: RecordOutcomeRequest) => Promise<void>;
  getCustomProfiles: () => Promise<CustomProfile[]>;
  saveCustomProfile: (request: SaveCustomProfileRequest) => Promise<CustomProfile>;
  deleteCustomProfile: (id: string) => Promise<void>;
  getSettings: () => Promise<AppSettings>;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
  onMenuAction: (callback: (action: string) => void) => () => void;
  getAppVersion: () => Promise<string>;
}
