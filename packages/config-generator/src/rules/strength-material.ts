import type { ConfigGenerationInput } from "@layerai/shared-types";
import type { ConfigBuilder } from "../builder.js";
import { getIntentWeight, INTENT_APPLY_THRESHOLD } from "../intent-helpers.js";

export function applyStrengthAndMaterialRules(builder: ConfigBuilder, input: ConfigGenerationInput): void {
  const strengthWeight = getIntentWeight(input, "strength");
  const mechanicalWeight = getIntentWeight(input, "mechanicalPart");
  const flexibilityWeight = getIntentWeight(input, "flexibility");
  const heatWeight = getIntentWeight(input, "heatResistance");
  const savingWeight = getIntentWeight(input, "filamentSaving");
  const { filament } = input;

  if (strengthWeight >= INTENT_APPLY_THRESHOLD) {
    const confidence = 0.55 + strengthWeight * 0.4;
    builder.setNumeric("perimeters", 4, strengthWeight, confidence, "strength.perimeters", 0);
    builder.setNumeric("fill_density", 40, strengthWeight, confidence, "strength.fill_density", 0);
    builder.setCategorical("fill_pattern", "gyroid", confidence, "strength.fill_pattern");
    builder.setNumeric("top_solid_layers", 5, strengthWeight, confidence, "strength.top_solid_layers", 0);
    builder.setNumeric("bottom_solid_layers", 5, strengthWeight, confidence, "strength.bottom_solid_layers", 0);
    builder.setNumeric("perimeter_speed", 35, strengthWeight, confidence * 0.8, "strength.perimeter_speed_slower", 0);
  }

  if (mechanicalWeight >= INTENT_APPLY_THRESHOLD) {
    const confidence = 0.55 + mechanicalWeight * 0.4;
    builder.setNumeric("perimeters", 4, mechanicalWeight, confidence, "mechanical.perimeters", 0);
    builder.setNumeric("fill_density", 35, mechanicalWeight, confidence, "mechanical.fill_density", 0);
    builder.setCategorical("fill_pattern", "cubic", confidence, "mechanical.fill_pattern");
    builder.setNumeric("perimeter_speed", 35, mechanicalWeight, confidence, "mechanical.perimeter_speed_precise", 0);
    builder.setNumeric("brim_width", 4, mechanicalWeight, confidence * 0.7, "mechanical.brim_dimensional_stability", 0);
  }

  if (flexibilityWeight >= INTENT_APPLY_THRESHOLD) {
    const confidence = 0.5 + flexibilityWeight * 0.35;
    builder.setNumeric("perimeter_speed", 20, flexibilityWeight, confidence, "flexibility.perimeter_speed_slow", 0);
    builder.setNumeric("infill_speed", 25, flexibilityWeight, confidence, "flexibility.infill_speed_slow", 0);
    builder.setNumeric("default_acceleration", 800, flexibilityWeight, confidence, "flexibility.acceleration_low", 0);
    builder.setNumeric("perimeters", 2, flexibilityWeight, confidence * 0.7, "flexibility.perimeters_minimal", 0);
    builder.setNumeric("fill_density", 20, flexibilityWeight, confidence * 0.6, "flexibility.fill_density", 0);
  }

  if (heatWeight >= INTENT_APPLY_THRESHOLD) {
    const confidence = 0.5 + heatWeight * 0.35;
    builder.setNumeric("perimeters", 4, heatWeight, confidence, "heat_resistance.perimeters", 0);
    builder.setNumeric("fill_density", 35, heatWeight, confidence, "heat_resistance.fill_density", 0);
    builder.setNumeric("min_fan_speed", filament.isFlexible ? 0 : 10, heatWeight, confidence, "heat_resistance.fan_reduced", 0);
    builder.setNumeric("max_fan_speed", filament.isFlexible ? 10 : 20, heatWeight, confidence, "heat_resistance.fan_reduced_max", 0);
    builder.setNumeric(
      "temperature",
      Math.min(filament.defaultNozzleTempC + 5, filament.defaultNozzleTempC * 1.03),
      heatWeight,
      confidence * 0.7,
      "heat_resistance.temperature_layer_bonding",
      0
    );
  }

  if (savingWeight >= INTENT_APPLY_THRESHOLD) {
    const confidence = 0.55 + savingWeight * 0.35;
    builder.setNumeric("fill_density", 8, savingWeight, confidence, "filament_saving.fill_density_low", 0);
    builder.setNumeric("perimeters", 2, savingWeight, confidence, "filament_saving.perimeters_minimal", 0);
    builder.setCategorical("fill_pattern", "gyroid", confidence * 0.6, "filament_saving.fill_pattern_sparse");
    builder.setNumeric("brim_width", 0, savingWeight, confidence * 0.5, "filament_saving.brim_none", 0);
    builder.setNumeric("skirts", 0, savingWeight, confidence * 0.5, "filament_saving.skirt_none", 0);
  }
}
