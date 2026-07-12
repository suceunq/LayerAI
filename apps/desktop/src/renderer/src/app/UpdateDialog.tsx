import { useAppStore } from "../state/useAppStore.js";
import { useTranslation } from "../i18n/useTranslation.js";
import { Button } from "../components/ui/Button.js";
import { useModalAccessibility } from "../hooks/useModalAccessibility.js";

function formatBytesPerSecond(bytesPerSecond: number): string {
  const kb = bytesPerSecond / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} Ko/s`;
  return `${(kb / 1024).toFixed(1)} Mo/s`;
}

const RELEASE_NOTES_ALLOWED_TAGS = new Set(["H1", "H2", "H3", "P", "UL", "LI", "STRONG", "EM", "BR"]);

/**
 * electron-updater converts a GitHub release's Markdown body to HTML before exposing it as
 * `info.releaseNotes` - that HTML is only ever authored by whoever can publish a release to the
 * configured repo, but it's still untrusted content by the time it reaches this renderer (a leaked
 * publish token or a compromised release could inject an event-handler attribute that fires once
 * rendered live). Strip every attribute and unwrap any tag outside our own markdown converter's
 * output vocabulary (see apps/update-manager's markdown.ts) before handing it to
 * dangerouslySetInnerHTML.
 */
function sanitizeReleaseNotesHtml(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;

  const strip = (node: Element): void => {
    for (const child of Array.from(node.children)) {
      if (!RELEASE_NOTES_ALLOWED_TAGS.has(child.tagName)) {
        child.replaceWith(document.createTextNode(child.textContent ?? ""));
        continue;
      }
      for (const attr of Array.from(child.attributes)) child.removeAttribute(attr.name);
      strip(child);
    }
  };
  strip(container);

  return container.innerHTML;
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
  const dialogRef = useModalAccessibility(open, toggleOpen);

  if (!open) return null;

  const status = updateState?.status ?? "idle";
  const currentVersion = updateState?.currentVersion ?? "";

  const handleDownload = (): void => void window.api.downloadUpdate();
  const handleCancel = (): void => void window.api.cancelUpdateDownload();
  const handleInstall = (): void => void window.api.installUpdate();
  const handleCheckAgain = (): void => void window.api.checkForUpdates();

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60" onClick={toggleOpen}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="update-dialog-title" tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex w-[460px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-0 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
          <h2 id="update-dialog-title" className="text-base font-semibold text-text-primary">{t("update.title")}</h2>
          <button onClick={toggleOpen} aria-label={t("accessibility.closeDialog")} className="text-text-muted hover:text-text-primary">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3 p-5" aria-live="polite">
          <p className="text-xs text-text-muted">{t("update.currentVersion", { version: currentVersion })}</p>

          {status === "checking" && <p className="text-sm text-text-secondary">{t("update.checking")}</p>}

          {status === "not-available" && <p className="text-sm text-text-secondary">{t("update.upToDate")}</p>}

          {status === "dev-unavailable" && <p className="text-sm text-text-secondary">{t("update.devUnavailable")}</p>}

          {status === "error" && <p role="alert" className="text-sm text-confidence-low">{t("update.error", { message: updateState?.errorMessage ?? "" })}</p>}

          {(status === "available" || status === "downloading" || status === "downloaded") && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-accent">
                {t("update.available", { version: updateState?.availableVersion ?? "" })}
              </p>
              {updateState?.releaseNotes && (
                <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
                  <p className="mb-1 text-xs uppercase tracking-wide text-text-muted">{t("update.changelogTitle")}</p>
                  <div
                    className="release-notes max-h-40 overflow-y-auto text-xs text-text-secondary"
                    dangerouslySetInnerHTML={{ __html: sanitizeReleaseNotesHtml(updateState.releaseNotes) }}
                  />
                </div>
              )}
            </div>
          )}

          {status === "downloading" && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-text-secondary">{t("update.downloading")}</p>
              <div role="progressbar" aria-label={t("update.downloading")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(updateState?.progressPercent ?? 0)} className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-accent transition-all"
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
