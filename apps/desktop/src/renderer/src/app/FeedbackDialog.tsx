import { useEffect, useState } from "react";
import { useAppStore } from "../state/useAppStore.js";
import { Button } from "../components/ui/Button.js";
import { useTranslation } from "../i18n/useTranslation.js";
import { useModalAccessibility } from "../hooks/useModalAccessibility.js";

const FEEDBACK_EMAIL = "bob62138@gmail.com";

export function FeedbackDialog(): React.JSX.Element | null {
  const open = useAppStore((s) => s.feedbackDialogOpen);
  const toggleOpen = useAppStore((s) => s.toggleFeedbackDialog);
  const showToolNotice = useAppStore((s) => s.showToolNotice);
  const { t } = useTranslation();
  const dialogRef = useModalAccessibility(open, toggleOpen);

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) return;
    setSubject(t("app.feedbackSubject"));
    setMessage("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const handleSend = (): void => {
    const href = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
    const a = document.createElement("a");
    a.href = href;
    a.target = "_blank";
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toggleOpen();
    showToolNotice(t("feedback.opened"));
  };

  const handleCopy = (): void => {
    void navigator.clipboard.writeText(`${FEEDBACK_EMAIL}\n${subject}\n\n${message}`);
    showToolNotice(t("feedback.copied"));
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60" onClick={toggleOpen}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="feedback-dialog-title" tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-[520px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-0 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
          <h2 id="feedback-dialog-title" className="text-base font-semibold text-text-primary">{t("feedback.title")}</h2>
          <button onClick={toggleOpen} aria-label={t("accessibility.closeDialog")} className="text-text-muted hover:text-text-primary">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-text-secondary">{t("feedback.hint")}</p>
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-text-muted">{t("feedback.subjectLabel")}</span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-text-muted">{t("feedback.messageLabel")}</span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={7}
                placeholder={t("feedback.messagePlaceholder")}
                className="resize-none rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
              />
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border-subtle px-5 py-3">
          <button
            onClick={handleCopy}
            disabled={message.trim() === ""}
            className="text-xs text-text-muted hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("feedback.copy")}
          </button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={toggleOpen}>
              {t("settings.cancel")}
            </Button>
            <Button onClick={handleSend} disabled={message.trim() === ""}>
              {t("feedback.send")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
