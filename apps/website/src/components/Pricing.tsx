const POINTS = [
  "Application complète, aucun palier payant",
  "Aucune fonctionnalité verrouillée derrière un abonnement",
  "Mises à jour incluses, en continu",
];

export function Pricing(): React.JSX.Element {
  return (
    <section className="border-b border-border-subtle/70 bg-surface-1/40">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-accent/30 bg-surface-1 p-10 text-center shadow-xl">
          <p className="text-xs font-medium uppercase tracking-wide text-accent">Tarif</p>
          <p className="mt-3 text-5xl font-bold tracking-tight">0 €</p>
          <p className="mt-1 text-text-secondary">Pour toujours. Sans carte bancaire.</p>
          <ul className="mx-auto mt-6 flex max-w-sm flex-col gap-2 text-left text-sm text-text-secondary">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2">
                <span className="mt-1 text-accent">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
