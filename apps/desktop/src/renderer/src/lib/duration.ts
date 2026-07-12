const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;
const MINUTES_PER_MONTH = 30 * MINUTES_PER_DAY;

export interface DurationParts {
  months: number;
  days: number;
  hours: number;
  minutes: number;
}

/** Splits a minute count into months/days/hours/minutes (30-day months - fine for a rough print-time estimate, never meant to be calendar-exact). */
export function breakDownMinutes(totalMinutesRaw: number): DurationParts {
  const totalMinutes = Math.max(0, Math.round(totalMinutesRaw));
  return {
    months: Math.floor(totalMinutes / MINUTES_PER_MONTH),
    days: Math.floor((totalMinutes % MINUTES_PER_MONTH) / MINUTES_PER_DAY),
    hours: Math.floor((totalMinutes % MINUTES_PER_DAY) / MINUTES_PER_HOUR),
    minutes: totalMinutes % MINUTES_PER_HOUR,
  };
}

/**
 * Formats a minute count as the largest applicable units (months down to minutes), instead of
 * always showing raw minutes - a multi-day print is much easier to read as "2 j 4 h 12 min" than
 * "3372 min". Only includes months/days when non-zero (or when a larger unit forces them in),
 * but always includes minutes so the estimate stays fully precise.
 */
export function formatDurationMinutes(totalMinutesRaw: number, t: (key: string, vars?: Record<string, string | number>) => string): string {
  const { months, days, hours, minutes } = breakDownMinutes(totalMinutesRaw);
  const parts: string[] = [];
  if (months > 0) parts.push(t("duration.months", { count: months }));
  if (months > 0 || days > 0) parts.push(t("duration.days", { count: days }));
  if (months > 0 || days > 0 || hours > 0) parts.push(t("duration.hours", { count: hours }));
  parts.push(t("duration.minutes", { count: minutes }));
  return parts.join(" ");
}
