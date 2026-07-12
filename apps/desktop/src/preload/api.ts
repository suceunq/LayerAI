import type { PrinterProfile, FilamentProfile } from "@layerai/shared-types";
import type {
  AnalysisRunRequest,
  AnalysisRunResponse,
  AnalysisRescaleRequest,
  AnalysisRescaleResponse,
  AnalysisReorientRequest,
  AnalysisReorientResponse,
  ConfigGenerateRequest,
  ConfigGenerateResponse,
  ExportThreeMfRequest,
  ExportThreeMfResponse,
  ExportIniRequest,
  ExportIniResponse,
  ExportBambuProfileRequest,
  ExportBambuProfileResponse,
  ExportCaptureImageRequest,
  ExportCaptureImageResponse,
  ExportPdfReportRequest,
  ExportPdfReportResponse,
  OpenInSlicerRequest,
  OpenInSlicerResponse,
  CustomProfile,
  SaveCustomProfileRequest,
  RecentProject,
  RecordRecentProjectRequest,
  RecordOutcomeRequest,
  AppSettings,
  CompanySettings,
  CostSettings,
  LastSelectionRequest,
  GenerateInvoiceRequest,
  GenerateInvoiceResponse,
  SupportedLanguage,
  SupportedTheme,
  AiSettingsPublic,
  SaveAiProviderRequest,
  TestAiProviderRequest,
  TestAiProviderResponse,
  DiagnosePhotoRequest,
  DiagnosePhotoResponse,
  UpdateState,
} from "../shared/ipc-types.js";
import type { AiProviderId } from "../shared/ai-providers.js";

export interface ImportedFilePayload {
  fileName: string;
  /** Absolute path on disk, when the file was read from disk (dialog or drag-and-drop) - always set by the current import paths. */
  filePath: string;
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
  reorientGeometry: (request: AnalysisReorientRequest) => Promise<AnalysisReorientResponse>;
  generateConfig: (request: ConfigGenerateRequest) => Promise<ConfigGenerateResponse>;
  exportThreeMf: (request: ExportThreeMfRequest) => Promise<ExportThreeMfResponse>;
  exportIni: (request: ExportIniRequest) => Promise<ExportIniResponse>;
  exportBambuProfile: (request: ExportBambuProfileRequest) => Promise<ExportBambuProfileResponse>;
  exportCaptureImage: (request: ExportCaptureImageRequest) => Promise<ExportCaptureImageResponse>;
  exportPdfReport: (request: ExportPdfReportRequest) => Promise<ExportPdfReportResponse>;
  openInSlicer: (request: OpenInSlicerRequest) => Promise<OpenInSlicerResponse>;
  recordOutcome: (request: RecordOutcomeRequest) => Promise<void>;
  getCustomProfiles: () => Promise<CustomProfile[]>;
  saveCustomProfile: (request: SaveCustomProfileRequest) => Promise<CustomProfile>;
  deleteCustomProfile: (id: string) => Promise<void>;
  getRecentProjects: () => Promise<RecentProject[]>;
  recordRecentProject: (request: RecordRecentProjectRequest) => Promise<RecentProject>;
  removeRecentProject: (id: string) => Promise<void>;
  getSettings: () => Promise<AppSettings>;
  setOnboardingCompleted: (completed: boolean) => Promise<void>;
  setLanguage: (language: SupportedLanguage) => Promise<void>;
  setTheme: (theme: SupportedTheme) => Promise<void>;
  setCheckUpdatesOnStartup: (enabled: boolean) => Promise<void>;
  setCostSettings: (costs: CostSettings) => Promise<void>;
  setLastSelection: (request: LastSelectionRequest) => Promise<void>;
  setCompanySettings: (company: CompanySettings) => Promise<void>;
  generateInvoice: (request: GenerateInvoiceRequest) => Promise<GenerateInvoiceResponse>;
  onMenuAction: (callback: (action: string) => void) => () => void;
  getAppVersion: () => Promise<string>;
  getAiSettings: () => Promise<AiSettingsPublic>;
  saveAiProvider: (request: SaveAiProviderRequest) => Promise<void>;
  deleteAiProvider: (id: AiProviderId) => Promise<void>;
  setDefaultAiProvider: (id: AiProviderId | null) => Promise<void>;
  setCloudIntentEnabled: (enabled: boolean) => Promise<void>;
  testAiProvider: (request: TestAiProviderRequest) => Promise<TestAiProviderResponse>;
  diagnosePrintPhoto: (request: DiagnosePhotoRequest) => Promise<DiagnosePhotoResponse>;
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  cancelUpdateDownload: () => Promise<void>;
  installUpdate: () => Promise<void>;
  postponeUpdate: (version: string) => Promise<void>;
  getUpdateState: () => Promise<UpdateState>;
  onUpdateStateChanged: (callback: (state: UpdateState) => void) => () => void;
}
