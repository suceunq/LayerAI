/**
 * A ruleId is always `${family}.${reason}` (see @layerai/config-generator's rules/*.ts). The
 * family prefix maps to a clause explaining *why* a rule fired; combined with a
 * parameter-specific clause (parameter-clauses.ts) this produces a full "why" sentence without
 * hand-authoring one string per ruleId.
 */
export const FAMILY_INTROS_FR: Record<string, string> = {
  baseline: "Réglage standard équilibré : ",
  filament: "Valeur recommandée pour ce filament : ",
  quality: "Vous avez demandé une finition de haute qualité, donc ",
  speed: "Vous avez demandé une impression la plus rapide possible, donc ",
  strength: "Vous avez demandé une pièce très solide, donc ",
  mechanical: "Cette pièce est une pièce mécanique, donc pour la précision dimensionnelle ",
  flexibility: "Ce filament est flexible et nécessite une impression plus douce, donc ",
  heat_resistance: "Cette pièce doit résister à la chaleur, donc pour améliorer la tenue thermique ",
  filament_saving: "Vous avez demandé à économiser du filament, donc ",
  outdoor: "Cette pièce sera utilisée à l'extérieur, donc pour plus de durabilité ",
  figurine: "C'est une figurine, donc pour plus de détails visuels ",
  silence: "Vous avez demandé une impression silencieuse, donc pour réduire le bruit ",
  minimal_supports: "Vous avez demandé à limiter les supports, donc ",
  analysis: "Détecté automatiquement par l'analyse 3D du modèle : ",
  manual: "Modifié manuellement : ",
  learning: "Ajusté d'après vos retours sur des impressions précédentes : ",
};

export const FAMILY_INTROS_EN: Record<string, string> = {
  baseline: "Balanced standard setting: ",
  filament: "Recommended value for this filament: ",
  quality: "You asked for a high-quality finish, so ",
  speed: "You asked for the fastest possible print, so ",
  strength: "You asked for a very strong part, so ",
  mechanical: "This part is a mechanical part, so for dimensional precision ",
  flexibility: "This filament is flexible and needs a gentler print, so ",
  heat_resistance: "This part needs to withstand heat, so to improve heat resistance ",
  filament_saving: "You asked to save filament, so ",
  outdoor: "This part will be used outdoors, so for more durability ",
  figurine: "This is a figurine, so for more visual detail ",
  silence: "You asked for a quiet print, so to reduce noise ",
  minimal_supports: "You asked to limit supports, so ",
  analysis: "Automatically detected by the 3D analysis of the model: ",
  manual: "Manually changed: ",
  learning: "Adjusted based on your feedback on previous prints: ",
};

const DEFAULT_INTRO_FR = "Ajusté automatiquement : ";
const DEFAULT_INTRO_EN = "Automatically adjusted: ";

export function familyOf(ruleId: string): string {
  return ruleId.split(".")[0] ?? ruleId;
}

export function introFor(ruleId: string, language: "fr" | "en"): string {
  const intros = language === "en" ? FAMILY_INTROS_EN : FAMILY_INTROS_FR;
  return intros[familyOf(ruleId)] ?? (language === "en" ? DEFAULT_INTRO_EN : DEFAULT_INTRO_FR);
}
