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
} from "@layerai/shared-types";
import type { ImportedFilePayload } from "../../../preload/api.js";
import type { CustomProfile } from "../../../shared/ipc-types.js";

export type AppStep = "import" | "analyzing" | "intent" | "generating" | "review";

interface AppState {
  step: AppStep;
  error: string | null;

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

  customProfiles: CustomProfile[];

  loadProfileDb: () => Promise<void>;
  setPrinter: (id: string) => void;
  setFilament: (id: string) => void;
  importFromDialog: () => Promise<void>;
  importDroppedPath: (filePath: string) => Promise<void>;
  setIntentText: (text: string) => void;
  generateConfiguration: () => Promise<void>;
  toggleAdvanced: () => void;
  updateConfigValue: (key: string, value: string | number | boolean) => void;
  exportThreeMf: () => Promise<void>;
  exportIni: () => Promise<void>;
  exportPdfReport: () => Promise<void>;
  startOver: () => void;

  loadCustomProfiles: () => Promise<void>;
  saveCurrentAsProfile: (name: string) => Promise<void>;
  applyCustomProfile: (profile: CustomProfile) => void;
  deleteCustomProfile: (id: string) => Promise<void>;
}

async function runAnalysisForFile(file: ImportedFilePayload): Promise<{ geometry: MeshGeometryData; analysis: MeshAnalysisResult }> {
  return window.api.runAnalysis({ file });
}

export const useAppStore = create<AppState>((set, get) => ({
  step: "import",
  error: null,

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

  customProfiles: [],

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

  setPrinter: (id) => set({ selectedPrinterId: id }),
  setFilament: (id) => set({ selectedFilamentId: id }),

  importFromDialog: async () => {
    try {
      const file = await window.api.importOpenDialog();
      if (!file) return;
      set({ importedFile: file, step: "analyzing", error: null });
      const { geometry, analysis } = await runAnalysisForFile(file);
      set({ geometry, analysis, step: "intent" });
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
    } catch (err) {
      set({ error: err instanceof Error ? err.message : String(err), step: "import" });
    }
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

  startOver: () =>
    set({
      step: "import",
      importedFile: null,
      geometry: null,
      analysis: null,
      intentText: "",
      intentResult: null,
      config: null,
      explanations: null,
      comparison: null,
      error: null,
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
}));

if (import.meta.env.DEV) {
  (window as unknown as { __appStore: typeof useAppStore }).__appStore = useAppStore;
}
