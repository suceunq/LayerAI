import { ipcMain, app } from "electron";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type { AppSettings } from "../../shared/ipc-types.js";
import { readSettings, updateSettings } from "../settings-store.js";

export function registerSettingsHandlers(): void {
  ipcMain.handle(IpcChannels.settingsGet, async (): Promise<AppSettings> => readSettings());

  ipcMain.handle(IpcChannels.settingsSetOnboardingCompleted, async (_event, completed: boolean): Promise<void> => {
    await updateSettings({ onboardingCompleted: completed });
  });

  ipcMain.handle(IpcChannels.appGetVersion, (): string => app.getVersion());
}
