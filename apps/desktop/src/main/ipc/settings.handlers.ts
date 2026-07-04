import { ipcMain, app } from "electron";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { IpcChannels } from "../../shared/ipc-channels.js";

interface AppSettings {
  onboardingCompleted: boolean;
}

const DEFAULT_SETTINGS: AppSettings = { onboardingCompleted: false };

function settingsFilePath(): string {
  return join(app.getPath("userData"), "settings.json");
}

async function readSettings(): Promise<AppSettings> {
  try {
    const raw = await readFile(settingsFilePath(), "utf-8");
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function writeSettings(settings: AppSettings): Promise<void> {
  await mkdir(app.getPath("userData"), { recursive: true });
  await writeFile(settingsFilePath(), JSON.stringify(settings, null, 2), "utf-8");
}

export function registerSettingsHandlers(): void {
  ipcMain.handle(IpcChannels.settingsGet, async (): Promise<AppSettings> => readSettings());

  ipcMain.handle(IpcChannels.settingsSetOnboardingCompleted, async (_event, completed: boolean): Promise<void> => {
    const settings = await readSettings();
    await writeSettings({ ...settings, onboardingCompleted: completed });
  });
}
