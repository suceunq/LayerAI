import type { IntentTag } from "@layerai/shared-types";

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

export function intentLabels(language: "fr" | "en"): Record<IntentTag, string> {
  return language === "en" ? INTENT_LABELS_EN : INTENT_LABELS_FR;
}
