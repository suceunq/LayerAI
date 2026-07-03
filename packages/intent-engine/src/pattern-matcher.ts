function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const compiledPatterns = new Map<string, RegExp>();

/** Word-boundary-aware match so short patterns (e.g. "vite") don't false-positive inside longer words (e.g. "eviter"). */
export function matchesPattern(normalizedText: string, pattern: string): boolean {
  let regex = compiledPatterns.get(pattern);
  if (!regex) {
    regex = new RegExp(`\\b${escapeRegExp(pattern)}\\b`);
    compiledPatterns.set(pattern, regex);
  }
  return regex.test(normalizedText);
}
