const FR_MARKERS = ["je ", "veux", "une piece", "tres", "pour", "avec", "resiste", "impression", "exterieur"];
const EN_MARKERS = [" the ", "i want", "very ", "print", "outdoor", "resistant", "should", "needs to"];
const DE_MARKERS = ["ich ", "mochte", "ein teil", "sehr", "drucken", "schnell", "stabil", "aussen"];
const ES_MARKERS = ["quiero", "una pieza", "muy", "imprimir", "rapido", "resistente", "exterior", "con "];
const IT_MARKERS = ["voglio", "una parte", "molto", "stampare", "veloce", "resistente", "esterno", "con "];

export function detectLanguage(normalizedText: string): "fr" | "en" | "de" | "es" | "it" | "unknown" {
  const scores = {
    fr: FR_MARKERS.filter((marker) => normalizedText.includes(marker)).length,
    en: EN_MARKERS.filter((marker) => normalizedText.includes(marker)).length,
    de: DE_MARKERS.filter((marker) => normalizedText.includes(marker)).length,
    es: ES_MARKERS.filter((marker) => normalizedText.includes(marker)).length,
    it: IT_MARKERS.filter((marker) => normalizedText.includes(marker)).length,
  };
  const best = (Object.entries(scores) as ["fr" | "en" | "de" | "es" | "it", number][]).sort((a, b) => b[1] - a[1])[0];
  return !best || best[1] === 0 ? "unknown" : best[0];
}
