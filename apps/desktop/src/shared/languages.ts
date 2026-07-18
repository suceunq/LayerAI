export const SUPPORTED_LANGUAGES = ["fr", "en", "de", "es", "it"] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export type LanguagePreference = SupportedLanguage | "system";

export const DEFAULT_LANGUAGE: SupportedLanguage = "fr";

export function resolveSupportedLanguage(locale: string | undefined): SupportedLanguage {
  const normalized = locale?.trim().toLowerCase().replace("_", "-") ?? "";
  const base = normalized.split("-")[0];
  return SUPPORTED_LANGUAGES.find((language) => language === base) ?? DEFAULT_LANGUAGE;
}

export function isLanguagePreference(value: unknown): value is LanguagePreference {
  return value === "system" || SUPPORTED_LANGUAGES.includes(value as SupportedLanguage);
}
