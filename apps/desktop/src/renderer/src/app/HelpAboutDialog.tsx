import { useEffect, useState } from "react";
import { useAppStore } from "../state/useAppStore.js";
import { useTranslation } from "../i18n/useTranslation.js";

export function HelpAboutDialog(): React.JSX.Element | null {
  const helpDialogOpen = useAppStore((s) => s.helpDialogOpen);
  const helpDialogTab = useAppStore((s) => s.helpDialogTab);
  const closeHelpDialog = useAppStore((s) => s.closeHelpDialog);
  const openHelpDialog = useAppStore((s) => s.openHelpDialog);
  const replayOnboarding = useAppStore((s) => s.replayOnboarding);
  const { t } = useTranslation();
  const [version, setVersion] = useState("");

  useEffect(() => {
    if (helpDialogOpen) void window.api.getAppVersion().then(setVersion);
  }, [helpDialogOpen]);

  if (!helpDialogOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60" onClick={closeHelpDialog}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-[520px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-0 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
          <h2 className="text-base font-semibold text-text-primary">{t("help.title")}</h2>
          <button onClick={closeHelpDialog} className="text-text-muted hover:text-text-primary">
            ✕
          </button>
        </div>

        <div className="flex border-b border-border-subtle px-5">
          <button
            onClick={() => openHelpDialog("aide")}
            className={`border-b-2 px-3 py-2 text-sm ${helpDialogTab === "aide" ? "border-prusa-orange text-prusa-orange" : "border-transparent text-text-muted hover:text-text-primary"}`}
          >
            {t("help.tabHelp")}
          </button>
          <button
            onClick={() => openHelpDialog("apropos")}
            className={`border-b-2 px-3 py-2 text-sm ${helpDialogTab === "apropos" ? "border-prusa-orange text-prusa-orange" : "border-transparent text-text-muted hover:text-text-primary"}`}
          >
            {t("help.tabAbout")}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
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
              <button onClick={replayOnboarding} className="self-start text-xs text-prusa-orange hover:text-prusa-orange-glow">
                {t("help.replayOnboarding")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 text-sm text-text-secondary">
              <div>
                <p className="text-base font-semibold text-text-primary">
                  Layer<span className="text-prusa-orange">AI</span>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
