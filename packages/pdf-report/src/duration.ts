const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;
const MINUTES_PER_MONTH = 30 * MINUTES_PER_DAY;

/**
 * Formats a minute count as the largest applicable units (mois/j/h/min) instead of raw minutes -
 * a multi-day print reads far better as "2 j 4 h 12 min" than "3372 min". 30-day months are a
 * rough approximation, fine for a print-time estimate that's already labelled indicative.
 */
export function formatDuration(totalMinutesRaw: number, language: "fr" | "en" | "de" | "es" | "it"): string {
  const totalMinutes = Math.max(0, Math.round(totalMinutesRaw));
  const months = Math.floor(totalMinutes / MINUTES_PER_MONTH);
  const days = Math.floor((totalMinutes % MINUTES_PER_MONTH) / MINUTES_PER_DAY);
  const hours = Math.floor((totalMinutes % MINUTES_PER_DAY) / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;

  const parts: string[] = [];
  const monthLabel = { fr: "mois", en: "mo", de: "Mon.", es: "mes", it: "mese" }[language];
  const dayLabel = { fr: "j", en: "d", de: "T", es: "d", it: "g" }[language];
  if (months > 0) parts.push(`${months} ${monthLabel}`);
  if (months > 0 || days > 0) parts.push(`${days} ${dayLabel}`);
  if (months > 0 || days > 0 || hours > 0) parts.push(`${hours} h`);
  parts.push(`${minutes} min`);

  return parts.join(" ");
}
