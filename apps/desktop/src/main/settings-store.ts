import { app } from "electron";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { AppSettings } from "../shared/ipc-types.js";
import { isLanguagePreference, resolveSupportedLanguage } from "../shared/languages.js";

const DEFAULT_SETTINGS: AppSettings = { onboardingCompleted: false };

function settingsFilePath(): string {
  return join(app.getPath("userData"), "settings.json");
}

export async function readSettings(): Promise<AppSettings> {
  try {
    const raw = await readFile(settingsFilePath(), "utf-8");
    const stored = JSON.parse(raw) as Partial<AppSettings>;
    const languagePreference = isLanguagePreference(stored.languagePreference)
      ? stored.languagePreference
      : isLanguagePreference(stored.language)
        ? stored.language
        : "system";
    const language = languagePreference === "system" ? resolveSupportedLanguage(app.getLocale()) : languagePreference;
    return { ...DEFAULT_SETTINGS, ...stored, language, languagePreference };
  } catch {
    return {
      ...DEFAULT_SETTINGS,
      language: resolveSupportedLanguage(app.getLocale()),
      languagePreference: "system",
    };
  }
}

export async function writeSettings(settings: AppSettings): Promise<void> {
  await mkdir(app.getPath("userData"), { recursive: true });
  await writeFile(settingsFilePath(), JSON.stringify(settings, null, 2), "utf-8");
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await readSettings();
  const next = { ...current, ...patch };
  await writeSettings(next);
  return next;
}
