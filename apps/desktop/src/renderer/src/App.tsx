import { useEffect, useState } from "react";

interface PrinterSummary {
  id: string;
  name: string;
}

export default function App(): React.JSX.Element {
  const [printers, setPrinters] = useState<PrinterSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.api
      .getPrinters()
      .then((result) => setPrinters(result as PrinterSummary[]))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-surface-0">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-prusa-orange text-xl font-bold text-surface-0">
          L
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-text-primary">
          Layer<span className="text-prusa-orange">AI</span>
        </h1>
      </div>
      <p className="max-w-md text-center text-sm text-text-secondary">
        Assistant IA de préparation d'impression 3D pour imprimantes Prusa.
      </p>
      <div className="rounded-full border border-border-subtle bg-surface-1 px-4 py-1.5 text-xs text-text-secondary">
        {error && <span className="text-confidence-low">Erreur IPC : {error}</span>}
        {!error && printers === null && <span>Chargement de la base imprimantes…</span>}
        {!error && printers !== null && (
          <span className="text-confidence-high">{printers.length} imprimantes Prusa chargées</span>
        )}
      </div>
    </div>
  );
}
