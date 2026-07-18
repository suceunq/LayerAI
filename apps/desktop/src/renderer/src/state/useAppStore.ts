import { create } from "zustand";
import type {
  PrinterProfile,
  FilamentProfile,
  MeshGeometryData,
  MeshAnalysisResult,
  IntentResult,
  GeneratedConfig,
  ExplanationSet,
  ComparisonMetrics,
  PrintOutcomeId,
} from "@layerai/shared-types";
import type { ImportedFilePayload } from "../../../preload/api.js";
import type {
  CompanySettings,
  CostSettings,
  CustomProfile,
  GenerateInvoiceRequest,
  PhotoDiagnosisResult,
  ProjectRecoverySnapshot,
  RecentProject,
  SupportedTheme,
  SupportedInterfaceMode,
  LanguagePreference,
  UpdateState,
} from "../../../shared/ipc-types.js";
import { computeSizeFit } from "../lib/size-fit.js";
import { filamentGroupForVendor, filamentGroupOfId } from "../lib/vendor-filament.js";
import type { Language } from "../i18n/translations.js";
import { translate } from "../i18n/useTranslation.js";
import { quaternionRestingFace, computeGridArrangement } from "@layerai/mesh-analysis";
import { clampConfig } from "@layerai/config-generator";
import { generateExplanations } from "@layerai/explanation-engine";

export type AppStep = "import" | "analyzing" | "intent" | "generating" | "review";

export type HelpDialogTab = "aide" | "apropos";
export type SettingsDialogTab = "apiKeys" | "language" | "updates" | "costs" | "company" | "support";

interface AppState {
  step: AppStep;
  error: string | null;
  slicerNotice: string | null;
  toolNotice: string | null;
  helpDialogOpen: boolean;
  helpDialogTab: HelpDialogTab;
  language: Language;
  languagePreference: LanguagePreference;
  theme: SupportedTheme;
  interfaceMode: SupportedInterfaceMode;
  settingsDialogOpen: boolean;
  settingsDialogTab: SettingsDialogTab;
  updateDialogOpen: boolean;
  updateState: UpdateState | null;
  checkUpdatesOnStartup: boolean;
  costSettings: CostSettings;
  companySettings: CompanySettings | null;
  welcomeDialogOpen: boolean;
  showWelcomeOnStartup: boolean;
  donationConfigured: boolean;
  donationError: string | null;

  photoDiagnosisDialogOpen: boolean;
  photoDiagnosisLoading: boolean;
  photoDiagnosisResult: PhotoDiagnosisResult | null;
  photoDiagnosisError: string | null;
  photoDiagnosisAppliedCount: number;

  invoiceDialogOpen: boolean;
  invoiceGenerating: boolean;
  invoiceError: string | null;

  feedbackDialogOpen: boolean;

  printers: PrinterProfile[];
  filaments: FilamentProfile[];
  selectedPrinterId: string;
  selectedFilamentId: string;

  importedFile: ImportedFilePayload | null;
  geometry: MeshGeometryData | null;
  analysis: MeshAnalysisResult | null;

  intentText: string;
  intentResult: IntentResult | null;
  config: GeneratedConfig | null;
  explanations: ExplanationSet | null;
  comparison: ComparisonMetrics | null;
  showAdvanced: boolean;
  advancedPanelOpen: boolean;
  resizePanelOpen: boolean;
  isRescaling: boolean;
  facePickModeActive: boolean;
  isReorienting: boolean;

  layerViewEnabled: boolean;
  layerViewHeightMm: number;

  quantity: number;
  setQuantity: (quantity: number) => void;

  multiPlateEnabled: boolean;
  setMultiPlateEnabled: (enabled: boolean) => void;
  currentPlateIndex: number;
  setCurrentPlateIndex: (index: number) => void;

  customProfiles: CustomProfile[];
  recentProjects: RecentProject[];
  recoverySnapshot: ProjectRecoverySnapshot | null;
  recoveryLoading: boolean;

  loadProfileDb: () => Promise<void>;
  setPrinter: (id: string) => void;
  setFilament: (id: string) => void;
  importFromDialog: () => Promise<void>;
  importDroppedPath: (filePath: string) => Promise<void>;
  checkSizeFitAfterImport: () => void;
  setIntentText: (text: string) => void;
  generateConfiguration: () => Promise<void>;
  toggleAdvanced: () => void;
  toggleAdvancedPanel: () => void;
  toggleResizePanel: () => void;
  rescaleModel: (percent: number) => Promise<void>;
  toggleFacePickMode: () => void;
  applyManualFaceOrientation: (normal: { x: number; y: number; z: number }) => Promise<void>;
  updateConfigValue: (key: string, value: string | number | boolean) => void;
  toggleLayerView: () => void;
  setLayerViewHeight: (heightMm: number) => void;
  exportThreeMf: () => Promise<void>;
  exportIni: () => Promise<void>;
  exportBambuProfile: (targetSlicer?: "bambuStudio" | "crealityPrint") => Promise<void>;
  exportPdfReport: () => Promise<void>;
  openInSlicer: () => Promise<void>;
  startOver: () => void;

  loadCustomProfiles: () => Promise<void>;
  saveCurrentAsProfile: (name: string) => Promise<void>;
  applyCustomProfile: (profile: CustomProfile) => void;
  deleteCustomProfile: (id: string) => Promise<void>;

  loadRecentProjects: () => Promise<void>;
  recordCurrentAsRecentProject: () => Promise<void>;
  reopenRecentProject: (project: RecentProject) => Promise<void>;
  removeRecentProject: (id: string) => Promise<void>;
  loadProjectRecovery: () => Promise<void>;
  restoreProjectRecovery: () => Promise<void>;
  discardProjectRecovery: () => Promise<void>;

  outcomeRecorded: boolean;
  recordOutcome: (outcome: PrintOutcomeId) => Promise<void>;

  onboardingActive: boolean;
  checkOnboarding: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  replayOnboarding: () => void;

  showToolNotice: (message: string) => void;
  autoOptimize: () => Promise<void>;
  checkModelHealth: () => void;
  openHelpDialog: (tab: HelpDialogTab) => void;
  closeHelpDialog: () => void;
  handleMenuAction: (action: string) => void;

  loadLanguage: () => Promise<void>;
  loadWelcome: () => Promise<void>;
  setLanguage: (preference: LanguagePreference) => Promise<void>;
  setTheme: (theme: SupportedTheme) => Promise<void>;
  setInterfaceMode: (mode: SupportedInterfaceMode) => Promise<void>;
  toggleSettingsDialog: () => void;
  setSettingsDialogTab: (tab: SettingsDialogTab) => void;
  openWelcomeDialog: () => void;
  closeWelcomeLater: () => void;
  dismissWelcomePermanently: () => Promise<void>;
  openDonationPage: () => Promise<void>;
  setDonationSettings: (showWelcomeOnStartup: boolean) => Promise<void>;

  toggleUpdateDialog: () => void;
  setUpdateState: (state: UpdateState) => void;
  openUpdateDialogAndCheck: () => void;
  setCheckUpdatesOnStartup: (enabled: boolean) => Promise<void>;
  acknowledgeReleaseNotes: () => void;

  setCostSettings: (costs: CostSettings) => Promise<void>;
  setCompanySettings: (company: CompanySettings) => Promise<void>;

  togglePhotoDiagnosisDialog: () => void;
  runPhotoDiagnosis: (imageBase64: string, mimeType: string) => Promise<void>;
  applyDiagnosisCorrections: () => void;
  resetPhotoDiagnosis: () => void;

  toggleInvoiceDialog: () => void;
  generateInvoice: (request: GenerateInvoiceRequest) => Promise<{ saved: boolean; invoiceNumber?: string }>;

  toggleFeedbackDialog: () => void;
}

async function runAnalysisForFile(file: ImportedFilePayload): Promise<{ geometry: MeshGeometryData; analysis: MeshAnalysisResult }> {
  return window.api.runAnalysis({ file });
}

/**
 * Computes where each copy of the current part should sit on the bed for a given quantity.
 * Returns undefined for a single copy so callers (buildThreeMf) fall back to their own
 * single-centered default rather than threading a redundant one-element array everywhere.
 */
export interface PlateArrangementInfo {
  /** Bed-space XY centers for the pieces on the requested plate only. */
  positions: { x: number; y: number }[];
  /** How many copies fit on a single plate at this spacing. */
  maxFitPerPlate: number;
  /** ceil(quantity / maxFitPerPlate) - how many plates it'd take to print everything requested. */
  totalPlates: number;
  /** How many of the requested copies are on this specific plate (the last plate may be a partial fill). */
  platePieceCount: number;
}

/**
 * Computes where each copy of the current part should sit on the bed for a given quantity and
 * plate index. Multi-plate is purely a UI/export-time concept - pieces past what fits on plate 0
 * spill onto plate 1, 2, etc. rather than being silently dropped, but the caller decides whether
 * to expose that (multiPlateEnabled) or just show/export plate 0 with an overflow warning.
 * Returns null for a single copy so callers (buildThreeMf) fall back to their own
 * single-centered default rather than threading a redundant one-element array everywhere.
 */
export function computePlateArrangement(
  analysis: MeshAnalysisResult | null,
  printer: PrinterProfile | undefined,
  quantity: number,
  plateIndex = 0
): PlateArrangementInfo | null {
  if (!analysis || !printer || quantity <= 1) return null;
  const width = analysis.boundingBoxMm.max.x - analysis.boundingBoxMm.min.x;
  const depth = analysis.boundingBoxMm.max.y - analysis.boundingBoxMm.min.y;

  const probe = computeGridArrangement(quantity, width, depth, printer.bedShape);
  const maxFitPerPlate = Math.max(1, probe.maxFit);
  const totalPlates = Math.max(1, Math.ceil(quantity / maxFitPerPlate));
  const clampedIndex = Math.min(Math.max(0, plateIndex), totalPlates - 1);
  const platePieceCount = Math.max(0, Math.min(maxFitPerPlate, quantity - clampedIndex * maxFitPerPlate));

  const plate = computeGridArrangement(platePieceCount, width, depth, printer.bedShape);
  return { positions: plate.positions, maxFitPerPlate, totalPlates, platePieceCount };
}

export const useAppStore = create<AppState>((set, get) => ({
  step: "import",
  error: null,
  slicerNotice: null,
  toolNotice: null,
  helpDialogOpen: false,
  helpDialogTab: "aide",
  language: "fr",
  languagePreference: "system",
  theme: "dark",
  interfaceMode: "simple",
  settingsDialogOpen: false,
  settingsDialogTab: "apiKeys",
  updateDialogOpen: false,
  updateState: null,
  checkUpdatesOnStartup: true,
  costSettings: { currency: "€", filamentPricePerKg: null, printerPowerW: null, electricityPricePerKwh: null },
  companySettings: null,
  welcomeDialogOpen: false,
  showWelcomeOnStartup: true,
  donationConfigured: false,
  donationError: null,

  photoDiagnosisDialogOpen: false,
  photoDiagnosisLoading: false,
  photoDiagnosisResult: null,
  photoDiagnosisError: null,
  photoDiagnosisAppliedCount: 0,

  invoiceDialogOpen: false,
  invoiceGenerating: false,
  invoiceError: null,

  feedbackDialogOpen: false,

  printers: [],
  filaments: [],
  selectedPrinterId: "MK4S",
  selectedFilamentId: "PLA",

  importedFile: null,
  geometry: null,
  analysis: null,

  intentText: "",
  intentResult: null,
  config: null,
  explanations: null,
  comparison: null,
  showAdvanced: false,
  advancedPanelOpen: false,
  resizePanelOpen: false,
  isRescaling: false,
  facePickModeActive: false,
  isReorienting: false,

  layerViewEnabled: false,
  layerViewHeightMm: 0,

  quantity: 1,
  setQuantity: (quantity) => set({ quantity: Math.max(1, Math.floor(quantity) || 1), currentPlateIndex: 0 }),

  multiPlateEnabled: false,
  setMultiPlateEnabled: (enabled) => set({ multiPlateEnabled: enabled, currentPlateIndex: 0 }),
  currentPlateIndex: 0,
  setCurrentPlateIndex: (index) => set({ currentPlateIndex: Math.max(0, index) }),

  customProfiles: [],
  recentProjects: [],
  recoverySnapshot: null,
  recoveryLoading: false,
  outcomeRecorded: false,
  onboardingActive: false,

  loadProfileDb: async () => {
    try {
      const [printers, filaments, settings] = await Promise.all([
        window.api.getPrinters(),
        window.api.getFilaments(),
        window.api.getSettings(),
      ]);
      const defaultPrinter = printers.find((p) => p.id === "MK4S")?.id ?? printers[0]?.id ?? "";
      const defaultFilament = filaments.find((f) => f.id === "PLA")?.id ?? filaments[0]?.id ?? "";
      const selectedPrinterId = printers.find((p) => p.id === settings.lastPrinterId)?.id ?? defaultPrinter;
      const selectedFilamentId = filaments.find((f) => f.id === settings.lastFilamentId)?.id ?? defaultFilament;
      set({ printers, filaments, selectedPrinterId, selectedFilamentId });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  setPrinter: (id) =>
    set((s) => {
      const vendor = s.printers.find((p) => p.id === id)?.vendor;
      const targetGroup = filamentGroupForVendor(vendor);
      const currentGroup = filamentGroupOfId(s.selectedFilamentId);
      // A different printer can change how many copies fit per plate (and thus totalPlates),
      // so a previously-valid currentPlateIndex could now point past the end - reset it rather
      // than let the plate navigator show an out-of-range "Plateau N / totalPlates".
      if (targetGroup === currentGroup) {
        void window.api.setLastSelection({ printerId: id, filamentId: s.selectedFilamentId });
        return { selectedPrinterId: id, currentPlateIndex: 0 };
      }

      const fallback = s.filaments.find((f) => filamentGroupOfId(f.id) === targetGroup);
      const filamentId = fallback?.id ?? s.selectedFilamentId;
      void window.api.setLastSelection({ printerId: id, filamentId });
      return { selectedPrinterId: id, selectedFilamentId: filamentId, currentPlateIndex: 0 };
    }),
  setFilament: (id) =>
    set((s) => {
      void window.api.setLastSelection({ printerId: s.selectedPrinterId, filamentId: id });
      return { selectedFilamentId: id };
    }),

  importFromDialog: async () => {
    try {
      const file = await window.api.importOpenDialog();
      if (!file) return;
      set({ importedFile: file, step: "analyzing", error: null });
      const { geometry, analysis } = await runAnalysisForFile(file);
      set({ geometry, analysis, step: "intent" });
      get().checkSizeFitAfterImport();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), step: "import" });
    }
  },

  importDroppedPath: async (filePath) => {
    try {
      const file = await window.api.importReadDropped(filePath);
      set({ importedFile: file, step: "analyzing", error: null });
      const { geometry, analysis } = await runAnalysisForFile(file);
      set({ geometry, analysis, step: "intent" });
      get().checkSizeFitAfterImport();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), step: "import" });
    }
  },

  checkSizeFitAfterImport: () => {
    const { analysis, printers, selectedPrinterId } = get();
    const printer = printers.find((p) => p.id === selectedPrinterId);
    if (!analysis || !printer) return;
    if (!computeSizeFit(analysis, printer).fits) set({ resizePanelOpen: true });
  },

  setIntentText: (text) => set({ intentText: text }),

  generateConfiguration: async () => {
    const { geometry, analysis, intentText, selectedPrinterId, selectedFilamentId, language } = get();
    if (!geometry || !analysis) return;
    set({ step: "generating", error: null });
    try {
      const { intent, config, explanations, comparison } = await window.api.generateConfig({
        geometry,
        analysis,
        intentText,
        printerId: selectedPrinterId,
        filamentId: selectedFilamentId,
        language,
      });
      set({ intentResult: intent, config, explanations, comparison, step: "review" });
      void get().recordCurrentAsRecentProject();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), step: "intent" });
    }
  },

  toggleAdvanced: () => set((s) => ({ showAdvanced: !s.showAdvanced })),
  toggleAdvancedPanel: () => set((s) => ({ advancedPanelOpen: !s.advancedPanelOpen })),
  toggleResizePanel: () => set((s) => ({ resizePanelOpen: !s.resizePanelOpen })),

  rescaleModel: async (percent) => {
    const { geometry, step, intentText } = get();
    if (!geometry) return;
    set({ isRescaling: true, error: null });
    try {
      const result = await window.api.rescaleGeometry({ geometry, scaleFactor: percent / 100 });
      set({ geometry: result.geometry, analysis: result.analysis, isRescaling: false, resizePanelOpen: false });
      if (step === "review" && intentText) await get().generateConfiguration();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isRescaling: false });
    }
  },

  toggleFacePickMode: () => set((s) => ({ facePickModeActive: !s.facePickModeActive })),

  applyManualFaceOrientation: async (normal) => {
    const { geometry, step, intentText } = get();
    if (!geometry) return;
    set({ facePickModeActive: false, isReorienting: true, error: null });
    try {
      const quaternion = quaternionRestingFace(normal);
      const result = await window.api.reorientGeometry({ geometry, quaternion });
      set({ geometry: result.geometry, analysis: result.analysis, isReorienting: false });
      if (step === "review" && intentText) await get().generateConfiguration();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), isReorienting: false });
    }
  },

  toggleLayerView: () =>
    set((s) => ({
      layerViewEnabled: !s.layerViewEnabled,
      layerViewHeightMm: s.analysis ? s.analysis.dimensionsMm.z / 2 : 0,
    })),
  setLayerViewHeight: (heightMm) => set({ layerViewHeightMm: heightMm }),

  updateConfigValue: (key, value) =>
    set((s) => {
      if (!s.config?.[key]) return s;
      return {
        config: {
          ...s.config,
          [key]: { ...s.config[key]!, value, ruleId: "manual.override", confidence: 1 },
        },
      };
    }),

  exportThreeMf: async () => {
    const { geometry, analysis, config, printers, selectedPrinterId, selectedFilamentId, importedFile, quantity, multiPlateEnabled, currentPlateIndex } =
      get();
    if (!geometry || !config) return;
    const arrangement = computePlateArrangement(
      analysis,
      printers.find((p) => p.id === selectedPrinterId),
      quantity,
      multiPlateEnabled ? currentPlateIndex : 0
    );
    const baseName = importedFile?.fileName.replace(/\.[^.]+$/, "");
    const objectName =
      multiPlateEnabled && arrangement && arrangement.totalPlates > 1 && baseName
        ? `${baseName}-plateau${currentPlateIndex + 1}`
        : baseName;
    try {
      await window.api.exportThreeMf({
        geometry,
        config,
        printerId: selectedPrinterId,
        filamentId: selectedFilamentId,
        objectName,
        positions: arrangement?.positions,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  exportIni: async () => {
    const { config, selectedPrinterId, selectedFilamentId } = get();
    if (!config) return;
    try {
      await window.api.exportIni({ config, printerId: selectedPrinterId, filamentId: selectedFilamentId });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  exportBambuProfile: async (targetSlicer = "bambuStudio") => {
    const { config, selectedPrinterId, selectedFilamentId } = get();
    if (!config) return;
    try {
      await window.api.exportBambuProfile({ config, printerId: selectedPrinterId, filamentId: selectedFilamentId, targetSlicer });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  exportPdfReport: async () => {
    const { analysis, intentResult, config, explanations, comparison, selectedPrinterId, selectedFilamentId, importedFile, quantity } = get();
    if (!analysis || !intentResult || !config || !explanations || !comparison) return;
    try {
      await window.api.exportPdfReport({
        fileName: importedFile?.fileName ?? translate(get().language, "native.filename.defaultModel"),
        printerId: selectedPrinterId,
        filamentId: selectedFilamentId,
        analysis,
        intent: intentResult,
        config,
        explanations,
        comparison,
        quantity,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  openInSlicer: async () => {
    const { geometry, analysis, config, printers, selectedPrinterId, selectedFilamentId, importedFile, quantity, multiPlateEnabled, currentPlateIndex } =
      get();
    if (!geometry || !config) return;
    const arrangement = computePlateArrangement(
      analysis,
      printers.find((p) => p.id === selectedPrinterId),
      quantity,
      multiPlateEnabled ? currentPlateIndex : 0
    );
    const baseName = importedFile?.fileName.replace(/\.[^.]+$/, "");
    const objectName =
      multiPlateEnabled && arrangement && arrangement.totalPlates > 1 && baseName
        ? `${baseName}-plateau${currentPlateIndex + 1}`
        : baseName;
    set({ error: null, slicerNotice: null });
    try {
      const result = await window.api.openInSlicer({
        geometry,
        config,
        printerId: selectedPrinterId,
        filamentId: selectedFilamentId,
        objectName,
        positions: arrangement?.positions,
      });
      if (result.opened) {
        const notice = translate(get().language, "review.slicerOpening", { slicer: result.slicerName });
        set({ slicerNotice: notice });
        setTimeout(() => {
          if (get().slicerNotice === notice) set({ slicerNotice: null });
        }, 4000);
      } else if (!result.canceled) {
        set({ error: result.message });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  startOver: () => {
    void window.api.clearProjectRecovery();
    set({
      step: "import",
      importedFile: null,
      geometry: null,
      analysis: null,
      intentText: "",
      intentResult: null,
      slicerNotice: null,
      config: null,
      explanations: null,
      comparison: null,
      error: null,
      outcomeRecorded: false,
      layerViewEnabled: false,
      layerViewHeightMm: 0,
      resizePanelOpen: false,
      facePickModeActive: false,
      quantity: 1,
      multiPlateEnabled: false,
      currentPlateIndex: 0,
      recoverySnapshot: null,
    });
  },

  loadCustomProfiles: async () => {
    try {
      const customProfiles = await window.api.getCustomProfiles();
      set({ customProfiles });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  saveCurrentAsProfile: async (name) => {
    const { intentText, selectedPrinterId, selectedFilamentId } = get();
    try {
      const profile = await window.api.saveCustomProfile({ name, intentText, printerId: selectedPrinterId, filamentId: selectedFilamentId });
      set((s) => ({ customProfiles: [...s.customProfiles, profile] }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  applyCustomProfile: (profile) =>
    set({ intentText: profile.intentText, selectedPrinterId: profile.printerId, selectedFilamentId: profile.filamentId }),

  deleteCustomProfile: async (id) => {
    try {
      await window.api.deleteCustomProfile(id);
      set((s) => ({ customProfiles: s.customProfiles.filter((p) => p.id !== id) }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  loadRecentProjects: async () => {
    try {
      const recentProjects = await window.api.getRecentProjects();
      set({ recentProjects });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  recordCurrentAsRecentProject: async () => {
    const { importedFile, selectedPrinterId, selectedFilamentId, intentText } = get();
    if (!importedFile) return;
    try {
      const entry = await window.api.recordRecentProject({
        filePath: importedFile.filePath,
        fileName: importedFile.fileName,
        printerId: selectedPrinterId,
        filamentId: selectedFilamentId,
        intentText,
      });
      set((s) => ({ recentProjects: [entry, ...s.recentProjects.filter((p) => p.filePath !== entry.filePath)].slice(0, 20) }));
    } catch {
      // Best-effort - a failure to record recent-project history must never interrupt the review the user is already looking at.
    }
  },

  reopenRecentProject: async (project) => {
    set({ selectedPrinterId: project.printerId, selectedFilamentId: project.filamentId, intentText: project.intentText });
    await get().importDroppedPath(project.filePath);
    if (get().step === "intent") await get().generateConfiguration();
  },

  removeRecentProject: async (id) => {
    try {
      await window.api.removeRecentProject(id);
      set((s) => ({ recentProjects: s.recentProjects.filter((p) => p.id !== id) }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  recordOutcome: async (outcome) => {
    const { analysis, intentResult, config, selectedPrinterId, selectedFilamentId } = get();
    if (!analysis || !intentResult || !config) return;
    try {
      const intentTags = intentResult.weights.filter((w) => w.weight >= 0.15).map((w) => w.tag);
      await window.api.recordOutcome({
        analysis,
        printerId: selectedPrinterId,
        filamentId: selectedFilamentId,
        intentTags,
        configUsed: config,
        outcome,
      });
      set({ outcomeRecorded: true });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  checkOnboarding: async () => {
    try {
      const settings = await window.api.getSettings();
      if (!settings.onboardingCompleted) set({ onboardingActive: true });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  completeOnboarding: async () => {
    set({ onboardingActive: false });
    try {
      await window.api.setOnboardingCompleted(true);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  replayOnboarding: () => set({ onboardingActive: true }),

  loadLanguage: async () => {
    try {
      const settings = await window.api.getSettings();
      if (settings.language) set({ language: settings.language });
      set({ languagePreference: settings.languagePreference ?? settings.language ?? "system" });
      if (settings.theme) set({ theme: settings.theme });
      if (settings.interfaceMode) set({ interfaceMode: settings.interfaceMode });
      set({ checkUpdatesOnStartup: settings.checkUpdatesOnStartup ?? true });
      if (settings.costs) set({ costSettings: settings.costs });
      if (settings.company) set({ companySettings: settings.company });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  setCostSettings: async (costs) => {
    set({ costSettings: costs });
    try {
      await window.api.setCostSettings(costs);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  setCompanySettings: async (company) => {
    set({ companySettings: company });
    try {
      await window.api.setCompanySettings(company);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  togglePhotoDiagnosisDialog: () =>
    set((s) => {
      const nextOpen = !s.photoDiagnosisDialogOpen;
      return nextOpen
        ? { photoDiagnosisDialogOpen: true }
        : { photoDiagnosisDialogOpen: false, photoDiagnosisResult: null, photoDiagnosisError: null, photoDiagnosisAppliedCount: 0 };
    }),

  resetPhotoDiagnosis: () => set({ photoDiagnosisResult: null, photoDiagnosisError: null, photoDiagnosisAppliedCount: 0 }),

  runPhotoDiagnosis: async (imageBase64, mimeType) => {
    set({ photoDiagnosisLoading: true, photoDiagnosisError: null, photoDiagnosisResult: null, photoDiagnosisAppliedCount: 0 });
    try {
      const response = await window.api.diagnosePrintPhoto({ imageBase64, mimeType, language: get().language });
      if (response.success) {
        set({ photoDiagnosisResult: response.result });
      } else {
        set({ photoDiagnosisError: response.message });
      }
    } catch (err) {
      set({ photoDiagnosisError: err instanceof Error ? err.message : String(err) });
    } finally {
      set({ photoDiagnosisLoading: false });
    }
  },

  applyDiagnosisCorrections: () => {
    const { photoDiagnosisResult, config, selectedPrinterId } = get();
    if (!photoDiagnosisResult || !config) return;
    let next = { ...config };
    for (const correction of photoDiagnosisResult.corrections) {
      const entry = next[correction.parameterKey];
      if (!entry || typeof entry.value !== "number") continue;
      next = {
        ...next,
        [correction.parameterKey]: { ...entry, value: entry.value + correction.deltaValue, ruleId: "manual.photoDiagnosis", confidence: 1 },
      };
    }
    next = clampConfig(next, selectedPrinterId);
    set({ config: next, photoDiagnosisAppliedCount: photoDiagnosisResult.corrections.length });
  },

  toggleInvoiceDialog: () => set((s) => ({ invoiceDialogOpen: !s.invoiceDialogOpen, invoiceError: null })),

  toggleFeedbackDialog: () => set((s) => ({ feedbackDialogOpen: !s.feedbackDialogOpen })),

  generateInvoice: async (request) => {
    set({ invoiceGenerating: true, invoiceError: null });
    try {
      const response = await window.api.generateInvoice(request);
      if (response.saved) {
        set({ invoiceDialogOpen: false });
        return { saved: true, invoiceNumber: response.invoiceNumber };
      }
      if (response.error) set({ invoiceError: response.error });
      return { saved: false };
    } catch (err) {
      set({ invoiceError: err instanceof Error ? err.message : String(err) });
      return { saved: false };
    } finally {
      set({ invoiceGenerating: false });
    }
  },

  setLanguage: async (preference) => {
    try {
      const language = await window.api.setLanguage(preference);
      set((state) => ({
        language,
        languagePreference: preference,
        error: null,
        slicerNotice: null,
        toolNotice: null,
        explanations:
          state.config && state.intentResult && state.analysis
            ? generateExplanations(state.config, state.intentResult, state.analysis, language)
            : state.explanations,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  setTheme: async (theme) => {
    set({ theme });
    try {
      await window.api.setTheme(theme);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  loadWelcome: async () => {
    try {
      const [settings, config] = await Promise.all([window.api.getSettings(), window.api.getDonationConfig()]);
      const showWelcomeOnStartup = settings.showWelcomeOnStartup ?? true;
      set({
        welcomeDialogOpen: showWelcomeOnStartup,
        showWelcomeOnStartup,
        donationConfigured: config.configured,
        donationError: null,
      });
    } catch (err) {
      set({
        welcomeDialogOpen: true,
        donationError: err instanceof Error ? err.message : String(err),
      });
    }
  },

  loadProjectRecovery: async () => {
    try {
      set({ recoverySnapshot: await window.api.getProjectRecovery() });
    } catch {
      set({ recoverySnapshot: null });
    }
  },

  restoreProjectRecovery: async () => {
    const snapshot = get().recoverySnapshot;
    if (!snapshot) return;
    set({ recoveryLoading: true, error: null, selectedPrinterId: snapshot.printerId, selectedFilamentId: snapshot.filamentId,
      intentText: snapshot.intentText, quantity: snapshot.quantity, multiPlateEnabled: snapshot.multiPlateEnabled,
      currentPlateIndex: snapshot.currentPlateIndex });
    try {
      await get().importDroppedPath(snapshot.filePath);
      if (!get().importedFile || get().step === "import") throw new Error("Le fichier source du projet est introuvable ou illisible.");
      if (snapshot.config && get().step === "intent") {
        await get().generateConfiguration();
        if (get().step === "review") {
          set((state) => ({
            config: snapshot.config,
            explanations: state.explanations ? {
              ...state.explanations,
              parameters: state.explanations.parameters.map((parameter) => {
                const restored = snapshot.config?.[parameter.parameterKey];
                return restored ? { ...parameter, valueLabel: String(restored.value) } : parameter;
              }),
            } : null,
          }));
        }
      }
      set({ recoverySnapshot: null, recoveryLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), recoveryLoading: false });
    }
  },

  discardProjectRecovery: async () => {
    await window.api.clearProjectRecovery();
    set({ recoverySnapshot: null });
  },

  setInterfaceMode: async (interfaceMode) => {
    set({ interfaceMode });
    try {
      await window.api.setInterfaceMode(interfaceMode);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  toggleSettingsDialog: () => set((s) => ({ settingsDialogOpen: !s.settingsDialogOpen })),
  setSettingsDialogTab: (settingsDialogTab) => set({ settingsDialogTab }),
  openWelcomeDialog: () => set({ welcomeDialogOpen: true, donationError: null }),
  closeWelcomeLater: () => set({ welcomeDialogOpen: false, donationError: null }),
  dismissWelcomePermanently: async () => {
    try {
      const config = await window.api.setDonationSettings({
        showWelcomeOnStartup: false,
      });
      set({
        welcomeDialogOpen: false,
        showWelcomeOnStartup: false,
        donationConfigured: config.configured,
        donationError: null,
      });
    } catch (err) {
      set({ donationError: err instanceof Error ? err.message : String(err) });
    }
  },
  openDonationPage: async () => {
    try {
      await window.api.openDonationPage();
      set({ donationError: null });
    } catch (err) {
      set({ donationError: err instanceof Error ? err.message : String(err) });
    }
  },
  setDonationSettings: async (showWelcomeOnStartup) => {
    try {
      const config = await window.api.setDonationSettings({ showWelcomeOnStartup });
      set({
        donationConfigured: config.configured,
        showWelcomeOnStartup,
        donationError: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set({ donationError: message });
      throw err;
    }
  },

  showToolNotice: (message) => {
    set({ toolNotice: message });
    setTimeout(() => {
      if (get().toolNotice === message) set({ toolNotice: null });
    }, 5000);
  },

  autoOptimize: async () => {
    const { geometry, analysis, language } = get();
    if (!geometry || !analysis) {
      get().showToolNotice(translate(language, "menuAction.noModel"));
      return;
    }
    set({ intentText: translate(language, "menuAction.autoOptimizeIntent") });
    await get().generateConfiguration();
  },

  checkModelHealth: () => {
    const { analysis, language } = get();
    if (!analysis) {
      get().showToolNotice(translate(language, "menuAction.noModelHealth"));
      return;
    }
    const confidence = Math.round(analysis.analysisConfidence * 100);
    if (analysis.isManifold) {
      get().showToolNotice(translate(language, "menuAction.meshValid", { confidence }));
    } else {
      get().showToolNotice(translate(language, "menuAction.meshInvalid", { confidence }));
    }
  },

  openHelpDialog: (tab) => set({ helpDialogOpen: true, helpDialogTab: tab }),
  closeHelpDialog: () => set({ helpDialogOpen: false }),

  handleMenuAction: (action) => {
    const s = get();
    switch (action) {
      case "file:new":
        s.startOver();
        break;
      case "file:open":
        void s.importFromDialog();
        break;
      case "file:save":
        void s.exportThreeMf();
        break;
      case "file:export-pdf":
        void s.exportPdfReport();
        break;
      case "file:export-ini":
        void s.exportIni();
        break;
      case "file:export-bambu":
        void s.exportBambuProfile("bambuStudio");
        break;
      case "file:export-creality":
        void s.exportBambuProfile("crealityPrint");
        break;
      case "edit:preferences":
        s.toggleSettingsDialog();
        break;
      case "tools:auto-optimize":
        void s.autoOptimize();
        break;
      case "tools:repair":
        s.checkModelHealth();
        break;
      case "tools:scale":
        if (!s.analysis) s.showToolNotice(translate(s.language, "menuAction.noModelResize"));
        else s.toggleResizePanel();
        break;
      case "help:docs":
        s.openHelpDialog("aide");
        break;
      case "help:tutorials":
        s.replayOnboarding();
        break;
      case "help:support":
        s.openWelcomeDialog();
        break;
      case "help:about":
        s.openHelpDialog("apropos");
        break;
      case "help:check-updates":
        s.openUpdateDialogAndCheck();
        break;
    }
  },

  toggleUpdateDialog: () => set((s) => ({ updateDialogOpen: !s.updateDialogOpen })),
  setUpdateState: (state) => {
    set({ updateState: state });
    // Downloading and installing happen silently in the background - the dialog only pops up
    // on its own once there are release notes to show for a version that was just installed.
    if (state.status === "installed") set({ updateDialogOpen: true });
  },
  openUpdateDialogAndCheck: () => {
    set({ updateDialogOpen: true });
    void window.api.checkForUpdates();
  },
  setCheckUpdatesOnStartup: async (enabled) => {
    set({ checkUpdatesOnStartup: enabled });
    try {
      await window.api.setCheckUpdatesOnStartup(enabled);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },
  acknowledgeReleaseNotes: () => {
    set({ updateDialogOpen: false });
    void window.api.acknowledgeReleaseNotes();
  },
}));

if (import.meta.env.DEV) {
  (window as unknown as { __appStore: typeof useAppStore }).__appStore = useAppStore;
}
