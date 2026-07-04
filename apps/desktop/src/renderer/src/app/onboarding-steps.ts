export interface OnboardingStep {
  icon: string;
  title: string;
  description: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    icon: "L",
    title: "Bienvenue sur LayerAI",
    description:
      "LayerAI analyse votre modèle 3D et génère automatiquement les réglages d'impression pour PrusaSlicer ou Bambu Studio. Décrivez simplement ce que vous voulez, en français.",
  },
  {
    icon: "↑",
    title: "1. Importez votre modèle",
    description: "Glissez-déposez un fichier STL, OBJ ou 3MF, ou parcourez vos fichiers. Choisissez ensuite votre imprimante et votre filament.",
  },
  {
    icon: "✎",
    title: "2. Décrivez votre objectif",
    description:
      "« Je veux une pièce très solide », « le plus rapide possible », « c'est une figurine »… L'IA comprend le langage naturel et combine plusieurs intentions à la fois.",
  },
  {
    icon: "⚙",
    title: "3. Options avancées",
    description:
      "L'icône ⚙ en haut à droite ouvre les modes IA prédéfinis (Ultra Qualité, Ultra Solide…), vos profils personnalisés et tous les réglages bruts, éditables si besoin.",
  },
  {
    icon: "✓",
    title: "4. Réglages expliqués et export",
    description:
      "Chaque paramètre généré est expliqué avec un score de confiance. Exportez ensuite un projet .3mf prêt à ouvrir dans votre slicer, un rapport PDF, ou un profil .ini.",
  },
];
