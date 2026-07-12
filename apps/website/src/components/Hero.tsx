import { DOWNLOAD_EXE_URL } from "../config/release.js";

export function Hero(): React.JSX.Element {
  return (
    <section id="top" className="bg-grid bg-radial-glow relative overflow-hidden border-b border-border-subtle/70">
      <div className="mx-auto grid max-w-6xl gap-14 px-6 py-24 md:grid-cols-2 md:items-center md:py-32">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            Assistant IA d'impression 3D
          </div>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
            L'IA qui règle
            <br />
            <span className="text-accent">vos impressions 3D.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-text-secondary">
            Décrivez ce que vous voulez imprimer en langage naturel. LayerAI analyse votre modèle et génère les réglages
            optimaux, expliqués et notés en confiance — prêts à ouvrir dans PrusaSlicer, Bambu Studio ou Creality Print.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={DOWNLOAD_EXE_URL}
              className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-surface-0 transition-colors hover:bg-accent-glow"
            >
              Télécharger pour Windows
            </a>
          </div>
          <p className="mt-4 text-xs uppercase tracking-wide text-text-muted">
            100% gratuit · Windows · Compatible Prusa, Bambu Lab & Creality
          </p>
        </div>

        <div className="animate-float-slow relative mx-auto w-full max-w-md">
          <div className="absolute -inset-6 rounded-[2rem] bg-accent/15 blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl border border-border-subtle shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-border-subtle bg-surface-1 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-confidence-low" />
              <span className="h-2.5 w-2.5 rounded-full bg-confidence-medium" />
              <span className="h-2.5 w-2.5 rounded-full bg-confidence-high" />
            </div>
            <img src="/marketing/01-accroche.png" alt="Aperçu de LayerAI" className="block w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
