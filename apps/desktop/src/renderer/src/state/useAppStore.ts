import { create } from "zustand";
import type {
  PrinterProfile,
  FilamentProfile,
  MeshGeometryData,
  MeshAnalysisResult,
  IntentResult,
  GeneratedConfig,
  ExplanationSet,
} from "@layerai/shared-types";
import type { ImportedFilePayload } from "../../../preload/api.js";

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
  showAdvanced: boolean;

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
  startOver: () => void;
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
  showAdvanced: false,

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
      const { intent, config, explanations } = await window.api.generateConfig({
        geometry,
        analysis,
        intentText,
        printerId: selectedPrinterId,
        filamentId: selectedFilamentId,
      });
      set({ intentResult: intent, config, explanations, step: "review" });
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
      error: null,
    }),
}));

if (import.meta.env.DEV) {
  (window as unknown as { __appStore: typeof useAppStore }).__appStore = useAppStore;
}
