import type { SupportedLanguage } from "../../../shared/languages.js";
import de from "./locales/de.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import it from "./locales/it.json";

export type Language = SupportedLanguage;
export type TranslationKey = keyof typeof en;
export type TranslationCatalog = Record<TranslationKey, string>;

export const TRANSLATIONS: Record<Language, TranslationCatalog> = {
  fr,
  en,
  de,
  es,
  it,
};
