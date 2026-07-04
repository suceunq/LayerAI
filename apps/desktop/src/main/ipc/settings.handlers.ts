import { ipcMain, app } from "electron";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type { AppSettings, SupportedLanguage } from "../../shared/ipc-types.js";
import { readSettings, updateSettings } from "../settings-store.js";
import { buildAppMenu } from "../menu.js";

export function registerSettingsHandlers(): void {
  ipcMain.handle(IpcChannels.settingsGet, async (): Promise<AppSettings> => readSettings());

  ipcMain.handle(IpcChannels.settingsSetOnboardingCompleted, async (_event, completed: boolean): Promise<void> => {
    await updateSettings({ onboardingCompleted: completed });
  });

  ipcMain.handle(IpcChannels.settingsSetLanguage, async (_event, language: SupportedLanguage): Promise<void> => {
    await updateSettings({ language });
    buildAppMenu(language);
  });

  ipcMain.handle(IpcChannels.appGetVersion, (): string => app.getVersion());
}
