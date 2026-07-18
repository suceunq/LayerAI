import { ipcMain, app, nativeTheme } from "electron";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type {
  AppSettings,
  CompanySettings,
  CostSettings,
  LastSelectionRequest,
  LanguagePreference,
  SupportedLanguage,
  SupportedTheme,
  SupportedInterfaceMode,
} from "../../shared/ipc-types.js";
import { isLanguagePreference, resolveSupportedLanguage } from "../../shared/languages.js";
import { readSettings, updateSettings } from "../settings-store.js";
import { buildAppMenu } from "../menu.js";
import { mainT, setMainLanguage } from "../localization.js";

export function registerSettingsHandlers(): void {
  ipcMain.handle(IpcChannels.settingsGet, async (): Promise<AppSettings> => readSettings());

  ipcMain.handle(IpcChannels.settingsSetOnboardingCompleted, async (_event, completed: boolean): Promise<void> => {
    await updateSettings({ onboardingCompleted: completed });
  });

  ipcMain.handle(IpcChannels.settingsSetLanguage, async (_event, preference: LanguagePreference): Promise<SupportedLanguage> => {
    if (!isLanguagePreference(preference)) throw new Error(mainT("native.language.unsupported"));
    const language = preference === "system" ? resolveSupportedLanguage(app.getLocale()) : preference;
    await updateSettings({ language: preference === "system" ? undefined : language, languagePreference: preference });
    setMainLanguage(language);
    buildAppMenu(language);
    return language;
  });

  ipcMain.handle(IpcChannels.settingsSetTheme, async (_event, theme: SupportedTheme): Promise<void> => {
    await updateSettings({ theme });
    nativeTheme.themeSource = theme;
  });

  ipcMain.handle(IpcChannels.settingsSetInterfaceMode, async (_event, interfaceMode: SupportedInterfaceMode): Promise<void> => {
    await updateSettings({ interfaceMode });
  });

  ipcMain.handle(IpcChannels.settingsSetCheckUpdatesOnStartup, async (_event, enabled: boolean): Promise<void> => {
    await updateSettings({ checkUpdatesOnStartup: enabled });
  });

  ipcMain.handle(IpcChannels.settingsSetCosts, async (_event, costs: CostSettings): Promise<void> => {
    await updateSettings({ costs });
  });

  ipcMain.handle(IpcChannels.settingsSetLastSelection, async (_event, request: LastSelectionRequest): Promise<void> => {
    await updateSettings({ lastPrinterId: request.printerId, lastFilamentId: request.filamentId });
  });

  ipcMain.handle(IpcChannels.settingsSetCompany, async (_event, company: CompanySettings): Promise<void> => {
    await updateSettings({ company });
  });

  ipcMain.handle(IpcChannels.appGetVersion, (): string => app.getVersion());
}
