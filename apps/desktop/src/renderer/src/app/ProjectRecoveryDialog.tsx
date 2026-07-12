import { useAppStore } from "../state/useAppStore.js";
import { Button } from "../components/ui/Button.js";
import { useTranslation } from "../i18n/useTranslation.js";
import { useModalAccessibility } from "../hooks/useModalAccessibility.js";

export function ProjectRecoveryDialog(): React.JSX.Element {
  const { t, language } = useTranslation();
  const snapshot = useAppStore((s) => s.recoverySnapshot);
  const loading = useAppStore((s) => s.recoveryLoading);
  const restore = useAppStore((s) => s.restoreProjectRecovery);
  const discard = useAppStore((s) => s.discardProjectRecovery);
  const dialogRef = useModalAccessibility(Boolean(snapshot), () => { if (!loading) void discard(); });
  if (!snapshot) return <></>;
  const date = new Intl.DateTimeFormat(language, { dateStyle: "medium", timeStyle: "short" }).format(new Date(snapshot.updatedAt));
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="recovery-title" tabIndex={-1} className="w-full max-w-md rounded-2xl border border-accent/40 bg-surface-1 p-6 shadow-2xl">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-xl text-accent" aria-hidden="true">↻</div>
        <h2 id="recovery-title" className="text-lg font-semibold text-text-primary">{t("recovery.title")}</h2>
        <p className="mt-2 text-sm text-text-secondary">{t("recovery.body")}</p>
        <div className="mt-4 rounded-lg border border-border-subtle bg-surface-2 p-3">
          <p className="truncate text-sm font-medium text-text-primary">{snapshot.fileName}</p>
          <p className="mt-1 text-xs text-text-muted">{t("recovery.savedAt", { date })}</p>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => void discard()} disabled={loading}>{t("recovery.discard")}</Button>
          <Button onClick={() => void restore()} disabled={loading}>{loading ? t("recovery.restoring") : t("recovery.restore")}</Button>
        </div>
      </div>
    </div>
  );
}
