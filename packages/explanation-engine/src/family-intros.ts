/**
 * A ruleId is always `${family}.${reason}` (see @layerai/config-generator's rules/*.ts). The
 * family prefix maps to a French clause explaining *why* a rule fired; combined with a
 * parameter-specific clause (parameter-clauses.ts) this produces a full "why" sentence without
 * hand-authoring one string per ruleId.
 */
export const FAMILY_INTROS: Record<string, string> = {
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
};

export function familyOf(ruleId: string): string {
  return ruleId.split(".")[0] ?? ruleId;
}

export function introFor(ruleId: string): string {
  return FAMILY_INTROS[familyOf(ruleId)] ?? "Ajusté automatiquement : ";
}
