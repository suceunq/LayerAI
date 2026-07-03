export interface ParameterExplanation {
  parameterKey: string;
  valueLabel: string;
  confidencePercent: number;
  whyText: string;
  ruleId: string;
}

export interface ExplanationSet {
  parameters: ParameterExplanation[];
  overallConfidencePercent: number;
  summary: string;
}
