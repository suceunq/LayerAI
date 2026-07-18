import { useAppStore } from "../state/useAppStore.js";
import { useTranslation } from "../i18n/useTranslation.js";
import { useModalAccessibility } from "../hooks/useModalAccessibility.js";

export function WelcomeDialog(): React.JSX.Element | null {
  const open = useAppStore((state) => state.welcomeDialogOpen);
  const donationConfigured = useAppStore((state) => state.donationConfigured);
  const donationError = useAppStore((state) => state.donationError);
  const closeLater = useAppStore((state) => state.closeWelcomeLater);
  const dismissPermanently = useAppStore((state) => state.dismissWelcomePermanently);
  const openDonationPage = useAppStore((state) => state.openDonationPage);
  const { t } = useTranslation();
  const dialogRef = useModalAccessibility(open, closeLater);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 px-4" onClick={closeLater}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-dialog-title"
        aria-describedby="welcome-dialog-description"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="relative flex w-full max-w-[560px] flex-col overflow-hidden rounded-3xl border border-accent/35 bg-surface-0 shadow-2xl shadow-black/50"
      >
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-accent/15 to-transparent" aria-hidden="true" />
        <button
          onClick={closeLater}
          aria-label={t("accessibility.closeDialog")}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text-primary"
        >
          ✕
        </button>

        <div className="relative flex flex-col items-center px-8 pb-8 pt-10 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-2xl font-black text-surface-0 shadow-lg shadow-accent/20">
            L
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-accent">{t("welcome.eyebrow")}</p>
          <h2 id="welcome-dialog-title" className="text-2xl font-bold tracking-tight text-text-primary">
            {t("welcome.title")}
          </h2>
          <p id="welcome-dialog-description" className="mt-4 max-w-[460px] text-sm leading-6 text-text-secondary">
            {t("welcome.description")}
          </p>

          <div className="mt-5 w-full rounded-2xl border border-border-subtle bg-surface-1/80 px-5 py-4">
            <p className="text-sm leading-6 text-text-secondary">{t("welcome.thanks")}</p>
            <p className="mt-2 text-sm font-medium text-text-primary">{t("welcome.support")}</p>
          </div>

          {donationError && (
            <p role="alert" className="mt-3 w-full rounded-lg border border-confidence-low/40 bg-confidence-low/10 px-3 py-2 text-xs text-confidence-low">
              {donationError}
            </p>
          )}

          <div className="mt-6 grid w-full grid-cols-2 gap-3">
            <button
              onClick={() => void openDonationPage()}
              disabled={!donationConfigured}
              className="rounded-xl bg-accent px-4 py-3 text-sm font-bold text-surface-0 shadow-lg shadow-accent/15 transition hover:bg-accent-glow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              💛 {t("welcome.donate")}
            </button>
            <button
              onClick={closeLater}
              className="rounded-xl border border-border-subtle bg-surface-1 px-4 py-3 text-sm font-semibold text-text-primary transition hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {t("welcome.later")}
            </button>
          </div>

          <button onClick={() => void dismissPermanently()} className="mt-4 text-xs text-text-muted underline-offset-4 hover:text-text-primary hover:underline">
            {t("welcome.neverShowAgain")}
          </button>
        </div>
      </div>
    </div>
  );
}
