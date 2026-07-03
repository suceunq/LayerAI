import type { ConfigGenerationInput } from "@layerai/shared-types";
import type { ConfigBuilder } from "../builder.js";
import { getIntentWeight, INTENT_APPLY_THRESHOLD } from "../intent-helpers.js";

export function applyUsageContextRules(builder: ConfigBuilder, input: ConfigGenerationInput): void {
  const outdoorWeight = getIntentWeight(input, "outdoorUse");
  const figurineWeight = getIntentWeight(input, "figurine");
  const silenceWeight = getIntentWeight(input, "silence");
  const minimalSupportsWeight = getIntentWeight(input, "minimalSupports");

  if (outdoorWeight >= INTENT_APPLY_THRESHOLD) {
    const confidence = 0.5 + outdoorWeight * 0.35;
    builder.setNumeric("perimeters", 3, outdoorWeight, confidence, "outdoor.perimeters", 0);
    builder.setNumeric("fill_density", 30, outdoorWeight, confidence, "outdoor.fill_density", 0);
    builder.setNumeric("top_solid_layers", 5, outdoorWeight, confidence * 0.8, "outdoor.top_solid_layers", 0);
  }

  if (figurineWeight >= INTENT_APPLY_THRESHOLD) {
    const confidence = 0.5 + figurineWeight * 0.35;
    builder.setNumeric("layer_height", 0.12, figurineWeight, confidence, "figurine.layer_height_fine", 2);
    builder.setNumeric("top_solid_layers", 6, figurineWeight, confidence, "figurine.top_solid_layers", 0);
    builder.setNumeric("bottom_solid_layers", 5, figurineWeight, confidence, "figurine.bottom_solid_layers", 0);
    builder.setNumeric("fill_density", 15, figurineWeight, confidence * 0.7, "figurine.fill_density", 0);
    builder.setNumeric("perimeter_speed", 30, figurineWeight, confidence, "figurine.perimeter_speed_detail", 0);
    builder.setCategorical("support_material_style", "organic", confidence, "figurine.support_style_organic");
  }

  if (silenceWeight >= INTENT_APPLY_THRESHOLD) {
    const confidence = 0.55 + silenceWeight * 0.35;
    builder.setNumeric("perimeter_speed", 25, silenceWeight, confidence, "silence.perimeter_speed_slow", 0);
    builder.setNumeric("infill_speed", 35, silenceWeight, confidence, "silence.infill_speed_slow", 0);
    builder.setNumeric("travel_speed", 80, silenceWeight, confidence, "silence.travel_speed_slow", 0);
    builder.setNumeric("default_acceleration", 800, silenceWeight, confidence, "silence.acceleration_low", 0);
  }

  if (minimalSupportsWeight >= INTENT_APPLY_THRESHOLD) {
    const highOverhangRisk = input.analysis.riskFlags.some((f) => f.id === "unsupported_overhang" && f.severity === "high");
    const confidence = minimalSupportsWeight * (highOverhangRisk ? 0.4 : 0.85);
    builder.setCategorical("support_material", false, confidence, "minimal_supports.disable");
    builder.setCategorical("support_material_style", "snug", confidence * 0.6, "minimal_supports.style_snug");
  }
}
