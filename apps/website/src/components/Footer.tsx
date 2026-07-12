const FEEDBACK_MAILTO = "mailto:bob62138@gmail.com?subject=" + encodeURIComponent("LayerAI - Suggestion / Correction");

export function Footer(): React.JSX.Element {
  return (
    <footer className="bg-surface-0">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-xs font-bold text-surface-0">L</div>
              <span className="text-sm font-semibold">
                Layer<span className="text-accent">AI</span>
              </span>
            </div>
            <p className="mt-3 max-w-xs text-xs text-text-muted">
              Assistant IA de préparation d'impression 3D pour imprimantes Prusa et Bambu Lab.
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-text-secondary">
            <a href="https://github.com/suceunq/LayerAI" target="_blank" rel="noreferrer" className="hover:text-text-primary">
              GitHub ↗
            </a>
            <a href={FEEDBACK_MAILTO} className="hover:text-text-primary">
              Suggestion / Correction
            </a>
          </div>
        </div>
        <div className="mt-10 border-t border-border-subtle pt-6 text-xs text-text-muted">
          <p>© {new Date().getFullYear()} LayerAI. LayerAI est un logiciel indépendant, non affilié à Prusa Research ou Bambu Lab.</p>
          <p className="mt-1">
            Les profils imprimante/filament intégrés reprennent des données issues de PrusaSlicer et Bambu Studio
            (AGPL-3.0-or-later) — LayerAI n'embarque ni ne redistribue leurs moteurs de découpe.
          </p>
        </div>
      </div>
    </footer>
  );
}
