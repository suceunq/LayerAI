import type { ConfigGenerationInput, GeneratedConfig } from "@layerai/shared-types";
import { ConfigBuilder } from "./builder.js";
import { applyBaselineDefaults } from "./rules/baseline.js";
import { applyQualityAndSpeedRules } from "./rules/quality-speed.js";
import { applyStrengthAndMaterialRules } from "./rules/strength-material.js";
import { applyUsageContextRules } from "./rules/usage-context.js";
import { applyAnalysisDrivenRules } from "./rules/analysis-driven.js";
import { clampConfig } from "./clamp.js";

export function generateConfig(input: ConfigGenerationInput): GeneratedConfig {
  const builder = new ConfigBuilder();

  applyBaselineDefaults(builder, input);
  applyQualityAndSpeedRules(builder, input);
  applyStrengthAndMaterialRules(builder, input);
  applyUsageContextRules(builder, input);
  applyAnalysisDrivenRules(builder, input);

  return clampConfig(builder.build(), input.printer.id);
}
