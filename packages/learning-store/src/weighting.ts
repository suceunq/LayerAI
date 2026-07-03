import type { OutcomeStats } from "./repository.js";

export interface LearningAdjustment {
  parameterKey: string;
  delta: number;
  ruleId: string;
  reason: string;
}

const MIN_SAMPLE_SIZE = 3;
const TRIGGER_RATIO = 0.4;

function ratio(stats: OutcomeStats, outcome: keyof OutcomeStats["byOutcome"]): number {
  if (stats.total < MIN_SAMPLE_SIZE) return 0;
  return (stats.byOutcome[outcome] ?? 0) / stats.total;
}

/**
 * Turns a history of past outcomes for similar (printer, filament, intent) jobs into small,
 * additive nudges on top of the rule-based config - an inspectable, non-destructive layer (never
 * overwrites the static rules, only shifts their result) that only kicks in once there's enough
 * signal (>= MIN_SAMPLE_SIZE) to be more than noise.
 */
export function computeAdjustments(stats: OutcomeStats): LearningAdjustment[] {
  const adjustments: LearningAdjustment[] = [];

  if (ratio(stats, "too_fragile") >= TRIGGER_RATIO) {
    adjustments.push(
      { parameterKey: "perimeters", delta: 1, ruleId: "learning.fragile_feedback", reason: "des impressions similaires ont été jugées trop fragiles" },
      { parameterKey: "fill_density", delta: 5, ruleId: "learning.fragile_feedback", reason: "des impressions similaires ont été jugées trop fragiles" }
    );
  }

  if (ratio(stats, "warping") >= TRIGGER_RATIO) {
    adjustments.push({
      parameterKey: "brim_width",
      delta: 3,
      ruleId: "learning.warping_feedback",
      reason: "du warping a été signalé sur des impressions similaires",
    });
  }

  if (ratio(stats, "detachment") >= TRIGGER_RATIO) {
    adjustments.push({
      parameterKey: "brim_width",
      delta: 4,
      ruleId: "learning.detachment_feedback",
      reason: "des décollements ont été signalés sur des impressions similaires",
    });
  }

  if (ratio(stats, "poor_quality") >= TRIGGER_RATIO) {
    adjustments.push({
      parameterKey: "layer_height",
      delta: -0.04,
      ruleId: "learning.quality_feedback",
      reason: "la qualité a été jugée insuffisante sur des impressions similaires",
    });
  }

  return adjustments;
}
