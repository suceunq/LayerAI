import { contextBridge, ipcRenderer } from "electron";
import { IpcChannels } from "../shared/ipc-channels.js";
import type { LayerAiApi, ImportedFilePayload } from "./api.js";

const api: LayerAiApi = {
  importOpenDialog: (): Promise<ImportedFilePayload | null> => ipcRenderer.invoke(IpcChannels.importOpenDialog),
  importReadDropped: (filePath: string): Promise<ImportedFilePayload> =>
    ipcRenderer.invoke(IpcChannels.importReadDropped, filePath),
  getPrinters: (): Promise<unknown[]> => ipcRenderer.invoke(IpcChannels.profileDbGetPrinters),
  getFilaments: (): Promise<unknown[]> => ipcRenderer.invoke(IpcChannels.profileDbGetFilaments),
  runAnalysis: (payload: unknown): Promise<unknown> => ipcRenderer.invoke(IpcChannels.analysisRun, payload),
  generateConfig: (payload: unknown): Promise<unknown> => ipcRenderer.invoke(IpcChannels.configGenerate, payload),
  exportThreeMf: (payload: unknown): Promise<unknown> => ipcRenderer.invoke(IpcChannels.exportThreeMf, payload),
  exportPdfReport: (payload: unknown): Promise<unknown> => ipcRenderer.invoke(IpcChannels.exportPdfReport, payload),
  recordOutcome: (payload: unknown): Promise<unknown> => ipcRenderer.invoke(IpcChannels.learningRecordOutcome, payload),
};

contextBridge.exposeInMainWorld("api", api);
