import type { GeneratedConfig } from "@layerai/shared-types";
import { getLayerHeightRange } from "@layerai/prusa-profile-db";

interface Range {
  min: number;
  max: number;
}

const FIXED_RANGES: Record<string, Range> = {
  perimeters: { min: 1, max: 6 },
  top_solid_layers: { min: 2, max: 8 },
  bottom_solid_layers: { min: 2, max: 8 },
  fill_density: { min: 0, max: 100 },
  perimeter_speed: { min: 10, max: 150 },
  infill_speed: { min: 10, max: 250 },
  travel_speed: { min: 50, max: 300 },
  bridge_speed: { min: 10, max: 60 },
  default_acceleration: { min: 500, max: 8000 },
  min_fan_speed: { min: 0, max: 100 },
  max_fan_speed: { min: 0, max: 100 },
  brim_width: { min: 0, max: 15 },
  skirts: { min: 0, max: 5 },
  raft_layers: { min: 0, max: 6 },
  temperature: { min: 150, max: 300 },
  bed_temperature: { min: 0, max: 120 },
};

/** Clamps every numeric value the generator produced to physically/mechanically sane bounds. */
export function clampConfig(config: GeneratedConfig, printerId: string): GeneratedConfig {
  const layerRange = getLayerHeightRange(printerId);
  const clamped: GeneratedConfig = { ...config };

  const layerHeight = clamped["layer_height"];
  if (layerHeight && typeof layerHeight.value === "number" && layerRange) {
    layerHeight.value = Math.min(Math.max(layerHeight.value, layerRange.minLayerHeightMm), layerRange.maxLayerHeightMm);
  }

  for (const [key, range] of Object.entries(FIXED_RANGES)) {
    const entry = clamped[key];
    if (entry && typeof entry.value === "number") {
      entry.value = Math.min(Math.max(entry.value, range.min), range.max);
    }
  }

  return clamped;
}
