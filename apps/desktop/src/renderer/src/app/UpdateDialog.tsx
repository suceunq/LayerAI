import { useAppStore } from "../state/useAppStore.js";
import { useTranslation } from "../i18n/useTranslation.js";
import { Button } from "../components/ui/Button.js";

function formatBytesPerSecond(bytesPerSecond: number): string {
  const kb = bytesPerSecond / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} Ko/s`;
  return `${(kb / 1024).toFixed(1)} Mo/s`;
}

function formatEta(bytesRemaining: number, bytesPerSecond: number): string {
  if (bytesPerSecond <= 0) return "…";
  const seconds = Math.round(bytesRemaining / bytesPerSecond);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.round(seconds / 60)} min`;
}

export function UpdateDialog(): React.JSX.Element | null {
  const open = useAppStore((s) => s.updateDialogOpen);
  const toggleOpen = useAppStore((s) => s.toggleUpdateDialog);
  const updateState = useAppStore((s) => s.updateState);
  const postponeAvailableUpdate = useAppStore((s) => s.postponeAvailableUpdate);
  const { t } = useTranslation();

  if (!open) return null;

  const status = updateState?.status ?? "idle";
  const currentVersion = updateState?.currentVersion ?? "";

  const handleDownload = (): void => void window.api.downloadUpdate();
  const handleCancel = (): void => void window.api.cancelUpdateDownload();
  const handleInstall = (): void => void window.api.installUpdate();
  const handleCheckAgain = (): void => void window.api.checkForUpdates();

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60" onClick={toggleOpen}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-[460px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-0 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
          <h2 className="text-base font-semibold text-text-primary">{t("update.title")}</h2>
          <button onClick={toggleOpen} className="text-text-muted hover:text-text-primary">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3 p-5">
          <p className="text-xs text-text-muted">{t("update.currentVersion", { version: currentVersion })}</p>

          {status === "checking" && <p className="text-sm text-text-secondary">{t("update.checking")}</p>}

          {status === "not-available" && <p className="text-sm text-text-secondary">{t("update.upToDate")}</p>}

          {status === "dev-unavailable" && <p className="text-sm text-text-secondary">{t("update.devUnavailable")}</p>}

          {status === "error" && <p className="text-sm text-confidence-low">{t("update.error", { message: updateState?.errorMessage ?? "" })}</p>}

          {(status === "available" || status === "downloading" || status === "downloaded") && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-prusa-orange">
                {t("update.available", { version: updateState?.availableVersion ?? "" })}
              </p>
              {updateState?.releaseNotes && (
                <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
                  <p className="mb-1 text-xs uppercase tracking-wide text-text-muted">{t("update.changelogTitle")}</p>
                  <div className="max-h-40 overflow-y-auto whitespace-pre-wrap text-xs text-text-secondary">{updateState.releaseNotes}</div>
                </div>
              )}
            </div>
          )}

          {status === "downloading" && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-text-secondary">{t("update.downloading")}</p>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-prusa-orange transition-all"
                  style={{ width: `${Math.round(updateState?.progressPercent ?? 0)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-text-muted">
                <span>{Math.round(updateState?.progressPercent ?? 0)}%</span>
                {typeof updateState?.bytesPerSecond === "number" && <span>{formatBytesPerSecond(updateState.bytesPerSecond)}</span>}
                {typeof updateState?.bytesPerSecond === "number" &&
                  typeof updateState?.totalBytes === "number" &&
                  typeof updateState?.transferredBytes === "number" && (
                    <span>
                      {t("update.eta", {
                        eta: formatEta(updateState.totalBytes - updateState.transferredBytes, updateState.bytesPerSecond),
                      })}
                    </span>
                  )}
              </div>
            </div>
          )}

          {status === "downloaded" && <p className="text-sm text-confidence-high">{t("update.downloaded")}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-3">
          {status === "available" && (
            <>
              <Button variant="secondary" onClick={postponeAvailableUpdate}>
                {t("update.postpone")}
              </Button>
              <Button onClick={handleDownload}>{t("update.download")}</Button>
            </>
          )}
          {status === "downloading" && (
            <Button variant="secondary" onClick={handleCancel}>
              {t("update.cancelDownload")}
            </Button>
          )}
          {status === "downloaded" && <Button onClick={handleInstall}>{t("update.installRestart")}</Button>}
          {(status === "not-available" || status === "error") && (
            <Button variant="secondary" onClick={handleCheckAgain}>
              {t("update.checkAgain")}
            </Button>
          )}
          <Button variant="ghost" onClick={toggleOpen}>
            {t("update.close")}
          </Button>
        </div>
      </div>
    </div>
  );
}
