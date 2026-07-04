import { useEffect, useState } from "react";
import type { PublishHistoryEntry } from "../../../shared/ipc-types.js";

export function HistoryTab({ refreshKey }: { refreshKey: number }): React.JSX.Element {
  const [history, setHistory] = useState<PublishHistoryEntry[]>([]);

  useEffect(() => {
    void window.api.getHistory().then(setHistory);
  }, [refreshKey]);

  if (history.length === 0) {
    return <p className="text-sm text-text-muted">Aucune publication pour le moment.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {history.map((entry, i) => (
        <div key={`${entry.version}-${entry.publishedAt}-${i}`} className="rounded-lg border border-border-subtle bg-surface-1 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">
                {entry.title} <span className="text-text-muted">v{entry.version}</span>
              </p>
              <p className="text-xs text-text-muted">{new Date(entry.publishedAt).toLocaleString("fr-FR")}</p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                entry.status === "success" ? "bg-confidence-high/15 text-confidence-high" : "bg-confidence-low/15 text-confidence-low"
              }`}
            >
              {entry.status === "success" ? "✓ Publié" : "✗ Échec"}
            </span>
          </div>
          <p className="mt-2 text-xs text-text-secondary">Fichiers : {entry.fileNames.join(", ")}</p>
          {entry.releaseUrl && (
            <a href={entry.releaseUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-prusa-orange hover:text-prusa-orange-glow">
              Voir la release ↗
            </a>
          )}
          {entry.errorMessage && <p className="mt-1 text-xs text-confidence-low">{entry.errorMessage}</p>}
        </div>
      ))}
    </div>
  );
}
