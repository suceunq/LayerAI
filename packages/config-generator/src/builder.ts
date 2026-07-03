import type { ConfigPrimitive, GeneratedConfig } from "@layerai/shared-types";

interface NumericAccumulator {
  weightedSum: number;
  weightTotal: number;
  lastRuleId: string;
  maxConfidence: number;
  precision: number;
}

interface CategoricalEntry {
  value: ConfigPrimitive;
  confidence: number;
  ruleId: string;
}

/**
 * Accumulates parameter proposals from independent rules into a single GeneratedConfig.
 * Numeric keys blend proposals as a confidence/intent-weighted average (so simultaneous intents
 * like "compromis vitesse et qualite" produce an in-between value rather than one rule silently
 * overwriting another). Categorical/boolean keys use highest-confidence-wins, so a strongly
 * signalled rule can't be clobbered by a weaker baseline default applied afterwards.
 */
export class ConfigBuilder {
  private readonly numeric = new Map<string, NumericAccumulator>();
  private readonly categorical = new Map<string, CategoricalEntry>();

  /** `weight` is typically the source intent's weight (0..1), or 1.0 for baseline/analysis-derived facts. */
  setNumeric(key: string, value: number, weight: number, confidence: number, ruleId: string, precision = 2): void {
    if (weight <= 0) return;
    const existing = this.numeric.get(key) ?? { weightedSum: 0, weightTotal: 0, lastRuleId: ruleId, maxConfidence: 0, precision };
    existing.weightedSum += value * weight;
    existing.weightTotal += weight;
    existing.lastRuleId = ruleId;
    existing.maxConfidence = Math.max(existing.maxConfidence, confidence);
    existing.precision = precision;
    this.numeric.set(key, existing);
  }

  setCategorical(key: string, value: ConfigPrimitive, confidence: number, ruleId: string): void {
    const existing = this.categorical.get(key);
    if (!existing || confidence >= existing.confidence) {
      this.categorical.set(key, { value, confidence, ruleId });
    }
  }

  getNumericValue(key: string): number | undefined {
    const acc = this.numeric.get(key);
    if (!acc || acc.weightTotal === 0) return undefined;
    return acc.weightedSum / acc.weightTotal;
  }

  build(): GeneratedConfig {
    const result: GeneratedConfig = {};

    for (const [key, acc] of this.numeric) {
      if (acc.weightTotal === 0) continue;
      const raw = acc.weightedSum / acc.weightTotal;
      const factor = Math.pow(10, acc.precision);
      result[key] = {
        value: Math.round(raw * factor) / factor,
        confidence: Math.max(0, Math.min(1, acc.maxConfidence)),
        ruleId: acc.lastRuleId,
      };
    }

    for (const [key, cat] of this.categorical) {
      result[key] = { value: cat.value, confidence: Math.max(0, Math.min(1, cat.confidence)), ruleId: cat.ruleId };
    }

    return result;
  }
}
