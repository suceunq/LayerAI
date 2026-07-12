const MAKERS = [
  { name: "Keup's 3D", url: "https://www.tiktok.com/@keups3d?is_from_webapp=1&sender_device=pc" },
  { name: "lolo.lc3d", url: "https://www.tiktok.com/@lolo.lc3d?is_from_webapp=1&sender_device=pc" },
];

export function Thanks(): React.JSX.Element {
  return (
    <section className="border-b border-border-subtle/70">
      <div className="mx-auto max-w-6xl px-6 py-20 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-accent">Merci</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Conçu avec les retours de la communauté maker</h2>
        <p className="mx-auto mt-3 max-w-xl text-text-secondary">
          Merci aux makers qui testent LayerAI et remontent leurs conseils pour l'améliorer.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          {MAKERS.map((m) => (
            <a
              key={m.name}
              href={m.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border-subtle px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-accent hover:text-accent"
            >
              {m.name} — TikTok ↗
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
