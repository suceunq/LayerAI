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
import type { AiProviderId } from "./ai-providers.js";
import type { LanguagePreference, SupportedLanguage } from "./languages.js";

export type { LanguagePreference, SupportedLanguage } from "./languages.js";

export interface AnalysisRunRequest {
  file: ImportedFilePayload;
}

export type AnalysisRunResponse = AnalyzedMesh;

export interface AnalysisRescaleRequest {
  geometry: MeshGeometryData;
  scaleFactor: number;
}

export type AnalysisRescaleResponse = AnalyzedMesh;

export interface AnalysisReorientRequest {
  geometry: MeshGeometryData;
  quaternion: { x: number; y: number; z: number; w: number };
}

export type AnalysisReorientResponse = AnalyzedMesh;

export interface ConfigGenerateRequest {
  geometry: MeshGeometryData;
  analysis: AnalyzedMesh["analysis"];
  intentText: string;
  printerId: string;
  filamentId: string;
  language?: SupportedLanguage;
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
  /** Bed-space centers for each copy to place, e.g. from computeGridArrangement. Defaults to a single centered copy. */
  positions?: { x: number; y: number }[];
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

export interface RecentProject {
  id: string;
  filePath: string;
  fileName: string;
  printerId: string;
  filamentId: string;
  intentText: string;
  lastOpenedAt: string;
}

export type RecordRecentProjectRequest = Omit<RecentProject, "id" | "lastOpenedAt">;

export interface ProjectRecoverySnapshot {
  schemaVersion: 1;
  updatedAt: string;
  filePath: string;
  fileName: string;
  printerId: string;
  filamentId: string;
  intentText: string;
  config: GeneratedConfig | null;
  quantity: number;
  multiPlateEnabled: boolean;
  currentPlateIndex: number;
}

export type SaveProjectRecoveryRequest = Omit<ProjectRecoverySnapshot, "schemaVersion" | "updatedAt">;

export type SaveCustomProfileRequest = Omit<CustomProfile, "id" | "createdAt">;

export interface ExportIniRequest {
  config: GeneratedConfig;
  printerId: string;
  filamentId: string;
}

export type ExportIniResponse = { saved: true; filePath: string } | { saved: false };

export interface ExportBambuProfileRequest {
  config: GeneratedConfig;
  printerId: string;
  filamentId: string;
  /** Both slicers read the identical JSON preset schema (see packages/threemf-writer) - this only changes the save-dialog title/filename. */
  targetSlicer?: "bambuStudio" | "crealityPrint";
}

export type ExportBambuProfileResponse = { saved: true; filePath: string } | { saved: false };

export interface ExportCaptureImageRequest {
  /** A "data:image/png;base64,..." data URL, as produced by canvas.toDataURL("image/png"). */
  dataUrl: string;
  suggestedFileName?: string;
}

export type ExportCaptureImageResponse = { saved: true; filePath: string } | { saved: false };

export interface OpenInSlicerRequest {
  geometry: MeshGeometryData;
  config: GeneratedConfig;
  printerId: string;
  filamentId: string;
  objectName?: string;
  /** Bed-space centers for each copy to place, e.g. from computeGridArrangement. Defaults to a single centered copy. */
  positions?: { x: number; y: number }[];
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
  quantity?: number;
}

export type ExportPdfReportResponse = { saved: true; filePath: string } | { saved: false };

export type CompanyLegalStatus = "auto-entrepreneur" | "entreprise-individuelle" | "societe";

export interface CompanySettings {
  legalStatus: CompanyLegalStatus;
  name: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  city: string;
  siret: string;
  rcsCity?: string;
  capitalSocial?: string;
  vatApplicable: boolean;
  vatNumber?: string;
  vatRatePercent: number;
  email?: string;
  phone?: string;
  iban?: string;
  paymentTermsDays: number;
  invoicePrefix: string;
}

export interface InvoiceClientRequest {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  postalCode: string;
  city: string;
}

export interface InvoiceLineItemRequest {
  description: string;
  quantity: number;
  unitPriceHt: number;
}

export interface GenerateInvoiceRequest {
  client: InvoiceClientRequest;
  lineItems: InvoiceLineItemRequest[];
  notes?: string;
}

export type GenerateInvoiceResponse = { saved: true; filePath: string; invoiceNumber: string } | { saved: false; error?: string };

export interface RecordOutcomeRequest {
  analysis: AnalyzedMesh["analysis"];
  printerId: string;
  filamentId: string;
  intentTags: IntentTag[];
  configUsed: GeneratedConfig;
  outcome: PrintOutcomeId;
  notes?: string;
}

export type SupportedTheme = "dark" | "light";
export type SupportedInterfaceMode = "simple" | "expert";

export interface CostSettings {
  currency: string;
  filamentPricePerKg: number | null;
  printerPowerW: number | null;
  electricityPricePerKwh: number | null;
}

export interface AppSettings {
  onboardingCompleted: boolean;
  prusaSlicerPath?: string;
  bambuStudioPath?: string;
  crealityPrintPath?: string;
  language?: SupportedLanguage;
  languagePreference?: LanguagePreference;
  theme?: SupportedTheme;
  interfaceMode?: SupportedInterfaceMode;
  checkUpdatesOnStartup?: boolean;
  postponedUpdateVersion?: string;
  costs?: CostSettings;
  lastPrinterId?: string;
  lastFilamentId?: string;
  company?: CompanySettings;
}

export interface LastSelectionRequest {
  printerId: string;
  filamentId: string;
}

export interface AiProviderPublic {
  id: AiProviderId;
  hasApiKey: boolean;
  model?: string;
  baseUrl?: string;
}

export interface AiSettingsPublic {
  providers: AiProviderPublic[];
  defaultProviderId: AiProviderId | null;
  cloudIntentEnabled: boolean;
}

export interface SaveAiProviderRequest {
  id: AiProviderId;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface TestAiProviderRequest {
  id: AiProviderId;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export type TestAiProviderResponse = { success: true } | { success: false; message: string };

export type PrintDefectId =
  | "stringing"
  | "elephantFoot"
  | "warping"
  | "layerShift"
  | "overExtrusion"
  | "underExtrusion"
  | "poorAdhesion"
  | "poorBridging"
  | "none"
  | "other";

export interface PhotoDiagnosisCorrection {
  /** One of the GeneratedConfig keys LayerAI can actually set (see CORRECTABLE_KEYS in photo-diagnosis.ts). */
  parameterKey: string;
  /** Relative adjustment applied to the current config value for that key. */
  deltaValue: number;
  label: string;
}

export interface PhotoDiagnosisResult {
  defectId: PrintDefectId;
  defectLabel: string;
  confidencePercent: number;
  explanation: string;
  corrections: PhotoDiagnosisCorrection[];
  additionalAdvice?: string;
}

export interface DiagnosePhotoRequest {
  imageBase64: string;
  mimeType: string;
  language: SupportedLanguage;
}

export type DiagnosePhotoResponse = { success: true; result: PhotoDiagnosisResult } | { success: false; message: string };

export type UpdateStatus =
  | "idle"
  | "checking"
  | "not-available"
  | "available"
  | "downloading"
  | "downloaded"
  | "error"
  | "dev-unavailable";

export interface UpdateState {
  status: UpdateStatus;
  currentVersion: string;
  availableVersion?: string;
  releaseNotes?: string;
  progressPercent?: number;
  bytesPerSecond?: number;
  totalBytes?: number;
  transferredBytes?: number;
  errorMessage?: string;
}
