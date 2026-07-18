import type { IntentTag } from "@layerai/shared-types";
import type { ExplanationLanguage } from "./language.js";

export const INTENT_LABELS_FR: Record<IntentTag, string> = {
  strength: "solidité",
  speed: "rapidité",
  quality: "qualité de finition",
  heatResistance: "résistance à la chaleur",
  filamentSaving: "économie de filament",
  outdoorUse: "usage extérieur",
  silence: "impression silencieuse",
  minimalSupports: "supports limités",
  figurine: "figurine",
  mechanicalPart: "pièce mécanique",
  prototype: "prototype",
  flexibility: "flexibilité",
};

export const INTENT_LABELS_EN: Record<IntentTag, string> = {
  strength: "strength",
  speed: "speed",
  quality: "finish quality",
  heatResistance: "heat resistance",
  filamentSaving: "filament saving",
  outdoorUse: "outdoor use",
  silence: "quiet printing",
  minimalSupports: "limited supports",
  figurine: "figurine",
  mechanicalPart: "mechanical part",
  prototype: "prototype",
  flexibility: "flexibility",
};

const INTENT_LABELS_DE: Record<IntentTag, string> = {
  strength: "Festigkeit", speed: "Geschwindigkeit", quality: "Oberflächenqualität", heatResistance: "Hitzebeständigkeit",
  filamentSaving: "Filamentersparnis", outdoorUse: "Außeneinsatz", silence: "leiser Druck", minimalSupports: "weniger Stützen",
  figurine: "Figur", mechanicalPart: "mechanisches Teil", prototype: "Prototyp", flexibility: "Flexibilität",
};

const INTENT_LABELS_ES: Record<IntentTag, string> = {
  strength: "resistencia", speed: "velocidad", quality: "calidad de acabado", heatResistance: "resistencia al calor",
  filamentSaving: "ahorro de filamento", outdoorUse: "uso exterior", silence: "impresión silenciosa", minimalSupports: "soportes limitados",
  figurine: "figura", mechanicalPart: "pieza mecánica", prototype: "prototipo", flexibility: "flexibilidad",
};

const INTENT_LABELS_IT: Record<IntentTag, string> = {
  strength: "resistenza", speed: "velocità", quality: "qualità della finitura", heatResistance: "resistenza al calore",
  filamentSaving: "risparmio di filamento", outdoorUse: "uso esterno", silence: "stampa silenziosa", minimalSupports: "supporti limitati",
  figurine: "statuetta", mechanicalPart: "parte meccanica", prototype: "prototipo", flexibility: "flessibilità",
};

const LABELS: Record<ExplanationLanguage, Record<IntentTag, string>> = {
  fr: INTENT_LABELS_FR, en: INTENT_LABELS_EN, de: INTENT_LABELS_DE, es: INTENT_LABELS_ES, it: INTENT_LABELS_IT,
};

export function intentLabels(language: ExplanationLanguage): Record<IntentTag, string> {
  return LABELS[language];
}
