import { contextBridge, ipcRenderer } from "electron";
import { IpcChannels } from "../shared/ipc-channels.js";
import type { PublishProgressEvent } from "../shared/ipc-types.js";
import type { UpdateManagerApi } from "./api.js";

const api: UpdateManagerApi = {
  projects: {
    list: () => ipcRenderer.invoke(IpcChannels.projectsList),
    get: (id) => ipcRenderer.invoke(IpcChannels.projectsGet, id),
    create: (request) => ipcRenderer.invoke(IpcChannels.projectsCreate, request),
    update: (request) => ipcRenderer.invoke(IpcChannels.projectsUpdate, request),
    delete: (id) => ipcRenderer.invoke(IpcChannels.projectsDelete, id),
    openStagingFolder: (id) => ipcRenderer.invoke(IpcChannels.projectsOpenStagingFolder, id),
  },
  githubProfiles: {
    list: () => ipcRenderer.invoke(IpcChannels.githubProfilesList),
    create: (request) => ipcRenderer.invoke(IpcChannels.githubProfilesCreate, request),
    update: (request) => ipcRenderer.invoke(IpcChannels.githubProfilesUpdate, request),
    delete: (id) => ipcRenderer.invoke(IpcChannels.githubProfilesDelete, id),
    testConnection: (request) => ipcRenderer.invoke(IpcChannels.githubProfilesTestConnection, request),
  },
  history: {
    list: (projectId) => ipcRenderer.invoke(IpcChannels.historyList, projectId),
  },
  dialogs: {
    pickDirectory: () => ipcRenderer.invoke(IpcChannels.dialogPickDirectory),
    pickIcon: () => ipcRenderer.invoke(IpcChannels.dialogPickIcon),
  },
  pickFiles: () => ipcRenderer.invoke(IpcChannels.filesPick),
  pickManifest: () => ipcRenderer.invoke(IpcChannels.manifestPick),
  importManifest: (manifestPath) => ipcRenderer.invoke(IpcChannels.manifestImport, manifestPath),
  publish: (request) => ipcRenderer.invoke(IpcChannels.publishRun, request),
  getAppVersion: () => ipcRenderer.invoke(IpcChannels.appGetVersion),
  onPublishProgress: (callback) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: PublishProgressEvent): void => callback(progress);
    ipcRenderer.on(IpcChannels.publishProgress, listener);
    return () => ipcRenderer.removeListener(IpcChannels.publishProgress, listener);
  },
};

contextBridge.exposeInMainWorld("api", api);
