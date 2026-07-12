import { DOWNLOAD_EXE_URL } from "../config/release.js";

export function Download(): React.JSX.Element {
  return (
    <section className="bg-grid bg-radial-glow border-b border-border-subtle/70">
      <div className="mx-auto max-w-3xl px-6 py-28 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Prêt à laisser l'IA régler
          <br />
          <span className="text-accent">votre prochaine impression ?</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-text-secondary">
          Téléchargez LayerAI pour Windows et importez votre premier modèle en moins d'une minute.
        </p>
        <a
          href={DOWNLOAD_EXE_URL}
          className="mt-8 inline-block rounded-full bg-accent px-8 py-4 text-base font-semibold text-surface-0 transition-colors hover:bg-accent-glow"
        >
          Télécharger LayerAI
        </a>
      </div>
    </section>
  );
}
