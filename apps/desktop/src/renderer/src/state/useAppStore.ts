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
import type { CustomProfile } from "../../../shared/ipc-types.js";
import { computeSizeFit } from "../lib/size-fit.js";

export type AppStep = "import" | "analyzing" | "intent" | "generating" | "review";

export type HelpDialogTab = "aide" | "apropos";

interface AppState {
  step: AppStep;
  error: string | null;
  slicerNotice: string | null;
  toolNotice: string | null;
  helpDialogOpen: boolean;
  helpDialogTab: HelpDialogTab;

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

  layerViewEnabled: boolean;
  layerViewHeightMm: number;

  customProfiles: CustomProfile[];

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
  updateConfigValue: (key: string, value: string | number | boolean) => void;
  toggleLayerView: () => void;
  setLayerViewHeight: (heightMm: number) => void;
  exportThreeMf: () => Promise<void>;
  exportIni: () => Promise<void>;
  exportPdfReport: () => Promise<void>;
  openInSlicer: () => Promise<void>;
  startOver: () => void;

  loadCustomProfiles: () => Promise<void>;
  saveCurrentAsProfile: (name: string) => Promise<void>;
  applyCustomProfile: (profile: CustomProfile) => void;
  deleteCustomProfile: (id: string) => Promise<void>;

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
}

async function runAnalysisForFile(file: ImportedFilePayload): Promise<{ geometry: MeshGeometryData; analysis: MeshAnalysisResult }> {
  return window.api.runAnalysis({ file });
}

export const useAppStore = create<AppState>((set, get) => ({
  step: "import",
  error: null,
  slicerNotice: null,
  toolNotice: null,
  helpDialogOpen: false,
  helpDialogTab: "aide",

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

  layerViewEnabled: false,
  layerViewHeightMm: 0,

  customProfiles: [],
  outcomeRecorded: false,
  onboardingActive: false,

  loadProfileDb: async () => {
    try {
      const [printers, filaments] = await Promise.all([window.api.getPrinters(), window.api.getFilaments()]);
      const defaultPrinter = printers.find((p) => p.id === "MK4S")?.id ?? printers[0]?.id ?? "";
      const defaultFilament = filaments.find((f) => f.id === "PLA")?.id ?? filaments[0]?.id ?? "";
      set({ printers, filaments, selectedPrinterId: defaultPrinter, selectedFilamentId: defaultFilament });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  setPrinter: (id) =>
    set((s) => {
      const vendor = s.printers.find((p) => p.id === id)?.vendor;
      const isBambu = vendor === "Bambu Lab";
      const currentFilamentIsBambu = s.selectedFilamentId.startsWith("BAMBU_");
      if (isBambu === currentFilamentIsBambu) return { selectedPrinterId: id };

      const fallback = s.filaments.find((f) => f.id.startsWith("BAMBU_") === isBambu);
      return { selectedPrinterId: id, selectedFilamentId: fallback?.id ?? s.selectedFilamentId };
    }),
  setFilament: (id) => set({ selectedFilamentId: id }),

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
    const { geometry, analysis, intentText, selectedPrinterId, selectedFilamentId } = get();
    if (!geometry || !analysis) return;
    set({ step: "generating", error: null });
    try {
      const { intent, config, explanations, comparison } = await window.api.generateConfig({
        geometry,
        analysis,
        intentText,
        printerId: selectedPrinterId,
        filamentId: selectedFilamentId,
      });
      set({ intentResult: intent, config, explanations, comparison, step: "review" });
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
    const { geometry, config, selectedPrinterId, selectedFilamentId, importedFile } = get();
    if (!geometry || !config) return;
    try {
      await window.api.exportThreeMf({
        geometry,
        config,
        printerId: selectedPrinterId,
        filamentId: selectedFilamentId,
        objectName: importedFile?.fileName.replace(/\.[^.]+$/, ""),
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

  exportPdfReport: async () => {
    const { analysis, intentResult, config, explanations, comparison, selectedPrinterId, selectedFilamentId, importedFile } = get();
    if (!analysis || !intentResult || !config || !explanations || !comparison) return;
    try {
      await window.api.exportPdfReport({
        fileName: importedFile?.fileName ?? "modele.stl",
        printerId: selectedPrinterId,
        filamentId: selectedFilamentId,
        analysis,
        intent: intentResult,
        config,
        explanations,
        comparison,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  openInSlicer: async () => {
    const { geometry, config, selectedPrinterId, selectedFilamentId, importedFile } = get();
    if (!geometry || !config) return;
    set({ error: null, slicerNotice: null });
    try {
      const result = await window.api.openInSlicer({
        geometry,
        config,
        printerId: selectedPrinterId,
        filamentId: selectedFilamentId,
        objectName: importedFile?.fileName.replace(/\.[^.]+$/, ""),
      });
      if (result.opened) {
        set({ slicerNotice: `Ouverture dans ${result.slicerName}…` });
        setTimeout(() => {
          if (get().slicerNotice === `Ouverture dans ${result.slicerName}…`) set({ slicerNotice: null });
        }, 4000);
      } else if (!result.canceled) {
        set({ error: result.message });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err) });
    }
  },

  startOver: () =>
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
    }),

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

  showToolNotice: (message) => {
    set({ toolNotice: message });
    setTimeout(() => {
      if (get().toolNotice === message) set({ toolNotice: null });
    }, 5000);
  },

  autoOptimize: async () => {
    const { geometry, analysis } = get();
    if (!geometry || !analysis) {
      get().showToolNotice("Importez d'abord un modèle pour lancer l'optimisation automatique.");
      return;
    }
    set({ intentText: "Trouve le meilleur compromis entre qualité, solidité et rapidité d'impression." });
    await get().generateConfiguration();
  },

  checkModelHealth: () => {
    const { analysis } = get();
    if (!analysis) {
      get().showToolNotice("Importez d'abord un modèle pour vérifier son intégrité.");
      return;
    }
    const confidencePercent = Math.round(analysis.analysisConfidence * 100);
    if (analysis.isManifold) {
      get().showToolNotice(`✓ Maillage valide, aucune réparation nécessaire (confiance d'analyse : ${confidencePercent}%).`);
    } else {
      get().showToolNotice(
        `⚠ Maillage non-manifold détecté (confiance d'analyse : ${confidencePercent}%). Utilisez l'outil de réparation intégré à PrusaSlicer ou Bambu Studio avant l'impression.`
      );
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
      case "edit:preferences":
        s.toggleAdvancedPanel();
        break;
      case "tools:auto-optimize":
        void s.autoOptimize();
        break;
      case "tools:repair":
        s.checkModelHealth();
        break;
      case "tools:scale":
        if (!s.analysis) s.showToolNotice("Importez d'abord un modèle pour accéder à la mise à l'échelle.");
        else s.toggleResizePanel();
        break;
      case "help:docs":
        s.openHelpDialog("aide");
        break;
      case "help:tutorials":
        s.replayOnboarding();
        break;
      case "help:about":
        s.openHelpDialog("apropos");
        break;
    }
  },
}));

if (import.meta.env.DEV) {
  (window as unknown as { __appStore: typeof useAppStore }).__appStore = useAppStore;
}
