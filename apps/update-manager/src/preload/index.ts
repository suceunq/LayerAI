import { contextBridge, ipcRenderer } from "electron";
import { IpcChannels } from "../shared/ipc-channels.js";
import type { PublishProgressEvent } from "../shared/ipc-types.js";
import type { UpdateManagerApi } from "./api.js";

const api: UpdateManagerApi = {
  getConfig: () => ipcRenderer.invoke(IpcChannels.configGet),
  saveConfig: (request) => ipcRenderer.invoke(IpcChannels.configSave, request),
  pickFiles: () => ipcRenderer.invoke(IpcChannels.filesPick),
  publish: (request) => ipcRenderer.invoke(IpcChannels.publishRun, request),
  getHistory: () => ipcRenderer.invoke(IpcChannels.historyList),
  getAppVersion: () => ipcRenderer.invoke(IpcChannels.appGetVersion),
  onPublishProgress: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: PublishProgressEvent): void => callback(progress);
    ipcRenderer.on(IpcChannels.publishProgress, listener);
    return () => ipcRenderer.removeListener(IpcChannels.publishProgress, listener);
  },
};

contextBridge.exposeInMainWorld("api", api);
