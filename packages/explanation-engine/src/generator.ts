import type { ExplanationSet, GeneratedConfig, IntentResult, MeshAnalysisResult, ParameterExplanation } from "@layerai/shared-types";
import { introFor } from "./family-intros.js";
import { clauseFor } from "./parameter-clauses.js";
import { INTENT_LABELS_FR } from "./intent-labels.js";

function buildSummary(intent: IntentResult, analysis: MeshAnalysisResult): string {
  const detectedGoals = intent.weights
    .filter((w) => w.weight >= 0.15)
    .map((w) => INTENT_LABELS_FR[w.tag])
    .join(", ");

  const goalsClause = detectedGoals.length > 0 ? `Objectifs détectés : ${detectedGoals}.` : "Aucun objectif spécifique détecté - réglages standards appliqués.";

  const riskCount = analysis.riskFlags.length;
  const riskClause =
    riskCount > 0
      ? `${riskCount} point${riskCount > 1 ? "s" : ""} d'attention détecté${riskCount > 1 ? "s" : ""} sur le modèle (${analysis.riskFlags.map((f) => f.id).join(", ")}).`
      : "Aucun risque particulier détecté sur le modèle.";

  return `${goalsClause} ${riskClause}`;
}

export function generateExplanations(config: GeneratedConfig, intent: IntentResult, analysis: MeshAnalysisResult): ExplanationSet {
  const parameters: ParameterExplanation[] = Object.entries(config).map(([parameterKey, entry]) => ({
    parameterKey,
    valueLabel: String(entry.value),
    confidencePercent: Math.round(entry.confidence * 100),
    whyText: `${introFor(entry.ruleId)}${clauseFor(parameterKey, entry.value)}.`,
    ruleId: entry.ruleId,
  }));

  const overallConfidencePercent =
    parameters.length > 0 ? Math.round(parameters.reduce((sum, p) => sum + p.confidencePercent, 0) / parameters.length) : 0;

  return {
    parameters,
    overallConfidencePercent,
    summary: buildSummary(intent, analysis),
  };
}
