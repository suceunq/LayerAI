import type { ExplanationSet, GeneratedConfig, IntentResult, MeshAnalysisResult, ParameterExplanation } from "@layerai/shared-types";
import { introFor } from "./family-intros.js";
import { clauseFor } from "./parameter-clauses.js";
import { intentLabels } from "./intent-labels.js";

const SUMMARY_TEXT = {
  fr: {
    goals: (goals: string) => `Objectifs détectés : ${goals}.`,
    noGoals: "Aucun objectif spécifique détecté - réglages standards appliqués.",
    risks: (count: number, ids: string) => `${count} point${count > 1 ? "s" : ""} d'attention détecté${count > 1 ? "s" : ""} sur le modèle (${ids}).`,
    noRisks: "Aucun risque particulier détecté sur le modèle.",
  },
  en: {
    goals: (goals: string) => `Detected goals: ${goals}.`,
    noGoals: "No specific goal detected - standard settings applied.",
    risks: (count: number, ids: string) => `${count} point${count > 1 ? "s" : ""} of attention detected on the model (${ids}).`,
    noRisks: "No particular risk detected on the model.",
  },
};

function buildSummary(intent: IntentResult, analysis: MeshAnalysisResult, language: "fr" | "en"): string {
  const text = SUMMARY_TEXT[language];
  const labels = intentLabels(language);
  const detectedGoals = intent.weights
    .filter((w) => w.weight >= 0.15)
    .map((w) => labels[w.tag])
    .join(", ");

  const goalsClause = detectedGoals.length > 0 ? text.goals(detectedGoals) : text.noGoals;

  const riskCount = analysis.riskFlags.length;
  const riskClause = riskCount > 0 ? text.risks(riskCount, analysis.riskFlags.map((f) => f.id).join(", ")) : text.noRisks;

  return `${goalsClause} ${riskClause}`;
}

export function generateExplanations(
  config: GeneratedConfig,
  intent: IntentResult,
  analysis: MeshAnalysisResult,
  language: "fr" | "en" = "fr"
): ExplanationSet {
  const parameters: ParameterExplanation[] = Object.entries(config).map(([parameterKey, entry]) => ({
    parameterKey,
    valueLabel: String(entry.value),
    confidencePercent: Math.round(entry.confidence * 100),
    whyText: `${introFor(entry.ruleId, language)}${clauseFor(parameterKey, entry.value, language)}.`,
    ruleId: entry.ruleId,
  }));

  const overallConfidencePercent =
    parameters.length > 0 ? Math.round(parameters.reduce((sum, p) => sum + p.confidencePercent, 0) / parameters.length) : 0;

  return {
    parameters,
    overallConfidencePercent,
    summary: buildSummary(intent, analysis, language),
  };
}
