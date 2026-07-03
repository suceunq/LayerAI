import type { IntentTag } from "@layerai/shared-types";

export interface LexiconRule {
  id: string;
  tags: IntentTag[];
  /** 0..1 base contribution when this rule matches. */
  weight: number;
  /** Matched against normalized (lowercase, accent-stripped) text. */
  patterns: string[];
}

/**
 * FR-first phrase list (this is the primary target audience), with common EN equivalents mixed
 * in per rule. Patterns are plain substrings matched against normalized text - deliberately
 * simple and inspectable so every match traces back to a readable rule id.
 */
export const LEXICON: LexiconRule[] = [
  {
    id: "strength.core",
    tags: ["strength"],
    weight: 0.85,
    patterns: [
      "solide",
      "resistant",
      "resistante",
      "robuste",
      "increvable",
      "casse pas",
      "ne casse pas",
      "va pas casser",
      "tenir le choc",
      "charge lourde",
      "porter du poids",
      "strong",
      "sturdy",
      "durable",
      "tough",
      "wont break",
      "load bearing",
    ],
  },
  {
    id: "speed.core",
    tags: ["speed"],
    weight: 0.8,
    patterns: [
      "rapide",
      "vite",
      "rapidement",
      "gagner du temps",
      "pas de temps a perdre",
      "urgent",
      "vitesse",
      "fast",
      "quick",
      "quickly",
      "asap",
      "speed",
    ],
  },
  {
    id: "quality.core",
    tags: ["quality"],
    weight: 0.8,
    patterns: [
      "qualite",
      "finition parfaite",
      "belle finition",
      "tres beau",
      "esthetique",
      "surface lisse",
      "sans defaut",
      "haute qualite",
      "precision",
      "quality",
      "perfect finish",
      "smooth surface",
      "high quality",
      "detailed",
      "precise",
    ],
  },
  {
    id: "compromise.speed_quality",
    tags: ["speed", "quality"],
    weight: 0.5,
    patterns: ["compromis", "equilibre entre", "balance between", "tradeoff", "un peu des deux"],
  },
  {
    id: "heat_resistance.core",
    tags: ["heatResistance"],
    weight: 0.85,
    patterns: [
      "resiste a la chaleur",
      "resister a la chaleur",
      "chaleur",
      "temperature elevee",
      "haute temperature",
      "pres d un moteur",
      "proche d une source de chaleur",
      "thermique",
      "heat resistant",
      "high temperature",
      "withstand heat",
      "thermal",
    ],
  },
  {
    id: "filament_saving.core",
    tags: ["filamentSaving"],
    weight: 0.8,
    patterns: [
      "economiser du filament",
      "economie de matiere",
      "le moins de matiere possible",
      "reduire le cout",
      "economique",
      "moins de filament",
      "save filament",
      "save material",
      "minimize material",
      "economical",
    ],
  },
  {
    id: "outdoor_use.core",
    tags: ["outdoorUse"],
    weight: 0.8,
    patterns: [
      "exterieur",
      "en exterieur",
      "dehors",
      "expose aux uv",
      "au soleil",
      "intemperies",
      "utilisation exterieure",
      "outdoor",
      "outside",
      "uv resistant",
      "weatherproof",
    ],
  },
  {
    id: "silence.core",
    tags: ["silence"],
    weight: 0.8,
    patterns: [
      "silencieux",
      "silencieuse",
      "sans bruit",
      "impression silencieuse",
      "discret",
      "silent",
      "quiet",
      "low noise",
    ],
  },
  {
    id: "minimal_supports.core",
    tags: ["minimalSupports"],
    weight: 0.85,
    patterns: [
      "limiter les supports",
      "sans support",
      "eviter les supports",
      "pas de support",
      "moins de supports",
      "no supports",
      "minimize supports",
      "avoid supports",
      "without supports",
    ],
  },
  {
    id: "figurine.core",
    tags: ["figurine"],
    weight: 0.85,
    patterns: ["figurine", "statuette", "miniature", "buste", "personnage", "figure de collection", "collectible", "statue"],
  },
  {
    id: "mechanical_part.core",
    tags: ["mechanicalPart"],
    weight: 0.85,
    patterns: [
      "piece mecanique",
      "engrenage",
      "pignon",
      "support technique",
      "piece fonctionnelle",
      "piece d usure",
      "mechanical part",
      "gear",
      "functional part",
      "engineering part",
    ],
  },
  {
    id: "prototype.core",
    tags: ["prototype"],
    weight: 0.75,
    patterns: ["prototype", "brouillon", "juste pour tester", "test rapide", "ebauche", "version test", "draft", "just testing", "quick test"],
  },
  {
    id: "flexibility.core",
    tags: ["flexibility"],
    weight: 0.85,
    patterns: ["flexible", "souple", "doit plier", "elastique", "pliable", "bendable", "elastic"],
  },
];

export const INTENSITY_BOOSTERS = ["tres ", "vraiment ", "extremement ", "super ", "hyper ", "very ", "really ", "extremely "];
export const INTENSITY_DAMPENERS = ["un peu ", "legerement ", "plutot ", "slightly ", "a bit "];
