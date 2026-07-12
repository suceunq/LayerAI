const QUESTIONS = [
  {
    q: "LayerAI fonctionne-t-il avec PrusaSlicer, Bambu Studio et Creality Print ?",
    a: "Oui. LayerAI génère un fichier .3mf pré-configuré qui s'ouvre directement dans PrusaSlicer, Bambu Studio ou Creality Print selon l'imprimante choisie — vous gardez votre slicer habituel pour l'étape finale.",
  },
  {
    q: "Est-ce vraiment gratuit ?",
    a: "Oui, l'application est complète et gratuite, sans palier payant ni fonctionnalité verrouillée derrière un abonnement.",
  },
  {
    q: "Mes modèles 3D sont-ils envoyés en ligne ?",
    a: "Non par défaut : l'analyse du modèle et la génération des réglages tournent entièrement en local sur votre machine. Certaines fonctionnalités optionnelles (résolution d'intention via IA cloud, diagnostic photo) peuvent utiliser un fournisseur IA externe, mais uniquement si vous configurez vous-même une clé API dans les paramètres.",
  },
  {
    q: "En quoi LayerAI diffère de PrusaSlicer ou Bambu Studio ?",
    a: "LayerAI n'est pas un slicer : il ne génère pas de G-code et n'embarque aucun moteur de découpe. C'est une couche de préparation en amont qui traduit votre besoin en réglages, avant de vous renvoyer vers votre slicer habituel pour l'impression.",
  },
  {
    q: "Sur quels systèmes LayerAI fonctionne-t-il ?",
    a: "LayerAI est disponible pour Windows. Une version macOS est en cours d'exploration.",
  },
];

export function FAQ(): React.JSX.Element {
  return (
    <section id="faq" className="border-b border-border-subtle/70">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-accent">FAQ</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Questions fréquentes</h2>
        </div>
        <div className="flex flex-col gap-3">
          {QUESTIONS.map((item) => (
            <details key={item.q} className="group rounded-xl border border-border-subtle bg-surface-1 p-5 open:border-accent/40">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-text-primary">
                {item.q}
                <span className="ml-4 text-text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-text-secondary">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
