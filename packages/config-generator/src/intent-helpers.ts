import type { ConfigGenerationInput, IntentTag } from "@layerai/shared-types";

export function getIntentWeight(input: ConfigGenerationInput, tag: IntentTag): number {
  return input.intent.weights.find((w) => w.tag === tag)?.weight ?? 0;
}

export const INTENT_APPLY_THRESHOLD = 0.15;
