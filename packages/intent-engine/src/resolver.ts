import type { IntentResult, IntentTag, IntentWeight, MatchedPhrase } from "@layerai/shared-types";
import { normalizeText } from "./normalize.js";
import { detectLanguage } from "./language.js";
import { LEXICON, INTENSITY_BOOSTERS, INTENSITY_DAMPENERS } from "./lexicon.js";
import { matchesPattern } from "./pattern-matcher.js";

function intensityMultiplier(normalizedText: string): number {
  const boosted = INTENSITY_BOOSTERS.some((word) => matchesPattern(normalizedText, word.trim()));
  const dampened = INTENSITY_DAMPENERS.some((word) => matchesPattern(normalizedText, word.trim()));
  if (boosted) return 1.15;
  if (dampened) return 0.7;
  return 1;
}

/**
 * Resolves free-text user intent into weighted tags via deterministic substring matching against
 * a FR/EN lexicon. Every match keeps its source rule id and matched phrase so the UI (and the
 * explanation engine downstream) can show exactly why a tag was detected.
 */
export function resolveIntent(rawText: string): IntentResult {
  const normalized = normalizeText(rawText);
  const multiplier = intensityMultiplier(normalized);

  const weightByTag = new Map<IntentTag, number>();
  const matchesByTag = new Map<IntentTag, MatchedPhrase[]>();

  for (const rule of LEXICON) {
    const matchedPattern = rule.patterns.find((p) => matchesPattern(normalized, p));
    if (!matchedPattern) continue;

    const weight = Math.max(0, Math.min(1, rule.weight * multiplier));
    for (const tag of rule.tags) {
      const existing = weightByTag.get(tag) ?? 0;
      weightByTag.set(tag, Math.max(existing, weight));
      if (!matchesByTag.has(tag)) matchesByTag.set(tag, []);
      matchesByTag.get(tag)!.push({ text: matchedPattern, ruleId: rule.id });
    }
  }

  const weights: IntentWeight[] = Array.from(weightByTag.entries())
    .map(([tag, weight]) => ({ tag, weight, matchedPhrases: matchesByTag.get(tag) ?? [] }))
    .sort((a, b) => b.weight - a.weight);

  return {
    rawText,
    weights,
    unrecognized: weights.length === 0,
    languageDetected: detectLanguage(normalized),
  };
}
