import { useState } from "react";

const FEEDBACK_EMAIL = "bob62138@gmail.com";

const TYPES = ["Message", "Idée d'évolution", "Bug à signaler"];

export function Comments(): React.JSX.Element {
  const [type, setType] = useState(TYPES[0]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const canSend = message.trim() !== "";

  const buildBody = (): string =>
    `${name.trim() ? `De : ${name.trim()}\n\n` : ""}${message}`;

  const handleSend = (): void => {
    if (!canSend) return;
    const subject = `LayerAI — ${type}`;
    const href = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildBody())}`;
    window.location.href = href;
    setStatus("Votre client email va s'ouvrir avec le message pré-rempli.");
  };

  const handleCopy = (): void => {
    if (!canSend) return;
    void navigator.clipboard.writeText(`${type}\n${buildBody()}`);
    setStatus("Message copié — collez-le dans un email à " + FEEDBACK_EMAIL + ".");
  };

  return (
    <section id="commentaires" className="border-b border-border-subtle/70">
      <div className="mx-auto max-w-2xl px-6 py-24">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-accent">Commentaires</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Une idée, un bug, un message ?</h2>
          <p className="mt-4 text-text-secondary">
            Dites-nous ce que vous en pensez, proposez une évolution ou signalez un problème — on lit tout.
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface-1 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-text-muted">Type</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
              >
                {TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-text-muted">Votre nom (optionnel)</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Anonyme"
                className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-text-muted">Votre message</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="Écrivez votre message, votre idée ou décrivez le bug rencontré..."
              className="resize-none rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleCopy}
              disabled={!canSend}
              className="text-xs text-text-muted transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Copier le message
            </button>
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-surface-0 transition-colors hover:bg-accent-glow disabled:cursor-not-allowed disabled:opacity-40"
            >
              Envoyer
            </button>
          </div>
          {status && <p className="text-xs text-text-muted">{status}</p>}
        </div>
      </div>
    </section>
  );
}
