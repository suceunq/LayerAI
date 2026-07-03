const FR_MARKERS = ["je ", "veux", "une piece", "tres", "pour", "avec", "resiste", "impression", "exterieur"];
const EN_MARKERS = [" the ", "i want", "very ", "print", "outdoor", "resistant", "should", "needs to"];

export function detectLanguage(normalizedText: string): "fr" | "en" | "unknown" {
  const frScore = FR_MARKERS.filter((m) => normalizedText.includes(m)).length;
  const enScore = EN_MARKERS.filter((m) => normalizedText.includes(m)).length;
  if (frScore === 0 && enScore === 0) return "unknown";
  return frScore >= enScore ? "fr" : "en";
}
