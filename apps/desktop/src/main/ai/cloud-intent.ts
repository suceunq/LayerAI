import { resolveIntent } from "@layerai/intent-engine";
import type { IntentResult, IntentTag } from "@layerai/shared-types";
import * as providerStore from "./provider-store.js";
import { chatComplete } from "./provider-client.js";

const INTENT_TAGS: IntentTag[] = [
  "strength",
  "speed",
  "quality",
  "heatResistance",
  "filamentSaving",
  "outdoorUse",
  "silence",
  "minimalSupports",
  "figurine",
  "mechanicalPart",
  "prototype",
  "flexibility",
];

function buildPrompt(text: string): string {
  return `You are a print-intent classifier for a 3D printing assistant. Given a user's free-text description of what they want printed, output ONLY a JSON object (no markdown, no explanation) with this exact shape:
{"weights": [{"tag": "<tag>", "weight": <0..1>}], "languageDetected": "fr"|"en"|"unknown"}
Only include tags from this list, and only if clearly relevant (weight >= 0.15): ${INTENT_TAGS.join(", ")}.
User text: """${text}"""`;
}

function parseCloudResponse(raw: string, rawText: string): IntentResult | null {
  try {
    const jsonMatch = /\{[\s\S]*\}/.exec(raw);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as { weights?: { tag: string; weight: number }[]; languageDetected?: string };
    const weights = (parsed.weights ?? [])
      .filter((w): w is { tag: IntentTag; weight: number } => INTENT_TAGS.includes(w.tag as IntentTag) && typeof w.weight === "number")
      .map((w) => ({ tag: w.tag, weight: Math.max(0, Math.min(1, w.weight)), matchedPhrases: [] }));
    const languageDetected = parsed.languageDetected === "fr" || parsed.languageDetected === "en" ? parsed.languageDetected : "unknown";
    return { rawText, weights, unrecognized: weights.length === 0, languageDetected };
  } catch {
    return null;
  }
}

/**
 * Local rule-based resolution always runs first (free, instant, deterministic). If the user has
 * opted into cloud AI and configured a default provider, we try to let it reinterpret the text
 * instead - but any failure (missing key, network error, malformed response) silently falls back
 * to the local result rather than surfacing an error, since the local engine is always a valid
 * answer on its own.
 */
export async function resolveIntentWithOptionalCloud(text: string): Promise<IntentResult> {
  const localResult = resolveIntent(text);
  if (!text.trim()) return localResult;

  try {
    const cloudEnabled = await providerStore.getCloudIntentEnabled();
    if (!cloudEnabled) return localResult;

    const providerId = await providerStore.getDefaultProviderId();
    if (!providerId) return localResult;

    const apiKey = await providerStore.resolveApiKey(providerId);
    const config = await providerStore.getStoredProviderConfig(providerId);
    const raw = await chatComplete(providerId, { apiKey, model: config?.model, baseUrl: config?.baseUrl, prompt: buildPrompt(text) });
    return parseCloudResponse(raw, text) ?? localResult;
  } catch {
    return localResult;
  }
}
