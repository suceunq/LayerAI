import { contextBridge, ipcRenderer } from "electron";
import { IpcChannels } from "../shared/ipc-channels.js";
import type { UpdateState } from "../shared/ipc-types.js";
import type { LayerAiApi } from "./api.js";

const api: LayerAiApi = {
  importOpenDialog: () => ipcRenderer.invoke(IpcChannels.importOpenDialog),
  importReadDropped: (filePath) => ipcRenderer.invoke(IpcChannels.importReadDropped, filePath),
  getPrinters: () => ipcRenderer.invoke(IpcChannels.profileDbGetPrinters),
  getFilaments: () => ipcRenderer.invoke(IpcChannels.profileDbGetFilaments),
  runAnalysis: (request) => ipcRenderer.invoke(IpcChannels.analysisRun, request),
  rescaleGeometry: (request) => ipcRenderer.invoke(IpcChannels.analysisRescale, request),
  reorientGeometry: (request) => ipcRenderer.invoke(IpcChannels.analysisReorient, request),
  generateConfig: (request) => ipcRenderer.invoke(IpcChannels.configGenerate, request),
  exportThreeMf: (request) => ipcRenderer.invoke(IpcChannels.exportThreeMf, request),
  exportIni: (request) => ipcRenderer.invoke(IpcChannels.exportIni, request),
  exportBambuProfile: (request) => ipcRenderer.invoke(IpcChannels.exportBambuProfile, request),
  exportCaptureImage: (request) => ipcRenderer.invoke(IpcChannels.exportCaptureImage, request),
  exportPdfReport: (payload) => ipcRenderer.invoke(IpcChannels.exportPdfReport, payload),
  openInSlicer: (payload) => ipcRenderer.invoke(IpcChannels.slicerOpen, payload),
  recordOutcome: (payload) => ipcRenderer.invoke(IpcChannels.learningRecordOutcome, payload),
  getCustomProfiles: () => ipcRenderer.invoke(IpcChannels.customProfilesList),
  saveCustomProfile: (request) => ipcRenderer.invoke(IpcChannels.customProfilesSave, request),
  deleteCustomProfile: (id) => ipcRenderer.invoke(IpcChannels.customProfilesDelete, id),
  getRecentProjects: () => ipcRenderer.invoke(IpcChannels.recentProjectsList),
  recordRecentProject: (request) => ipcRenderer.invoke(IpcChannels.recentProjectsRecord, request),
  removeRecentProject: (id) => ipcRenderer.invoke(IpcChannels.recentProjectsRemove, id),
  getSettings: () => ipcRenderer.invoke(IpcChannels.settingsGet),
  setOnboardingCompleted: (completed) => ipcRenderer.invoke(IpcChannels.settingsSetOnboardingCompleted, completed),
  setLanguage: (language) => ipcRenderer.invoke(IpcChannels.settingsSetLanguage, language),
  setTheme: (theme) => ipcRenderer.invoke(IpcChannels.settingsSetTheme, theme),
  setCheckUpdatesOnStartup: (enabled) => ipcRenderer.invoke(IpcChannels.settingsSetCheckUpdatesOnStartup, enabled),
  setCostSettings: (costs) => ipcRenderer.invoke(IpcChannels.settingsSetCosts, costs),
  setLastSelection: (request) => ipcRenderer.invoke(IpcChannels.settingsSetLastSelection, request),
  setCompanySettings: (company) => ipcRenderer.invoke(IpcChannels.settingsSetCompany, company),
  generateInvoice: (request) => ipcRenderer.invoke(IpcChannels.invoiceGenerate, request),
  onMenuAction: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, action: string): void => callback(action);
    ipcRenderer.on(IpcChannels.menuAction, listener);
    return () => ipcRenderer.removeListener(IpcChannels.menuAction, listener);
  },
  getAppVersion: () => ipcRenderer.invoke(IpcChannels.appGetVersion),
  getAiSettings: () => ipcRenderer.invoke(IpcChannels.aiGetSettings),
  saveAiProvider: (request) => ipcRenderer.invoke(IpcChannels.aiSaveProvider, request),
  deleteAiProvider: (id) => ipcRenderer.invoke(IpcChannels.aiDeleteProvider, id),
  setDefaultAiProvider: (id) => ipcRenderer.invoke(IpcChannels.aiSetDefaultProvider, id),
  setCloudIntentEnabled: (enabled) => ipcRenderer.invoke(IpcChannels.aiSetCloudIntentEnabled, enabled),
  testAiProvider: (request) => ipcRenderer.invoke(IpcChannels.aiTestProvider, request),
  diagnosePrintPhoto: (request) => ipcRenderer.invoke(IpcChannels.aiDiagnosePhoto, request),
  checkForUpdates: () => ipcRenderer.invoke(IpcChannels.updateCheck),
  downloadUpdate: () => ipcRenderer.invoke(IpcChannels.updateDownload),
  cancelUpdateDownload: () => ipcRenderer.invoke(IpcChannels.updateCancelDownload),
  installUpdate: () => ipcRenderer.invoke(IpcChannels.updateInstall),
  postponeUpdate: (version) => ipcRenderer.invoke(IpcChannels.updatePostpone, version),
  getUpdateState: () => ipcRenderer.invoke(IpcChannels.updateGetState),
  onUpdateStateChanged: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, state: UpdateState): void => callback(state);
    ipcRenderer.on(IpcChannels.updateStateChanged, listener);
    return () => ipcRenderer.removeListener(IpcChannels.updateStateChanged, listener);
  },
};

contextBridge.exposeInMainWorld("api", api);
