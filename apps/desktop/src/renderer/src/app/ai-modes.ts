import type { Language } from "../i18n/translations.js";

export interface AiMode {
  id: string;
  labelKey: string;
  icon: string;
  intentText: Record<Language, string>;
}

/**
 * Named "AI mode" presets from the product spec (Ultra Qualité/Rapide/Solide, Prototype,
 * Figurine, Pièce mécanique). Each maps to a canonical phrase already covered by the
 * intent-engine lexicon (which understands FR and EN), so selecting a mode reuses the same
 * NLP -> config pipeline as free text rather than a separate code path.
 */
export const AI_MODES: AiMode[] = [
  {
    id: "ultra-quality",
    labelKey: "aiModes.ultraQuality",
    icon: "◆",
    intentText: { fr: "Je veux une finition parfaite, une qualité maximale.", en: "I want a perfect finish, maximum quality." },
  },
  {
    id: "ultra-fast",
    labelKey: "aiModes.ultraFast",
    icon: "▲",
    intentText: { fr: "Je veux imprimer le plus vite possible.", en: "I want to print as fast as possible." },
  },
  {
    id: "ultra-strong",
    labelKey: "aiModes.ultraStrong",
    icon: "■",
    intentText: { fr: "Je veux une pièce extrêmement solide et robuste.", en: "I want an extremely strong and robust part." },
  },
  {
    id: "prototype",
    labelKey: "aiModes.prototype",
    icon: "○",
    intentText: { fr: "C'est un prototype, juste pour tester rapidement.", en: "It's a prototype, just to test quickly." },
  },
  {
    id: "figurine",
    labelKey: "aiModes.figurine",
    icon: "☺",
    intentText: { fr: "C'est une figurine, avec une belle finition.", en: "It's a figurine, with a nice finish." },
  },
  {
    id: "mechanical",
    labelKey: "aiModes.mechanical",
    icon: "⚙",
    intentText: { fr: "C'est une pièce mécanique fonctionnelle, précise et solide.", en: "It's a functional mechanical part, precise and strong." },
  },
];
