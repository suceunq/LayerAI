import type { ExplanationLanguage } from "./language.js";

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

const FAMILY_INTROS_DE: Record<string, string> = {
  baseline: "Ausgewogene Standardeinstellung: ", filament: "Empfohlener Wert für dieses Filament: ",
  quality: "Sie wünschen eine hochwertige Oberfläche, daher ", speed: "Sie wünschen den schnellstmöglichen Druck, daher ",
  strength: "Sie wünschen ein sehr stabiles Teil, daher ", mechanical: "Dies ist ein mechanisches Teil; für Maßhaltigkeit ",
  flexibility: "Dieses Filament ist flexibel und benötigt einen schonenderen Druck, daher ",
  heat_resistance: "Dieses Teil muss Hitze widerstehen; für bessere Hitzebeständigkeit ",
  filament_saving: "Sie möchten Filament sparen, daher ", outdoor: "Dieses Teil wird im Freien verwendet; für höhere Haltbarkeit ",
  figurine: "Dies ist eine Figur; für mehr sichtbare Details ", silence: "Sie wünschen einen leisen Druck; zur Geräuschreduzierung ",
  minimal_supports: "Sie möchten die Stützen begrenzen, daher ", analysis: "Automatisch durch die 3D-Analyse des Modells erkannt: ",
  manual: "Manuell geändert: ", learning: "Anhand Ihrer Rückmeldungen zu früheren Drucken angepasst: ",
};

const FAMILY_INTROS_ES: Record<string, string> = {
  baseline: "Ajuste estándar equilibrado: ", filament: "Valor recomendado para este filamento: ",
  quality: "Ha solicitado un acabado de alta calidad, por lo que ", speed: "Ha solicitado la impresión más rápida posible, por lo que ",
  strength: "Ha solicitado una pieza muy resistente, por lo que ", mechanical: "Esta es una pieza mecánica; para mejorar la precisión dimensional ",
  flexibility: "Este filamento es flexible y requiere una impresión más suave, por lo que ",
  heat_resistance: "Esta pieza debe resistir el calor; para mejorar su resistencia térmica ",
  filament_saving: "Ha solicitado ahorrar filamento, por lo que ", outdoor: "Esta pieza se usará en exteriores; para aumentar su durabilidad ",
  figurine: "Esta es una figura; para obtener más detalle visual ", silence: "Ha solicitado una impresión silenciosa; para reducir el ruido ",
  minimal_supports: "Ha solicitado limitar los soportes, por lo que ", analysis: "Detectado automáticamente por el análisis 3D del modelo: ",
  manual: "Modificado manualmente: ", learning: "Ajustado según sus comentarios sobre impresiones anteriores: ",
};

const FAMILY_INTROS_IT: Record<string, string> = {
  baseline: "Impostazione standard bilanciata: ", filament: "Valore consigliato per questo filamento: ",
  quality: "Hai richiesto una finitura di alta qualità, quindi ", speed: "Hai richiesto la stampa più rapida possibile, quindi ",
  strength: "Hai richiesto una parte molto resistente, quindi ", mechanical: "Questa è una parte meccanica; per la precisione dimensionale ",
  flexibility: "Questo filamento è flessibile e richiede una stampa più delicata, quindi ",
  heat_resistance: "Questa parte deve resistere al calore; per migliorare la tenuta termica ",
  filament_saving: "Hai richiesto di risparmiare filamento, quindi ", outdoor: "Questa parte verrà usata all'esterno; per una maggiore durata ",
  figurine: "Questa è una statuetta; per ottenere più dettagli visivi ", silence: "Hai richiesto una stampa silenziosa; per ridurre il rumore ",
  minimal_supports: "Hai richiesto di limitare i supporti, quindi ", analysis: "Rilevato automaticamente dall'analisi 3D del modello: ",
  manual: "Modificato manualmente: ", learning: "Regolato in base ai tuoi riscontri sulle stampe precedenti: ",
};

const DEFAULT_INTRO_FR = "Ajusté automatiquement : ";
const DEFAULT_INTRO_EN = "Automatically adjusted: ";
const DEFAULT_INTROS: Record<ExplanationLanguage, string> = {
  fr: DEFAULT_INTRO_FR, en: DEFAULT_INTRO_EN, de: "Automatisch angepasst: ", es: "Ajustado automáticamente: ", it: "Regolato automaticamente: ",
};

const FAMILY_INTROS: Record<ExplanationLanguage, Record<string, string>> = {
  fr: FAMILY_INTROS_FR, en: FAMILY_INTROS_EN, de: FAMILY_INTROS_DE, es: FAMILY_INTROS_ES, it: FAMILY_INTROS_IT,
};

export function familyOf(ruleId: string): string {
  return ruleId.split(".")[0] ?? ruleId;
}

export function introFor(ruleId: string, language: ExplanationLanguage): string {
  return FAMILY_INTROS[language][familyOf(ruleId)] ?? DEFAULT_INTROS[language];
}
