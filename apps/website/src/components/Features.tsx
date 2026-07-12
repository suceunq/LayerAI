interface Feature {
  title: string;
  body: string;
  icon: React.JSX.Element;
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  className: "h-5 w-5",
};

const FEATURES: Feature[] = [
  {
    title: "Langage naturel",
    body: "Décrivez votre besoin (« pièce solide », « impression rapide », « figurine détaillée »...) — LayerAI traduit ça en réglages concrets, chacun expliqué avec un score de confiance.",
    icon: (
      <svg {...iconProps}>
        <path d="M4 6h16M4 12h10M4 18h7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Surplombs & supports",
    body: "Détection automatique des zones à risque, avec un aperçu visuel des supports — visibles et personnalisables zone par zone, pas une boîte noire.",
    icon: (
      <svg {...iconProps}>
        <path d="M4 18h16M6 18V9l6-4 6 4v9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Plusieurs plateaux",
    body: "Imprimez plusieurs exemplaires : LayerAI arrange automatiquement les pièces sans qu'elles se touchent, et répartit sur plusieurs plateaux si besoin — à vous de l'activer.",
    icon: (
      <svg {...iconProps}>
        <rect x="4" y="4" width="7" height="7" rx="1" />
        <rect x="13" y="4" width="7" height="7" rx="1" />
        <rect x="4" y="13" width="7" height="7" rx="1" />
        <rect x="13" y="13" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    title: "Diagnostic photo IA",
    body: "Prenez en photo une impression ratée : LayerAI identifie le défaut (stringing, warping, sous-extrusion...) et propose des corrections de réglage en un clic.",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <circle cx="12" cy="13.5" r="3.5" />
        <path d="M8 7l1.5-2h5L16 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Export direct",
    body: "Un fichier .3mf déjà configuré, prêt à ouvrir en un clic dans PrusaSlicer, Bambu Studio ou Creality Print. Pas de nouveau logiciel à apprendre.",
    icon: (
      <svg {...iconProps}>
        <path d="M12 3v12m0 0l-4-4m4 4l4-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Rapport & facturation",
    body: "Rapport PDF détaillé de chaque impression, et génération de factures légales françaises (SIRET, TVA, mentions obligatoires) — totalement indépendante du rapport.",
    icon: (
      <svg {...iconProps}>
        <path d="M7 3h8l4 4v14H7z" strokeLinejoin="round" />
        <path d="M10 12h6M10 16h6M10 8h3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Coût & temps réels",
    body: "Estimation du coût (matière + électricité) et du temps d'impression affichés clairement — en heures/minutes, pas en abstraction.",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Apprentissage continu",
    body: "Notez vos résultats d'impression : LayerAI ajuste ses futures suggestions en conséquence, et se met à jour automatiquement.",
    icon: (
      <svg {...iconProps}>
        <path d="M4 12a8 8 0 1114.93 4M4 12v5h5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function Features(): React.JSX.Element {
  return (
    <section id="fonctionnalites" className="border-b border-border-subtle/70">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 max-w-2xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-accent">Fonctionnalités</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Tout ce qu'il faut, rien de superflu.</h2>
          <p className="mt-4 text-text-secondary">
            Une seule application complète — aucune fonctionnalité payante cachée derrière un abonnement.
          </p>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border-subtle bg-border-subtle sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group relative flex flex-col gap-3 bg-surface-1 p-6 transition-all duration-300 hover:z-10 hover:-translate-y-1 hover:bg-surface-2 hover:shadow-xl hover:shadow-accent/10"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent/40 text-accent transition-all duration-300 group-hover:scale-110 group-hover:border-accent group-hover:bg-accent/10">
                {f.icon}
              </div>
              <h3 className="font-semibold text-text-primary">{f.title}</h3>
              <p className="text-sm text-text-secondary">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
