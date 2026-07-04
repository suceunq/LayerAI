import { contextBridge, ipcRenderer } from "electron";
import { IpcChannels } from "../shared/ipc-channels.js";
import type { LayerAiApi } from "./api.js";

const api: LayerAiApi = {
  importOpenDialog: () => ipcRenderer.invoke(IpcChannels.importOpenDialog),
  importReadDropped: (filePath) => ipcRenderer.invoke(IpcChannels.importReadDropped, filePath),
  getPrinters: () => ipcRenderer.invoke(IpcChannels.profileDbGetPrinters),
  getFilaments: () => ipcRenderer.invoke(IpcChannels.profileDbGetFilaments),
  runAnalysis: (request) => ipcRenderer.invoke(IpcChannels.analysisRun, request),
  rescaleGeometry: (request) => ipcRenderer.invoke(IpcChannels.analysisRescale, request),
  generateConfig: (request) => ipcRenderer.invoke(IpcChannels.configGenerate, request),
  exportThreeMf: (request) => ipcRenderer.invoke(IpcChannels.exportThreeMf, request),
  exportIni: (request) => ipcRenderer.invoke(IpcChannels.exportIni, request),
  exportPdfReport: (payload) => ipcRenderer.invoke(IpcChannels.exportPdfReport, payload),
  openInSlicer: (payload) => ipcRenderer.invoke(IpcChannels.slicerOpen, payload),
  recordOutcome: (payload) => ipcRenderer.invoke(IpcChannels.learningRecordOutcome, payload),
  getCustomProfiles: () => ipcRenderer.invoke(IpcChannels.customProfilesList),
  saveCustomProfile: (request) => ipcRenderer.invoke(IpcChannels.customProfilesSave, request),
  deleteCustomProfile: (id) => ipcRenderer.invoke(IpcChannels.customProfilesDelete, id),
  getSettings: () => ipcRenderer.invoke(IpcChannels.settingsGet),
  setOnboardingCompleted: (completed) => ipcRenderer.invoke(IpcChannels.settingsSetOnboardingCompleted, completed),
  onMenuAction: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, action: string): void => callback(action);
    ipcRenderer.on(IpcChannels.menuAction, listener);
    return () => ipcRenderer.removeListener(IpcChannels.menuAction, listener);
  },
  getAppVersion: () => ipcRenderer.invoke(IpcChannels.appGetVersion),
};

contextBridge.exposeInMainWorld("api", api);
