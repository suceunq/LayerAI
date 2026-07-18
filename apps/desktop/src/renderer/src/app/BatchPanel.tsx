import { useAppStore, type BatchItem, type BatchItemStatus } from "../state/useAppStore.js";
import { Button } from "../components/ui/Button.js";
import { useTranslation } from "../i18n/useTranslation.js";
import { useModalAccessibility } from "../hooks/useModalAccessibility.js";

const STATUS_KEY: Record<BatchItemStatus, string> = {
  pending: "batch.status.pending",
  analyzing: "batch.status.analyzing",
  generating: "batch.status.generating",
  ready: "batch.status.ready",
  error: "batch.status.error",
};

const STATUS_COLOR: Record<BatchItemStatus, string> = {
  pending: "text-text-muted",
  analyzing: "text-accent",
  generating: "text-accent",
  ready: "text-confidence-high",
  error: "text-confidence-low",
};

function BatchRow({ item }: { item: BatchItem }): React.JSX.Element {
  const removeBatchItem = useAppStore((s) => s.removeBatchItem);
  const batchRunning = useAppStore((s) => s.batchRunning);
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface-1/50 px-3 py-2">
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="w-full truncate text-sm text-text-primary">{item.file.fileName}</span>
        {item.status === "error" && item.errorMessage && (
          <span className="truncate text-xs text-confidence-low">{item.errorMessage}</span>
        )}
      </div>
      <span className={`shrink-0 text-xs ${STATUS_COLOR[item.status]}`}>{t(STATUS_KEY[item.status])}</span>
      <button
        onClick={() => removeBatchItem(item.id)}
        disabled={batchRunning}
        title={t("batch.remove")}
        aria-label={`${t("batch.remove")} : ${item.file.fileName}`}
        className="shrink-0 text-text-muted hover:text-confidence-low disabled:opacity-40"
      >
        ✕
      </button>
    </div>
  );
}

export function BatchPanel(): React.JSX.Element | null {
  const batchPanelOpen = useAppStore((s) => s.batchPanelOpen);
  const toggleBatchPanel = useAppStore((s) => s.toggleBatchPanel);
  const batchQueue = useAppStore((s) => s.batchQueue);
  const batchRunning = useAppStore((s) => s.batchRunning);
  const addFilesToBatch = useAppStore((s) => s.addFilesToBatch);
  const clearBatch = useAppStore((s) => s.clearBatch);
  const runBatch = useAppStore((s) => s.runBatch);
  const exportBatchIni = useAppStore((s) => s.exportBatchIni);
  const { t } = useTranslation();
  const dialogRef = useModalAccessibility(batchPanelOpen, toggleBatchPanel);

  if (!batchPanelOpen) return null;

  const readyCount = batchQueue.filter((item) => item.status === "ready").length;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60" onClick={toggleBatchPanel}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-dialog-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-[520px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-0 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
          <div>
            <h2 id="batch-dialog-title" className="text-base font-semibold text-text-primary">{t("batch.title")}</h2>
            <p className="text-xs text-text-muted">{t("batch.subtitle")}</p>
          </div>
          <button onClick={toggleBatchPanel} aria-label={t("accessibility.closeDialog")} className="text-text-muted hover:text-text-primary">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto p-5">
          {batchQueue.length === 0 ? (
            <p className="text-sm text-text-muted">{t("batch.empty")}</p>
          ) : (
            batchQueue.map((item) => <BatchRow key={item.id} item={item} />)
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle px-5 py-3">
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void addFilesToBatch()} disabled={batchRunning}>
              {t("batch.addFiles")}
            </Button>
            {batchQueue.length > 0 && (
              <Button variant="ghost" onClick={clearBatch} disabled={batchRunning}>
                {t("batch.clear")}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {readyCount > 0 && (
              <Button variant="secondary" onClick={() => void exportBatchIni()} disabled={batchRunning}>
                {t("batch.exportIni")}
              </Button>
            )}
            <Button onClick={() => void runBatch()} disabled={batchRunning || batchQueue.length === 0}>
              {batchRunning ? t("batch.running") : t("batch.run")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
