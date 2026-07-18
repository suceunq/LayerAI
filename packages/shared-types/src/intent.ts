export type IntentTag =
  | "strength"
  | "speed"
  | "quality"
  | "heatResistance"
  | "filamentSaving"
  | "outdoorUse"
  | "silence"
  | "minimalSupports"
  | "figurine"
  | "mechanicalPart"
  | "prototype"
  | "flexibility";

export interface MatchedPhrase {
  text: string;
  ruleId: string;
}

export interface IntentWeight {
  tag: IntentTag;
  /** 0..1 */
  weight: number;
  matchedPhrases: MatchedPhrase[];
}

export interface IntentResult {
  rawText: string;
  /** One entry per detected tag, sorted by descending weight. */
  weights: IntentWeight[];
  /** True if no rule matched anything in the input text. */
  unrecognized: boolean;
  languageDetected: "fr" | "en" | "de" | "es" | "it" | "unknown";
}
