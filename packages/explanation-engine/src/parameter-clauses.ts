import type { ConfigPrimitive } from "@layerai/shared-types";
import type { ExplanationLanguage } from "./language.js";

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

const FILL_PATTERN_LABELS_DE: Record<string, string> = { grid: "Gitter", gyroid: "Gyroid", cubic: "kubisch", lines: "Linien", honeycomb: "Waben" };
const FILL_PATTERN_LABELS_ES: Record<string, string> = { grid: "cuadrícula", gyroid: "giroide", cubic: "cúbico", lines: "líneas", honeycomb: "panal" };
const FILL_PATTERN_LABELS_IT: Record<string, string> = { grid: "griglia", gyroid: "giroide", cubic: "cubico", lines: "linee", honeycomb: "nido d'ape" };
const SUPPORT_STYLE_LABELS_DE: Record<string, string> = { grid: "Gitter", snug: "angepasst", organic: "organisch" };
const SUPPORT_STYLE_LABELS_ES: Record<string, string> = { grid: "cuadrícula", snug: "ajustado", organic: "orgánico" };
const SUPPORT_STYLE_LABELS_IT: Record<string, string> = { grid: "griglia", snug: "aderente", organic: "organico" };

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

const PARAMETER_CLAUSES_DE: Record<string, ClauseFn> = {
  layer_height: (v) => `die Schichthöhe ist auf ${v} mm eingestellt`, perimeters: (v) => `die Anzahl der Wände ist auf ${v} eingestellt`,
  top_solid_layers: (v) => `${v} volle Schichten sind an der Oberseite vorgesehen`, bottom_solid_layers: (v) => `${v} volle Schichten sind an der Unterseite vorgesehen`,
  fill_density: (v) => `die Fülldichte ist auf ${v}% eingestellt`, fill_pattern: (v) => `das gewählte Füllmuster ist „${FILL_PATTERN_LABELS_DE[String(v)] ?? v}“`,
  perimeter_speed: (v) => `die Wandgeschwindigkeit ist auf ${v} mm/s eingestellt`, infill_speed: (v) => `die Füllgeschwindigkeit ist auf ${v} mm/s eingestellt`,
  travel_speed: (v) => `die Verfahrgeschwindigkeit ist auf ${v} mm/s eingestellt`, bridge_speed: (v) => `die Brückengeschwindigkeit ist auf ${v} mm/s eingestellt`,
  default_acceleration: (v) => `die Beschleunigung ist auf ${v} mm/s² eingestellt`, temperature: (v) => `die Düsentemperatur ist auf ${v} °C eingestellt`,
  first_layer_temperature: (v) => `die Düsentemperatur der ersten Schicht ist auf ${v} °C eingestellt`, bed_temperature: (v) => `die Betttemperatur ist auf ${v} °C eingestellt`,
  first_layer_bed_temperature: (v) => `die Betttemperatur der ersten Schicht ist auf ${v} °C eingestellt`, min_fan_speed: (v) => `die minimale Lüfterdrehzahl ist auf ${v}% eingestellt`,
  max_fan_speed: (v) => `die maximale Lüfterdrehzahl ist auf ${v}% eingestellt`, support_material: (v) => (v ? "Stützen sind aktiviert" : "es werden keine Stützen erzeugt"),
  support_material_buildplate_only: (v) => (v ? "Stützen beginnen nur auf der Bauplatte" : "Stützen können bei Bedarf überall platziert werden"),
  support_material_style: (v) => `der gewählte Stützstil ist „${SUPPORT_STYLE_LABELS_DE[String(v)] ?? v}“`,
  brim_width: (v) => (Number(v) > 0 ? `ein ${v} mm breiter Rand wird hinzugefügt` : "es wird kein Rand hinzugefügt"),
  skirts: (v) => `${v} Startkontur${Number(v) === 1 ? " ist" : "en sind"} vorgesehen`, raft_layers: (v) => (Number(v) > 0 ? `ein Raft mit ${v} Schichten wird hinzugefügt` : "es wird kein Raft hinzugefügt"),
};

const PARAMETER_CLAUSES_ES: Record<string, ClauseFn> = {
  layer_height: (v) => `la altura de capa está ajustada a ${v} mm`, perimeters: (v) => `el número de paredes está ajustado a ${v}`,
  top_solid_layers: (v) => `se han previsto ${v} capas sólidas en la parte superior`, bottom_solid_layers: (v) => `se han previsto ${v} capas sólidas en la parte inferior`,
  fill_density: (v) => `el relleno está ajustado al ${v}%`, fill_pattern: (v) => `el patrón de relleno elegido es «${FILL_PATTERN_LABELS_ES[String(v)] ?? v}»`,
  perimeter_speed: (v) => `la velocidad de las paredes está ajustada a ${v} mm/s`, infill_speed: (v) => `la velocidad de relleno está ajustada a ${v} mm/s`,
  travel_speed: (v) => `la velocidad de desplazamiento está ajustada a ${v} mm/s`, bridge_speed: (v) => `la velocidad de los puentes está ajustada a ${v} mm/s`,
  default_acceleration: (v) => `la aceleración está ajustada a ${v} mm/s²`, temperature: (v) => `la temperatura de la boquilla está ajustada a ${v} °C`,
  first_layer_temperature: (v) => `la temperatura de la boquilla de la primera capa está ajustada a ${v} °C`, bed_temperature: (v) => `la temperatura de la cama está ajustada a ${v} °C`,
  first_layer_bed_temperature: (v) => `la temperatura de la cama para la primera capa está ajustada a ${v} °C`, min_fan_speed: (v) => `la ventilación mínima está ajustada al ${v}%`,
  max_fan_speed: (v) => `la ventilación máxima está ajustada al ${v}%`, support_material: (v) => (v ? "los soportes están activados" : "no se generan soportes"),
  support_material_buildplate_only: (v) => (v ? "los soportes parten únicamente de la base" : "los soportes pueden colocarse en cualquier lugar si la geometría lo exige"),
  support_material_style: (v) => `el estilo de soporte elegido es «${SUPPORT_STYLE_LABELS_ES[String(v)] ?? v}»`,
  brim_width: (v) => (Number(v) > 0 ? `se añade un borde de ${v} mm` : "no se añade ningún borde"),
  skirts: (v) => `se ${Number(v) === 1 ? "ha" : "han"} previsto ${v} contorno(s) inicial(es)`, raft_layers: (v) => (Number(v) > 0 ? `se añade una balsa de ${v} capas` : "no se añade ninguna balsa"),
};

const PARAMETER_CLAUSES_IT: Record<string, ClauseFn> = {
  layer_height: (v) => `l'altezza dello strato è impostata a ${v} mm`, perimeters: (v) => `il numero di pareti è impostato a ${v}`,
  top_solid_layers: (v) => `sono previsti ${v} strati pieni nella parte superiore`, bottom_solid_layers: (v) => `sono previsti ${v} strati pieni nella parte inferiore`,
  fill_density: (v) => `il riempimento è impostato al ${v}%`, fill_pattern: (v) => `il motivo di riempimento scelto è «${FILL_PATTERN_LABELS_IT[String(v)] ?? v}»`,
  perimeter_speed: (v) => `la velocità delle pareti è impostata a ${v} mm/s`, infill_speed: (v) => `la velocità di riempimento è impostata a ${v} mm/s`,
  travel_speed: (v) => `la velocità di spostamento è impostata a ${v} mm/s`, bridge_speed: (v) => `la velocità dei ponti è impostata a ${v} mm/s`,
  default_acceleration: (v) => `l'accelerazione è impostata a ${v} mm/s²`, temperature: (v) => `la temperatura dell'ugello è impostata a ${v} °C`,
  first_layer_temperature: (v) => `la temperatura dell'ugello del primo strato è impostata a ${v} °C`, bed_temperature: (v) => `la temperatura del piano è impostata a ${v} °C`,
  first_layer_bed_temperature: (v) => `la temperatura del piano per il primo strato è impostata a ${v} °C`, min_fan_speed: (v) => `la ventilazione minima è impostata al ${v}%`,
  max_fan_speed: (v) => `la ventilazione massima è impostata al ${v}%`, support_material: (v) => (v ? "i supporti sono attivati" : "non viene generato alcun supporto"),
  support_material_buildplate_only: (v) => (v ? "i supporti partono solo dal piano" : "i supporti possono essere posizionati ovunque se richiesto dalla geometria"),
  support_material_style: (v) => `lo stile di supporto scelto è «${SUPPORT_STYLE_LABELS_IT[String(v)] ?? v}»`,
  brim_width: (v) => (Number(v) > 0 ? `viene aggiunto un bordo di ${v} mm` : "non viene aggiunto alcun bordo"),
  skirts: (v) => `${v} contorn${Number(v) === 1 ? "o iniziale è previsto" : "i iniziali sono previsti"}`, raft_layers: (v) => (Number(v) > 0 ? `viene aggiunto un raft di ${v} strati` : "non viene aggiunto alcun raft"),
};

const PARAMETER_CLAUSES: Record<ExplanationLanguage, Record<string, ClauseFn>> = {
  fr: PARAMETER_CLAUSES_FR, en: PARAMETER_CLAUSES_EN, de: PARAMETER_CLAUSES_DE, es: PARAMETER_CLAUSES_ES, it: PARAMETER_CLAUSES_IT,
};

const FALLBACK_CLAUSE: Record<ExplanationLanguage, (key: string, value: ConfigPrimitive) => string> = {
  fr: (key, value) => `${key} est réglé à ${value}`, en: (key, value) => `${key} is set to ${value}`,
  de: (key, value) => `${key} ist auf ${value} eingestellt`, es: (key, value) => `${key} está ajustado a ${value}`,
  it: (key, value) => `${key} è impostato a ${value}`,
};

export function clauseFor(parameterKey: string, value: ConfigPrimitive, language: ExplanationLanguage): string {
  const clause = PARAMETER_CLAUSES[language][parameterKey];
  if (clause) return clause(value);
  return FALLBACK_CLAUSE[language](parameterKey, value);
}
