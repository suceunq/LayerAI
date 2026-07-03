import type { ConfigPrimitive } from "@layerai/shared-types";

const FILL_PATTERN_LABELS: Record<string, string> = {
  grid: "grille",
  gyroid: "gyroïde",
  cubic: "cubique",
  lines: "lignes",
  honeycomb: "nid d'abeille",
};

const SUPPORT_STYLE_LABELS: Record<string, string> = {
  grid: "grille",
  snug: "ajusté",
  organic: "organique",
};

type ClauseFn = (value: ConfigPrimitive) => string;

const PARAMETER_CLAUSES: Record<string, ClauseFn> = {
  layer_height: (v) => `la hauteur de couche est réglée à ${v} mm`,
  perimeters: (v) => `le nombre de parois est réglé à ${v}`,
  top_solid_layers: (v) => `${v} couches pleines sont prévues en haut de la pièce`,
  bottom_solid_layers: (v) => `${v} couches pleines sont prévues en bas de la pièce`,
  fill_density: (v) => `le remplissage est réglé à ${v}%`,
  fill_pattern: (v) => `le motif de remplissage choisi est "${FILL_PATTERN_LABELS[String(v)] ?? v}"`,
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
  support_material_style: (v) => `le style de support choisi est "${SUPPORT_STYLE_LABELS[String(v)] ?? v}"`,
  brim_width: (v) => (Number(v) > 0 ? `une bordure (brim) de ${v} mm est ajoutée` : "aucune bordure (brim) n'est ajoutée"),
  skirts: (v) => `${v} contour(s) de démarrage (skirt) ${Number(v) > 1 ? "sont prévus" : "est prévu"}`,
  raft_layers: (v) => (Number(v) > 0 ? `un radeau (raft) de ${v} couches est ajouté` : "aucun radeau (raft) n'est ajouté"),
};

export function clauseFor(parameterKey: string, value: ConfigPrimitive): string {
  const clause = PARAMETER_CLAUSES[parameterKey];
  return clause ? clause(value) : `${parameterKey} est réglé à ${value}`;
}
