import type { RiskFlagId } from "@layerai/shared-types";

export type ReportLanguage = "fr" | "en" | "de" | "es" | "it";

interface ReportText {
  locale: string;
  documentTitle: string;
  summary: string;
  estimates: string;
  estimatedTime: string;
  weight: string;
  materialCost: string;
  batch: (quantity: number, duration: string, weight: string, cost: string) => string;
  modelAnalysis: string;
  dimensions: string;
  volume: string;
  triangles: string;
  confidence: string;
  issues: string;
  settings: string;
  recommendations: string;
  noIssues: string;
  severity: { high: string; medium: string; low: string };
  riskLabels: Record<RiskFlagId, string>;
  riskDetails: Record<RiskFlagId, (source: string) => string>;
  footer: string;
}

const risks = {
  fr: { bed_detachment: "Adhérence au plateau limitée", warping: "Risque de déformation", ringing: "Vibrations possibles", fragile_thin_wall: "Parois fines et fragiles", unsupported_overhang: "Surplombs non supportés", instability: "Pièce potentiellement instable" },
  en: { bed_detachment: "Limited bed adhesion", warping: "Warping risk", ringing: "Possible vibrations", fragile_thin_wall: "Thin, fragile walls", unsupported_overhang: "Unsupported overhangs", instability: "Potentially unstable part" },
  de: { bed_detachment: "Begrenzte Betthaftung", warping: "Verzugsrisiko", ringing: "Mögliche Vibrationen", fragile_thin_wall: "Dünne, fragile Wände", unsupported_overhang: "Nicht unterstützte Überhänge", instability: "Möglicherweise instabiles Teil" },
  es: { bed_detachment: "Adherencia limitada a la cama", warping: "Riesgo de deformación", ringing: "Posibles vibraciones", fragile_thin_wall: "Paredes finas y frágiles", unsupported_overhang: "Voladizos sin soporte", instability: "Pieza potencialmente inestable" },
  it: { bed_detachment: "Adesione al piano limitata", warping: "Rischio di deformazione", ringing: "Possibili vibrazioni", fragile_thin_wall: "Pareti sottili e fragili", unsupported_overhang: "Sporgenze non supportate", instability: "Parte potenzialmente instabile" },
} satisfies Record<ReportLanguage, Record<RiskFlagId, string>>;

const numberIn = (source: string): string => source.match(/[\d.]+/)?.[0] ?? "—";
const riskDetails = {
  fr: { bed_detachment: () => "La surface de contact avec le plateau est petite par rapport à la hauteur de la pièce.", warping: () => "La grande surface de première couche peut favoriser le décollement des coins.", ringing: () => "Une géométrie haute et fine peut produire des vibrations visibles à grande vitesse.", fragile_thin_wall: (s) => `Des parois fines ont été détectées, jusqu’à ${numberIn(s)} mm.`, unsupported_overhang: (s) => `${numberIn(s)} % de la surface présente un surplomb marqué ; des supports sont probablement nécessaires.`, instability: () => "Le centre de masse est proche du bord de l’empreinte au sol, avec un risque de bascule." },
  en: { bed_detachment: () => "The contact area with the bed is small relative to the part height.", warping: () => "The large first-layer area may cause corners to lift.", ringing: () => "Tall, thin geometry may produce visible vibration artifacts at high speed.", fragile_thin_wall: (s) => `Thin walls were detected, down to ${numberIn(s)} mm.`, unsupported_overhang: (s) => `${numberIn(s)}% of the surface has a significant overhang; supports are likely required.`, instability: () => "The center of mass is close to the footprint edge, creating a tipping risk." },
  de: { bed_detachment: () => "Die Kontaktfläche zum Druckbett ist im Verhältnis zur Bauteilhöhe klein.", warping: () => "Die große Fläche der ersten Schicht kann zum Ablösen der Ecken führen.", ringing: () => "Eine hohe, schmale Geometrie kann bei hoher Geschwindigkeit sichtbare Schwingungen verursachen.", fragile_thin_wall: (s) => `Es wurden dünne Wände bis ${numberIn(s)} mm erkannt.`, unsupported_overhang: (s) => `${numberIn(s)} % der Oberfläche weist einen starken Überhang auf; Stützen sind wahrscheinlich erforderlich.`, instability: () => "Der Schwerpunkt liegt nahe am Rand der Standfläche; das Bauteil könnte kippen." },
  es: { bed_detachment: () => "La superficie de contacto con la cama es pequeña en relación con la altura de la pieza.", warping: () => "La gran superficie de la primera capa puede hacer que se levanten las esquinas.", ringing: () => "Una geometría alta y estrecha puede producir vibraciones visibles a alta velocidad.", fragile_thin_wall: (s) => `Se detectaron paredes finas de hasta ${numberIn(s)} mm.`, unsupported_overhang: (s) => `El ${numberIn(s)} % de la superficie presenta un voladizo importante; probablemente se necesiten soportes.`, instability: () => "El centro de masa está cerca del borde de la base, con riesgo de vuelco." },
  it: { bed_detachment: () => "La superficie di contatto con il piano è ridotta rispetto all’altezza della parte.", warping: () => "L’ampia superficie del primo strato può causare il sollevamento degli angoli.", ringing: () => "Una geometria alta e sottile può produrre vibrazioni visibili ad alta velocità.", fragile_thin_wall: (s) => `Sono state rilevate pareti sottili fino a ${numberIn(s)} mm.`, unsupported_overhang: (s) => `Il ${numberIn(s)}% della superficie presenta una sporgenza marcata; probabilmente sono necessari supporti.`, instability: () => "Il centro di massa è vicino al bordo dell’impronta, con rischio di ribaltamento." },
} satisfies Record<ReportLanguage, Record<RiskFlagId, (source: string) => string>>;

export const REPORT_TEXT: Record<ReportLanguage, ReportText> = {
  fr: { locale: "fr-FR", documentTitle: "Rapport LayerAI", summary: "Résumé", estimates: "Estimations", estimatedTime: "Temps estimé", weight: "Poids / consommation", materialCost: "Coût matière estimé", batch: (q, d, w, c) => `Lot de ${q} exemplaires : ≈${d} · ${w} g${c} au total.`, modelAnalysis: "Analyse du modèle", dimensions: "Dimensions", volume: "Volume", triangles: "Triangles", confidence: "Confiance de l’analyse", issues: "Problèmes détectés et corrections proposées", settings: "Réglages appliqués", recommendations: "Recommandations", noIssues: "Aucun point d’attention particulier détecté sur ce modèle.", severity: { high: "élevé", medium: "modéré", low: "faible" }, riskLabels: risks.fr, riskDetails: riskDetails.fr, footer: "Rapport généré automatiquement par LayerAI. Les temps, poids et coûts sont des estimations indicatives et ne remplacent pas le calcul réel effectué par le logiciel de tranchage." },
  en: { locale: "en-US", documentTitle: "LayerAI report", summary: "Summary", estimates: "Estimates", estimatedTime: "Estimated time", weight: "Weight / consumption", materialCost: "Estimated material cost", batch: (q, d, w, c) => `Batch of ${q}: ≈${d} · ${w} g${c} total.`, modelAnalysis: "Model analysis", dimensions: "Dimensions", volume: "Volume", triangles: "Triangles", confidence: "Analysis confidence", issues: "Detected issues and suggested corrections", settings: "Applied settings", recommendations: "Recommendations", noIssues: "No particular point of attention was detected for this model.", severity: { high: "high", medium: "moderate", low: "low" }, riskLabels: risks.en, riskDetails: riskDetails.en, footer: "Report generated automatically by LayerAI. Time, weight and cost figures are indicative estimates and do not replace the actual calculation performed by the slicer." },
  de: { locale: "de-DE", documentTitle: "LayerAI-Bericht", summary: "Zusammenfassung", estimates: "Schätzungen", estimatedTime: "Geschätzte Zeit", weight: "Gewicht / Verbrauch", materialCost: "Geschätzte Materialkosten", batch: (q, d, w, c) => `Los mit ${q} Exemplaren: ≈${d} · ${w} g${c} insgesamt.`, modelAnalysis: "Modellanalyse", dimensions: "Abmessungen", volume: "Volumen", triangles: "Dreiecke", confidence: "Analysekonfidenz", issues: "Erkannte Probleme und vorgeschlagene Korrekturen", settings: "Angewandte Einstellungen", recommendations: "Empfehlungen", noIssues: "Für dieses Modell wurden keine besonderen Problempunkte erkannt.", severity: { high: "hoch", medium: "mittel", low: "niedrig" }, riskLabels: risks.de, riskDetails: riskDetails.de, footer: "Bericht automatisch von LayerAI erstellt. Zeit-, Gewichts- und Kostenangaben sind Richtwerte und ersetzen nicht die tatsächliche Berechnung der Slicer-Software." },
  es: { locale: "es-ES", documentTitle: "Informe de LayerAI", summary: "Resumen", estimates: "Estimaciones", estimatedTime: "Tiempo estimado", weight: "Peso / consumo", materialCost: "Coste estimado del material", batch: (q, d, w, c) => `Lote de ${q} unidades: ≈${d} · ${w} g${c} en total.`, modelAnalysis: "Análisis del modelo", dimensions: "Dimensiones", volume: "Volumen", triangles: "Triángulos", confidence: "Confianza del análisis", issues: "Problemas detectados y correcciones propuestas", settings: "Ajustes aplicados", recommendations: "Recomendaciones", noIssues: "No se detectó ningún punto de atención particular en este modelo.", severity: { high: "alto", medium: "moderado", low: "bajo" }, riskLabels: risks.es, riskDetails: riskDetails.es, footer: "Informe generado automáticamente por LayerAI. Los tiempos, pesos y costes son estimaciones orientativas y no sustituyen el cálculo real del laminador." },
  it: { locale: "it-IT", documentTitle: "Rapporto LayerAI", summary: "Riepilogo", estimates: "Stime", estimatedTime: "Tempo stimato", weight: "Peso / consumo", materialCost: "Costo stimato del materiale", batch: (q, d, w, c) => `Lotto di ${q} esemplari: ≈${d} · ${w} g${c} in totale.`, modelAnalysis: "Analisi del modello", dimensions: "Dimensioni", volume: "Volume", triangles: "Triangoli", confidence: "Affidabilità dell’analisi", issues: "Problemi rilevati e correzioni proposte", settings: "Impostazioni applicate", recommendations: "Raccomandazioni", noIssues: "Non è stato rilevato alcun punto di attenzione particolare per questo modello.", severity: { high: "alto", medium: "moderato", low: "basso" }, riskLabels: risks.it, riskDetails: riskDetails.it, footer: "Rapporto generato automaticamente da LayerAI. Tempi, pesi e costi sono stime indicative e non sostituiscono il calcolo effettivo del software di slicing." },
};
