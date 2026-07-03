import type { ConfigGenerationInput } from "@layerai/shared-types";
import { getLayerHeightRange } from "@layerai/prusa-profile-db";
import type { ConfigBuilder } from "../builder.js";
import { getIntentWeight, INTENT_APPLY_THRESHOLD } from "../intent-helpers.js";

export function applyQualityAndSpeedRules(builder: ConfigBuilder, input: ConfigGenerationInput): void {
  const qualityWeight = getIntentWeight(input, "quality");
  const speedWeight = getIntentWeight(input, "speed") + getIntentWeight(input, "prototype") * 0.8;
  const layerRange = getLayerHeightRange(input.printer.id);
  const minLayer = layerRange?.minLayerHeightMm ?? 0.1;
  const maxLayer = layerRange?.maxLayerHeightMm ?? 0.3;

  if (qualityWeight >= INTENT_APPLY_THRESHOLD) {
    const confidence = 0.55 + qualityWeight * 0.4;
    builder.setNumeric("layer_height", minLayer, qualityWeight, confidence, "quality.layer_height_fine", 2);
    builder.setNumeric("perimeters", 3, qualityWeight, confidence, "quality.perimeters", 0);
    builder.setNumeric("top_solid_layers", 6, qualityWeight, confidence, "quality.top_solid_layers", 0);
    builder.setNumeric("bottom_solid_layers", 5, qualityWeight, confidence, "quality.bottom_solid_layers", 0);
    builder.setNumeric("perimeter_speed", 35, qualityWeight, confidence, "quality.perimeter_speed_slower", 0);
    builder.setNumeric("infill_speed", 60, qualityWeight, confidence, "quality.infill_speed_slower", 0);
    builder.setCategorical("fill_pattern", "gyroid", confidence, "quality.fill_pattern");
  }

  if (speedWeight >= INTENT_APPLY_THRESHOLD) {
    const confidence = 0.55 + Math.min(speedWeight, 1) * 0.4;
    const speedLayerHeight = Math.min(maxLayer, minLayer + (maxLayer - minLayer) * 0.85);
    builder.setNumeric("layer_height", speedLayerHeight, speedWeight, confidence, "speed.layer_height_coarse", 2);
    builder.setNumeric("perimeters", 2, speedWeight, confidence, "speed.perimeters_minimal", 0);
    builder.setNumeric("top_solid_layers", 3, speedWeight, confidence, "speed.top_solid_layers_minimal", 0);
    builder.setNumeric("bottom_solid_layers", 3, speedWeight, confidence, "speed.bottom_solid_layers_minimal", 0);
    builder.setNumeric("perimeter_speed", 65, speedWeight, confidence, "speed.perimeter_speed_faster", 0);
    builder.setNumeric("infill_speed", 120, speedWeight, confidence, "speed.infill_speed_faster", 0);
    builder.setNumeric("travel_speed", 200, speedWeight, confidence, "speed.travel_speed_faster", 0);
    builder.setNumeric("default_acceleration", 3500, speedWeight, confidence, "speed.acceleration_faster", 0);
    builder.setNumeric("fill_density", 10, speedWeight, confidence * 0.8, "speed.fill_density_lighter", 0);
    builder.setCategorical("fill_pattern", "grid", confidence * 0.7, "speed.fill_pattern");
  }
}
