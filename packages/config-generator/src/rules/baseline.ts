import type { ConfigGenerationInput } from "@layerai/shared-types";
import { getLayerHeightRange } from "@layerai/prusa-profile-db";
import type { ConfigBuilder } from "../builder.js";

const BASELINE_WEIGHT = 1.0;
const BASELINE_CONFIDENCE = 0.6;

/**
 * Seeds every parameter with a sane "0.20mm standard" default before any intent- or
 * analysis-driven rule pulls it toward a more specific value. Every field the config-generator
 * ever emits must have a baseline entry here, since ConfigBuilder only outputs keys that were
 * touched by at least one rule.
 */
export function applyBaselineDefaults(builder: ConfigBuilder, input: ConfigGenerationInput): void {
  const { printer, filament } = input;
  const layerRange = getLayerHeightRange(printer.id);
  const baselineLayerHeight = layerRange
    ? Math.min(Math.max(0.2, layerRange.minLayerHeightMm), layerRange.maxLayerHeightMm)
    : 0.2;

  builder.setNumeric("layer_height", baselineLayerHeight, BASELINE_WEIGHT, BASELINE_CONFIDENCE, "baseline.layer_height", 2);
  builder.setNumeric("perimeters", 2, BASELINE_WEIGHT, BASELINE_CONFIDENCE, "baseline.perimeters", 0);
  builder.setNumeric("top_solid_layers", 4, BASELINE_WEIGHT, BASELINE_CONFIDENCE, "baseline.top_solid_layers", 0);
  builder.setNumeric("bottom_solid_layers", 4, BASELINE_WEIGHT, BASELINE_CONFIDENCE, "baseline.bottom_solid_layers", 0);
  builder.setNumeric("fill_density", input.analysis.recommendedInfillPercent, BASELINE_WEIGHT, 0.65, "baseline.fill_density", 0);
  builder.setCategorical("fill_pattern", "grid", BASELINE_CONFIDENCE, "baseline.fill_pattern");

  builder.setNumeric("perimeter_speed", 45, BASELINE_WEIGHT, BASELINE_CONFIDENCE, "baseline.perimeter_speed", 0);
  builder.setNumeric("infill_speed", 80, BASELINE_WEIGHT, BASELINE_CONFIDENCE, "baseline.infill_speed", 0);
  builder.setNumeric("travel_speed", 150, BASELINE_WEIGHT, BASELINE_CONFIDENCE, "baseline.travel_speed", 0);
  builder.setNumeric("bridge_speed", 25, BASELINE_WEIGHT, BASELINE_CONFIDENCE, "baseline.bridge_speed", 0);
  builder.setNumeric("default_acceleration", 2000, BASELINE_WEIGHT, BASELINE_CONFIDENCE, "baseline.default_acceleration", 0);

  builder.setNumeric("temperature", filament.defaultNozzleTempC, BASELINE_WEIGHT, 0.9, "filament.temperature", 0);
  builder.setNumeric(
    "first_layer_temperature",
    filament.defaultFirstLayerNozzleTempC,
    BASELINE_WEIGHT,
    0.9,
    "filament.first_layer_temperature",
    0
  );
  builder.setNumeric("bed_temperature", filament.defaultBedTempC, BASELINE_WEIGHT, 0.9, "filament.bed_temperature", 0);
  builder.setNumeric(
    "first_layer_bed_temperature",
    filament.defaultFirstLayerBedTempC,
    BASELINE_WEIGHT,
    0.9,
    "filament.first_layer_bed_temperature",
    0
  );
  builder.setNumeric("min_fan_speed", filament.isFlexible ? 0 : 30, BASELINE_WEIGHT, 0.55, "baseline.min_fan_speed", 0);
  builder.setNumeric("max_fan_speed", filament.isFlexible ? 10 : 60, BASELINE_WEIGHT, 0.55, "baseline.max_fan_speed", 0);

  builder.setCategorical("support_material", input.analysis.supportsRecommended, 0.6, "analysis.supports_baseline");
  // Safest low-waste default: supports may rise from the build plate, but are not attached to the model itself.
  // A high overhang risk after auto-orientation overrides this in analysis-driven rules below.
  builder.setCategorical("support_material_buildplate_only", true, BASELINE_CONFIDENCE, "baseline.supports_buildplate_only");
  builder.setCategorical("support_material_style", "grid", BASELINE_CONFIDENCE, "baseline.support_style");
  builder.setNumeric("brim_width", 0, BASELINE_WEIGHT, BASELINE_CONFIDENCE, "baseline.brim_width", 0);
  builder.setNumeric("skirts", 1, BASELINE_WEIGHT, BASELINE_CONFIDENCE, "baseline.skirts", 0);
  builder.setNumeric("raft_layers", 0, BASELINE_WEIGHT, BASELINE_CONFIDENCE, "baseline.raft_layers", 0);
}
