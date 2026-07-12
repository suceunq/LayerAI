const SLIDES = [
  { src: "/marketing/02-comprendre.png", caption: "Décrivez, l'IA règle" },
  { src: "/marketing/03-surplombs.png", caption: "Surplombs repérés" },
  { src: "/marketing/04-export.png", caption: "Prêt à imprimer" },
  { src: "/marketing/05-telechargement.png", caption: "Téléchargez LayerAI" },
];

export function Showcase(): React.JSX.Element {
  return (
    <section id="apercu" className="border-b border-border-subtle/70">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 max-w-2xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-accent">Aperçu</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Un outil pro, pensé pour être compris.</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SLIDES.map((s) => (
            <figure key={s.src} className="overflow-hidden rounded-xl border border-border-subtle bg-surface-1">
              <img src={s.src} alt={s.caption} className="block w-full" loading="lazy" />
              <figcaption className="border-t border-border-subtle px-3 py-2 text-xs text-text-muted">{s.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
