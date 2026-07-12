import type { ConfigPrimitive } from "@layerai/shared-types";

const FILL_PATTERN_LABELS_FR: Record<string, string> = {
  grid: "grille",
  gyroid: "gyroïde",
  cubic: "cubique",
  lines: "lignes",
  honeycomb: "nid d'abeille",
};

const FILL_PATTERN_LABELS_EN: Record<string, string> = {
  grid: "grid",
  gyroid: "gyroid",
  cubic: "cubic",
  lines: "lines",
  honeycomb: "honeycomb",
};

const SUPPORT_STYLE_LABELS_FR: Record<string, string> = {
  grid: "grille",
  snug: "ajusté",
  organic: "organique",
};

const SUPPORT_STYLE_LABELS_EN: Record<string, string> = {
  grid: "grid",
  snug: "snug",
  organic: "organic",
};

type ClauseFn = (value: ConfigPrimitive) => string;

const PARAMETER_CLAUSES_FR: Record<string, ClauseFn> = {
  layer_height: (v) => `la hauteur de couche est réglée à ${v} mm`,
  perimeters: (v) => `le nombre de parois est réglé à ${v}`,
  top_solid_layers: (v) => `${v} couches pleines sont prévues en haut de la pièce`,
  bottom_solid_layers: (v) => `${v} couches pleines sont prévues en bas de la pièce`,
  fill_density: (v) => `le remplissage est réglé à ${v}%`,
  fill_pattern: (v) => `le motif de remplissage choisi est "${FILL_PATTERN_LABELS_FR[String(v)] ?? v}"`,
  perimeter_speed: (v) => `la vitesse des parois est réglée à ${v} mm/s`,
  infill_speed: (v) => `la vitesse de remplissage est réglée à ${v} mm/s`,
  travel_speed: (v) => `la vitesse de déplacement est réglée à ${v} mm/s`,
  bridge_speed: (v) => `la vitesse des ponts est réglée à ${v} mm/s`,
  default_acceleration: (v) => `l'accélération est réglée à ${v} mm/s²`,
  temperature: (v) => `la température de buse est réglée à ${v} °C`,
  first_layer_temperature: (v) => `la température de buse de la première couche est réglée à ${v} °C`,
  bed_temperature: (v) => `la température du plateau est réglée à ${v} °C`,
  first_layer_bed_temperature: (v) => `la température du plateau pour la première couche est réglée à ${v} °C`,
  min_fan_speed: (v) => `la ventilation minimale est réglée à ${v}%`,
  max_fan_speed: (v) => `la ventilation maximale est réglée à ${v}%`,
  support_material: (v) => (v ? "des supports sont activés" : "aucun support n'est généré"),
  support_material_buildplate_only: (v) => (v ? "les supports partent uniquement du plateau" : "les supports peuvent être placés partout si la géométrie l’exige"),
  support_material_style: (v) => `le style de support choisi est "${SUPPORT_STYLE_LABELS_FR[String(v)] ?? v}"`,
  brim_width: (v) => (Number(v) > 0 ? `une bordure (brim) de ${v} mm est ajoutée` : "aucune bordure (brim) n'est ajoutée"),
  skirts: (v) => `${v} contour(s) de démarrage (skirt) ${Number(v) > 1 ? "sont prévus" : "est prévu"}`,
  raft_layers: (v) => (Number(v) > 0 ? `un radeau (raft) de ${v} couches est ajouté` : "aucun radeau (raft) n'est ajouté"),
};

const PARAMETER_CLAUSES_EN: Record<string, ClauseFn> = {
  layer_height: (v) => `layer height is set to ${v} mm`,
  perimeters: (v) => `the number of perimeters is set to ${v}`,
  top_solid_layers: (v) => `${v} solid layers are planned on top of the part`,
  bottom_solid_layers: (v) => `${v} solid layers are planned at the bottom of the part`,
  fill_density: (v) => `infill is set to ${v}%`,
  fill_pattern: (v) => `the infill pattern chosen is "${FILL_PATTERN_LABELS_EN[String(v)] ?? v}"`,
  perimeter_speed: (v) => `perimeter speed is set to ${v} mm/s`,
  infill_speed: (v) => `infill speed is set to ${v} mm/s`,
  travel_speed: (v) => `travel speed is set to ${v} mm/s`,
  bridge_speed: (v) => `bridge speed is set to ${v} mm/s`,
  default_acceleration: (v) => `acceleration is set to ${v} mm/s²`,
  temperature: (v) => `nozzle temperature is set to ${v} °C`,
  first_layer_temperature: (v) => `first-layer nozzle temperature is set to ${v} °C`,
  bed_temperature: (v) => `bed temperature is set to ${v} °C`,
  first_layer_bed_temperature: (v) => `first-layer bed temperature is set to ${v} °C`,
  min_fan_speed: (v) => `minimum fan speed is set to ${v}%`,
  max_fan_speed: (v) => `maximum fan speed is set to ${v}%`,
  support_material: (v) => (v ? "supports are enabled" : "no support is generated"),
  support_material_buildplate_only: (v) => (v ? "supports start from the build plate only" : "supports may be placed everywhere when required by the geometry"),
  support_material_style: (v) => `the support style chosen is "${SUPPORT_STYLE_LABELS_EN[String(v)] ?? v}"`,
  brim_width: (v) => (Number(v) > 0 ? `a ${v} mm brim is added` : "no brim is added"),
  skirts: (v) => `${v} skirt loop${Number(v) > 1 ? "s are" : " is"} planned`,
  raft_layers: (v) => (Number(v) > 0 ? `a raft of ${v} layers is added` : "no raft is added"),
};

export function clauseFor(parameterKey: string, value: ConfigPrimitive, language: "fr" | "en"): string {
  const clauses = language === "en" ? PARAMETER_CLAUSES_EN : PARAMETER_CLAUSES_FR;
  const clause = clauses[parameterKey];
  if (clause) return clause(value);
  return language === "en" ? `${parameterKey} is set to ${value}` : `${parameterKey} est réglé à ${value}`;
}
