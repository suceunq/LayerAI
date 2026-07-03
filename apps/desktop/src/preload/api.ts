export interface ImportedFilePayload {
  fileName: string;
  format: "stl" | "obj" | "3mf";
  data: Uint8Array;
}

export interface LayerAiApi {
  importOpenDialog: () => Promise<ImportedFilePayload | null>;
  importReadDropped: (filePath: string) => Promise<ImportedFilePayload>;
  getPrinters: () => Promise<unknown[]>;
  getFilaments: () => Promise<unknown[]>;
  runAnalysis: (payload: unknown) => Promise<unknown>;
  generateConfig: (payload: unknown) => Promise<unknown>;
  exportThreeMf: (payload: unknown) => Promise<unknown>;
  exportPdfReport: (payload: unknown) => Promise<unknown>;
  recordOutcome: (payload: unknown) => Promise<unknown>;
}
