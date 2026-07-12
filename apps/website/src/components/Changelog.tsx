import { useState } from "react";
import { CHANGELOG } from "../generated/changelog.js";
import { renderMarkdown } from "../lib/markdown.js";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
}

export function Changelog(): React.JSX.Element | null {
  const [expanded, setExpanded] = useState<string | null>(CHANGELOG[0]?.version ?? null);

  if (CHANGELOG.length === 0) return null;

  return (
    <section id="changelog" className="border-b border-border-subtle/70">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-accent">Journal des versions</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ce qui a changé</h2>
        </div>
        <div className="flex flex-col gap-3">
          {CHANGELOG.map((entry) => {
            const isOpen = expanded === entry.version;
            return (
              <div key={entry.version} className="rounded-xl border border-border-subtle bg-surface-1 p-5">
                <button
                  onClick={() => setExpanded(isOpen ? null : entry.version)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <span className="font-medium text-text-primary">
                    {entry.title} <span className="text-text-muted">v{entry.version}</span>
                  </span>
                  <span className="ml-4 flex items-center gap-3 text-xs text-text-muted">
                    {formatDate(entry.publishedAt)}
                    <span className={`transition-transform ${isOpen ? "rotate-45" : ""}`}>+</span>
                  </span>
                </button>
                {isOpen && entry.notes && (
                  <div
                    className="prose-changelog mt-3 text-sm text-text-secondary"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(entry.notes) }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
