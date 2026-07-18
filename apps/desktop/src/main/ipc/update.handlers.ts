import { ipcMain } from "electron";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type { UpdateState } from "../../shared/ipc-types.js";
import * as updater from "../autoUpdater.js";

export function registerUpdateHandlers(): void {
  ipcMain.handle(IpcChannels.updateCheck, async (): Promise<void> => {
    await updater.checkForUpdates();
  });

  ipcMain.handle(IpcChannels.updateAcknowledgeReleaseNotes, async (): Promise<void> => {
    await updater.acknowledgeReleaseNotes();
  });

  ipcMain.handle(IpcChannels.updateGetState, (): UpdateState => updater.getUpdateState());
}
