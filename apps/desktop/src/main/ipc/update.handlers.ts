import { ipcMain } from "electron";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type { UpdateState } from "../../shared/ipc-types.js";
import * as updater from "../autoUpdater.js";
import { updateSettings } from "../settings-store.js";

export function registerUpdateHandlers(): void {
  ipcMain.handle(IpcChannels.updateCheck, async (): Promise<void> => {
    await updater.checkForUpdates();
  });

  ipcMain.handle(IpcChannels.updateDownload, async (): Promise<void> => {
    await updater.downloadUpdate();
  });

  ipcMain.handle(IpcChannels.updateCancelDownload, (): void => {
    updater.cancelDownload();
  });

  ipcMain.handle(IpcChannels.updateInstall, (): void => {
    updater.installUpdate();
  });

  ipcMain.handle(IpcChannels.updatePostpone, async (_event, version: string): Promise<void> => {
    await updateSettings({ postponedUpdateVersion: version });
  });

  ipcMain.handle(IpcChannels.updateGetState, (): UpdateState => updater.getUpdateState());
}
