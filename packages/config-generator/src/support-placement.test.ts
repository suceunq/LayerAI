import test from "node:test";
import assert from "node:assert/strict";
import type { ConfigGenerationInput, RiskSeverity } from "@layerai/shared-types";
import { ConfigBuilder } from "./builder.js";
import { applyBaselineDefaults } from "./rules/baseline.js";
import { applyAnalysisDrivenRules } from "./rules/analysis-driven.js";

function input(overhangSeverity?: RiskSeverity): ConfigGenerationInput {
  return {
    printer: { id: "test", name: "Test", vendor: "Prusa Research", family: "test", technology: "FFF", bedShape: [{ x: 0, y: 0 }, { x: 200, y: 0 }, { x: 200, y: 200 }], maxPrintHeightMm: 200, nozzleDiametersMm: [0.4], defaultNozzleDiameterMm: 0.4, hasMmu: false, isInputShaper: false },
    filament: { id: "PLA", name: "PLA", materialType: "PLA", densityGCm3: 1.24, diameterMm: 1.75, defaultNozzleTempC: 210, defaultFirstLayerNozzleTempC: 215, defaultBedTempC: 60, defaultFirstLayerBedTempC: 65, isFlexible: false, isAbrasive: false },
    intent: { rawText: "", weights: [], unrecognized: true, languageDetected: "fr" },
    analysis: {
      boundingBoxMm: { min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 10, z: 10 } }, dimensionsMm: { x: 10, y: 10, z: 10 }, volumeMm3: 1000,
      estimatedWeightG: null, footprintAreaMm2: 100, centerOfMassMm: { x: 5, y: 5, z: 5 }, centerOfMassOffsetFromFootprintCenterMm: 0,
      isManifold: true, triangleCount: 12, complexityScore: 0.1, overhangFaces: [], overhangAreaMm2: 0, bridgeRegions: [], thinWallRegions: [],
      riskFlags: overhangSeverity ? [{ id: "unsupported_overhang", severity: overhangSeverity, confidence: 0.7, description: "test" }] : [],
      supportsRecommended: Boolean(overhangSeverity), recommendedInfillPercent: 15, orientationCandidates: [], bestOrientationIndex: 0, analysisConfidence: 1,
    },
  };
}

function generated(overhangSeverity?: RiskSeverity) {
  const builder = new ConfigBuilder();
  const data = input(overhangSeverity);
  applyBaselineDefaults(builder, data);
  applyAnalysisDrivenRules(builder, data);
  return builder.build();
}

test("utilise le plateau uniquement par défaut", () => {
  assert.equal(generated().support_material_buildplate_only?.value, true);
});

test("conserve le plateau uniquement pour un risque de surplomb modéré", () => {
  assert.equal(generated("medium").support_material_buildplate_only?.value, true);
});

test("donne priorité à l’analyse et autorise les supports partout si le risque reste élevé après orientation", () => {
  const config = generated("high");
  assert.equal(config.support_material?.value, true);
  assert.equal(config.support_material_buildplate_only?.value, false);
  assert.equal(config.support_material_buildplate_only?.ruleId, "analysis.supports_everywhere_orientation");
});
