import { useAppStore } from "../state/useAppStore.js";
import { TRANSLATIONS, type Language } from "./translations.js";

export function translate(language: Language, key: string, vars?: Record<string, string | number>): string {
  const template = TRANSLATIONS[language][key] ?? TRANSLATIONS.fr[key] ?? key;
  if (!vars) return template;
  return Object.entries(vars).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), template);
}

export function useTranslation(): { t: (key: string, vars?: Record<string, string | number>) => string; language: Language } {
  const language = useAppStore((s) => s.language);
  return { t: (key, vars) => translate(language, key, vars), language };
}
