const STEPS = [
  {
    n: "01",
    title: "Importez",
    body: "Glissez votre modèle STL ou 3MF. LayerAI l'analyse et le pose automatiquement sur le plateau exact de votre imprimante.",
  },
  {
    n: "02",
    title: "Décrivez",
    body: "En quelques mots, dites ce que vous voulez : solide, rapide, précis, figurine détaillée... En français ou en anglais.",
  },
  {
    n: "03",
    title: "Vérifiez",
    body: "Chaque réglage généré est expliqué avec un score de confiance. Ajustez ce que vous voulez dans le panneau avancé.",
  },
  {
    n: "04",
    title: "Imprimez",
    body: "Exportez un .3mf pré-configuré et ouvrez-le en un clic dans PrusaSlicer ou Bambu Studio pour lancer le slicing.",
  },
];

export function HowItWorks(): React.JSX.Element {
  return (
    <section id="comment-ca-marche" className="bg-grid border-b border-border-subtle/70">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 max-w-2xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-accent">Comment ça marche</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">De l'idée à l'impression, en 4 étapes.</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.n} className="relative">
              {i < STEPS.length - 1 && (
                <div className="absolute right-[-1rem] top-6 hidden h-px w-8 bg-border-subtle md:block" />
              )}
              <span className="font-mono text-sm text-accent">{s.n}</span>
              <h3 className="mt-3 text-lg font-semibold text-text-primary">{s.title}</h3>
              <p className="mt-2 text-sm text-text-secondary">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
