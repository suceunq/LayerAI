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
    intentText: { fr: "Je veux une finition parfaite, une qualité maximale.", en: "I want a perfect finish, maximum quality.", de: "Ich möchte eine perfekte Oberfläche und höchste Qualität.", es: "Quiero un acabado perfecto y la máxima calidad.", it: "Voglio una finitura perfetta e la massima qualità." },
  },
  {
    id: "ultra-fast",
    labelKey: "aiModes.ultraFast",
    icon: "▲",
    intentText: { fr: "Je veux imprimer le plus vite possible.", en: "I want to print as fast as possible.", de: "Ich möchte so schnell wie möglich drucken.", es: "Quiero imprimir lo más rápido posible.", it: "Voglio stampare il più velocemente possibile." },
  },
  {
    id: "ultra-strong",
    labelKey: "aiModes.ultraStrong",
    icon: "■",
    intentText: { fr: "Je veux une pièce extrêmement solide et robuste.", en: "I want an extremely strong and robust part.", de: "Ich möchte ein besonders stabiles und robustes Teil.", es: "Quiero una pieza extremadamente resistente y robusta.", it: "Voglio una parte estremamente resistente e robusta." },
  },
  {
    id: "prototype",
    labelKey: "aiModes.prototype",
    icon: "○",
    intentText: { fr: "C'est un prototype, juste pour tester rapidement.", en: "It's a prototype, just to test quickly.", de: "Es ist ein Prototyp für einen schnellen Test.", es: "Es un prototipo para probar rápidamente.", it: "È un prototipo, solo per una prova rapida." },
  },
  {
    id: "figurine",
    labelKey: "aiModes.figurine",
    icon: "☺",
    intentText: { fr: "C'est une figurine, avec une belle finition.", en: "It's a figurine, with a nice finish.", de: "Es ist eine Figur mit einer schönen Oberfläche.", es: "Es una figura con un acabado bonito.", it: "È una statuetta con una bella finitura." },
  },
  {
    id: "mechanical",
    labelKey: "aiModes.mechanical",
    icon: "⚙",
    intentText: { fr: "C'est une pièce mécanique fonctionnelle, précise et solide.", en: "It's a functional mechanical part, precise and strong.", de: "Es ist ein funktionales, präzises und stabiles mechanisches Teil.", es: "Es una pieza mecánica funcional, precisa y resistente.", it: "È una parte meccanica funzionale, precisa e resistente." },
  },
];
