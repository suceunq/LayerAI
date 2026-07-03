import type { ConfigGenerationInput, RiskFlag } from "@layerai/shared-types";
import type { ConfigBuilder } from "../builder.js";

function findRisk(riskFlags: RiskFlag[], id: RiskFlag["id"]): RiskFlag | undefined {
  return riskFlags.find((f) => f.id === id);
}

/**
 * Reacts to mesh-analysis risk flags regardless of what the user typed - these are safety-net
 * adjustments (bed adhesion, wall thickness, support necessity), not stylistic preferences.
 */
export function applyAnalysisDrivenRules(builder: ConfigBuilder, input: ConfigGenerationInput): void {
  const { riskFlags } = input.analysis;

  const bedDetachment = findRisk(riskFlags, "bed_detachment");
  if (bedDetachment) {
    const brimWidth = bedDetachment.severity === "high" ? 6 : 4;
    builder.setNumeric("brim_width", brimWidth, 1, bedDetachment.confidence, "analysis.brim_bed_detachment", 0);
  }

  const warping = findRisk(riskFlags, "warping");
  if (warping) {
    const brimWidth = warping.severity === "high" ? 8 : 5;
    builder.setNumeric("brim_width", brimWidth, 1, warping.confidence, "analysis.brim_warping", 0);
  }

  const thinWall = findRisk(riskFlags, "fragile_thin_wall");
  if (thinWall) {
    builder.setNumeric("perimeters", 3, 0.6, thinWall.confidence, "analysis.perimeters_thin_wall", 0);
    builder.setNumeric("perimeter_speed", 30, 0.6, thinWall.confidence, "analysis.perimeter_speed_thin_wall", 0);
  }

  const overhang = findRisk(riskFlags, "unsupported_overhang");
  if (overhang) {
    builder.setCategorical("support_material", true, overhang.confidence, "analysis.supports_overhang");
  }

  const instability = findRisk(riskFlags, "instability");
  if (instability) {
    builder.setNumeric("brim_width", 5, 1, instability.confidence, "analysis.brim_instability", 0);
    builder.setNumeric("skirts", 2, 1, instability.confidence, "analysis.skirts_instability", 0);
  }
}
