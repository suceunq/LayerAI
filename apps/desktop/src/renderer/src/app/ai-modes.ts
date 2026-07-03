export interface AiMode {
  id: string;
  label: string;
  icon: string;
  intentText: string;
}

/**
 * Named "AI mode" presets from the product spec (Ultra Qualité/Rapide/Solide, Prototype,
 * Figurine, Pièce mécanique). Each maps to a canonical phrase already covered by the
 * intent-engine lexicon, so selecting a mode reuses the same NLP -> config pipeline as free text
 * rather than a separate code path.
 */
export const AI_MODES: AiMode[] = [
  { id: "ultra-quality", label: "Ultra Qualité", icon: "◆", intentText: "Je veux une finition parfaite, une qualité maximale." },
  { id: "ultra-fast", label: "Ultra Rapide", icon: "▲", intentText: "Je veux imprimer le plus vite possible." },
  { id: "ultra-strong", label: "Ultra Solide", icon: "■", intentText: "Je veux une pièce extrêmement solide et robuste." },
  { id: "prototype", label: "Prototype", icon: "○", intentText: "C'est un prototype, juste pour tester rapidement." },
  { id: "figurine", label: "Figurine", icon: "☺", intentText: "C'est une figurine, avec une belle finition." },
  { id: "mechanical", label: "Pièce mécanique", icon: "⚙", intentText: "C'est une pièce mécanique fonctionnelle, précise et solide." },
];
