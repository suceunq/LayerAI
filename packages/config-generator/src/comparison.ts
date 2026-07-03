import type { ComparisonMetrics, FilamentProfile, GeneratedConfig, MeshAnalysisResult } from "@layerai/shared-types";

function numeric(config: GeneratedConfig, key: string, fallback: number): number {
  const value = config[key]?.value;
  return typeof value === "number" ? value : fallback;
}

/**
 * Rough, clearly-labelled-as-estimated print metrics for one config, used only to produce a
 * *comparative* baseline-vs-AI view - not a slicer-grade prediction. No real toolpath planning
 * happens here; see docs on the v1 scope decision (no G-code generation in LayerAI).
 */
function estimateSingleConfig(config: GeneratedConfig, analysis: MeshAnalysisResult, filament: FilamentProfile) {
  const layerHeight = numeric(config, "layer_height", 0.2);
  const perimeters = numeric(config, "perimeters", 2);
  const fillDensityPercent = numeric(config, "fill_density", 15);
  const perimeterSpeed = numeric(config, "perimeter_speed", 45);
  const infillSpeed = numeric(config, "infill_speed", 80);
  const nozzleDiameterMm = numeric(config, "nozzle_diameter", 0.4);

  // Shell volume grows with wall count; a 0-perimeter/0-infill part would still need a minimal
  // shell, so the blend never drops to zero even at very low settings.
  const shellFraction = Math.min(0.6, 0.08 * perimeters);
  const infillFraction = (1 - shellFraction) * (fillDensityPercent / 100);
  const extrudedVolumeMm3 = analysis.volumeMm3 * (shellFraction + infillFraction);

  const averageSpeedMmS = (perimeterSpeed + infillSpeed) / 2;
  const flowMm3PerS = Math.max(0.5, nozzleDiameterMm * layerHeight * averageSpeedMmS);
  const layerCount = Math.max(1, Math.ceil(analysis.dimensionsMm.z / layerHeight));
  const printSeconds = extrudedVolumeMm3 / flowMm3PerS + layerCount * 2;

  const filamentG = (extrudedVolumeMm3 / 1000) * filament.densityGCm3;

  const strengthScore = Math.max(0, Math.min(1, (perimeters / 6) * 0.5 + (fillDensityPercent / 100) * 0.5));
  const qualityScore = Math.max(0, Math.min(1, 1 - layerHeight / 0.3));

  return { timeMin: printSeconds / 60, filamentG, strengthScore, qualityScore };
}

export function computeComparisonMetrics(
  baselineConfig: GeneratedConfig,
  aiConfig: GeneratedConfig,
  analysis: MeshAnalysisResult,
  filament: FilamentProfile
): ComparisonMetrics {
  const baseline = estimateSingleConfig(baselineConfig, analysis, filament);
  const ai = estimateSingleConfig(aiConfig, analysis, filament);

  const timeSavedPercent = baseline.timeMin > 0 ? ((baseline.timeMin - ai.timeMin) / baseline.timeMin) * 100 : 0;
  const filamentSavedPercent = baseline.filamentG > 0 ? ((baseline.filamentG - ai.filamentG) / baseline.filamentG) * 100 : 0;

  return {
    baselineEstimatedTimeMin: baseline.timeMin,
    aiEstimatedTimeMin: ai.timeMin,
    baselineFilamentG: baseline.filamentG,
    aiFilamentG: ai.filamentG,
    strengthScore: ai.strengthScore,
    qualityScore: ai.qualityScore,
    timeSavedPercent,
    filamentSavedPercent,
  };
}
