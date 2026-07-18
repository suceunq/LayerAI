import de from "../renderer/src/i18n/locales/de.json";
import en from "../renderer/src/i18n/locales/en.json";
import es from "../renderer/src/i18n/locales/es.json";
import fr from "../renderer/src/i18n/locales/fr.json";
import it from "../renderer/src/i18n/locales/it.json";
import type { SupportedLanguage } from "../shared/languages.js";

const CATALOGS: Record<SupportedLanguage, Record<string, string>> = { fr, en, de, es, it };
let currentLanguage: SupportedLanguage = "fr";

export function setMainLanguage(language: SupportedLanguage): void {
  currentLanguage = language;
}

export function mainT(key: string, vars?: Record<string, string | number>): string {
  const template = CATALOGS[currentLanguage][key] ?? CATALOGS.fr[key] ?? key;
  if (!vars) return template;
  return Object.entries(vars).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), template);
}
