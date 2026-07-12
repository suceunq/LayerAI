import { useEffect, useState } from "react";
import { useAppStore } from "../state/useAppStore.js";
import { useTranslation } from "../i18n/useTranslation.js";
import { useModalAccessibility } from "../hooks/useModalAccessibility.js";

export function HelpAboutDialog(): React.JSX.Element | null {
  const helpDialogOpen = useAppStore((s) => s.helpDialogOpen);
  const helpDialogTab = useAppStore((s) => s.helpDialogTab);
  const closeHelpDialog = useAppStore((s) => s.closeHelpDialog);
  const openHelpDialog = useAppStore((s) => s.openHelpDialog);
  const replayOnboarding = useAppStore((s) => s.replayOnboarding);
  const { t } = useTranslation();
  const [version, setVersion] = useState("");
  const dialogRef = useModalAccessibility(helpDialogOpen, closeHelpDialog);

  useEffect(() => {
    if (helpDialogOpen) void window.api.getAppVersion().then(setVersion);
  }, [helpDialogOpen]);

  if (!helpDialogOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60" onClick={closeHelpDialog}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="help-dialog-title" tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-[520px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-0 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
          <h2 id="help-dialog-title" className="text-base font-semibold text-text-primary">{t("help.title")}</h2>
          <button onClick={closeHelpDialog} aria-label={t("accessibility.closeDialog")} className="text-text-muted hover:text-text-primary">
            ✕
          </button>
        </div>

        <div className="flex border-b border-border-subtle px-5" role="tablist" aria-label={t("help.title")}>
          <button
            role="tab" aria-selected={helpDialogTab === "aide"} aria-controls="help-tabpanel"
            onClick={() => openHelpDialog("aide")}
            className={`border-b-2 px-3 py-2 text-sm ${helpDialogTab === "aide" ? "border-accent text-accent" : "border-transparent text-text-muted hover:text-text-primary"}`}
          >
            {t("help.tabHelp")}
          </button>
          <button
            role="tab" aria-selected={helpDialogTab === "apropos"} aria-controls="help-tabpanel"
            onClick={() => openHelpDialog("apropos")}
            className={`border-b-2 px-3 py-2 text-sm ${helpDialogTab === "apropos" ? "border-accent text-accent" : "border-transparent text-text-muted hover:text-text-primary"}`}
          >
            {t("help.tabAbout")}
          </button>
        </div>

        <div id="help-tabpanel" role="tabpanel" className="flex-1 overflow-y-auto p-5">
          {helpDialogTab === "aide" ? (
            <div className="flex flex-col gap-4 text-sm text-text-secondary">
              <section>
                <h3 className="mb-1 font-medium text-text-primary">{t("help.step1Title")}</h3>
                <p>{t("help.step1Body")}</p>
              </section>
              <section>
                <h3 className="mb-1 font-medium text-text-primary">{t("help.step2Title")}</h3>
                <p>{t("help.step2Body")}</p>
              </section>
              <section>
                <h3 className="mb-1 font-medium text-text-primary">{t("help.step3Title")}</h3>
                <p>{t("help.step3Body")}</p>
              </section>
              <section>
                <h3 className="mb-1 font-medium text-text-primary">{t("help.step4Title")}</h3>
                <p>{t("help.step4Body")}</p>
              </section>
              <button onClick={replayOnboarding} className="self-start text-xs text-accent hover:text-accent-glow">
                {t("help.replayOnboarding")}
              </button>

              <hr className="border-border-subtle" />

              <section>
                <h3 className="mb-2 font-medium text-text-primary">{t("help.featuresTitle")}</h3>
                <ul className="list-disc space-y-1 pl-4">
                  {[
                    "help.features.naturalLanguage",
                    "help.features.overhangs",
                    "help.features.multiPlate",
                    "help.features.photoDiagnosis",
                    "help.features.multiExport",
                    "help.features.invoicing",
                    "help.features.costEstimate",
                    "help.features.learning",
                    "help.features.autoUpdate",
                  ].map((key) => (
                    <li key={key}>{t(key)}</li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="mb-1 font-medium text-text-primary">{t("help.exportTitle")}</h3>
                <p className="mb-1">{t("help.export.threeMf")}</p>
                <p className="mb-1">{t("help.export.iniAndJson")}</p>
                <p>{t("help.export.pdf")}</p>
              </section>

              <section>
                <h3 className="mb-1 font-medium text-text-primary">{t("help.costTitle")}</h3>
                <p>{t("help.costBody")}</p>
              </section>

              <section>
                <h3 className="mb-1 font-medium text-text-primary">{t("help.invoiceTitle")}</h3>
                <p>{t("help.invoiceBody")}</p>
              </section>

              <section>
                <h3 className="mb-1 font-medium text-text-primary">{t("help.aiTitle")}</h3>
                <p>{t("help.aiBody")}</p>
              </section>

              <section>
                <h3 className="mb-2 font-medium text-text-primary">{t("help.faqTitle")}</h3>
                <div className="flex flex-col gap-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n}>
                      <p className="font-medium text-text-primary">{t(`help.faq.q${n}`)}</p>
                      <p>{t(`help.faq.a${n}`)}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="mb-2 font-medium text-text-primary">{t("help.tipsTitle")}</h3>
                <ul className="list-disc space-y-1 pl-4">
                  {["help.tips.tip1", "help.tips.tip2", "help.tips.tip3", "help.tips.tip4"].map((key) => (
                    <li key={key}>{t(key)}</li>
                  ))}
                </ul>
              </section>
            </div>
          ) : (
            <div className="flex flex-col gap-4 text-sm text-text-secondary">
              <div>
                <p className="text-base font-semibold text-text-primary">
                  Layer<span className="text-accent">AI</span>
                </p>
                <p className="text-xs text-text-muted">{t("help.aboutVersion", { version: version || "…" })}</p>
              </div>
              <p>{t("help.aboutBody1")}</p>
              <p>
                {t("help.aboutBody2")
                  .split("docs/licensing")
                  .map((part, i, arr) =>
                    i < arr.length - 1 ? (
                      <span key={i}>
                        {part}
                        <span className="font-mono text-text-primary">docs/licensing</span>
                      </span>
                    ) : (
                      part
                    )
                  )}
              </p>
              <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-primary">{t("help.aboutThanksTitle")}</p>
                <p className="mb-2">{t("help.aboutThanksBody")}</p>
                <div className="flex flex-col gap-1">
                  <a
                    href="https://www.tiktok.com/@keups3d?is_from_webapp=1&sender_device=pc"
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:text-accent-glow"
                  >
                    Keup's 3D — {t("help.aboutThanksTikTok")} ↗
                  </a>
                  <a
                    href="https://www.tiktok.com/@lolo.lc3d?is_from_webapp=1&sender_device=pc"
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent hover:text-accent-glow"
                  >
                    lolo.lc3d — {t("help.aboutThanksTikTok")} ↗
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border-subtle pt-3 text-xs text-text-muted">
                <span>{t("help.aboutCreatedBy")}</span>
                <a
                  href="https://www.tiktok.com/@chtibob5931?is_from_webapp=1&sender_device=pc"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:text-accent-glow"
                >
                  {t("help.aboutTikTok")} ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
