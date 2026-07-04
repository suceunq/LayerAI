import { useAppStore } from "../state/useAppStore.js";
import { Button } from "../components/ui/Button.js";
import { AI_MODES } from "./ai-modes.js";
import { AdvancedTable } from "./AdvancedTable.js";
import { useTranslation } from "../i18n/useTranslation.js";

export function AdvancedPanel(): React.JSX.Element | null {
  const advancedPanelOpen = useAppStore((s) => s.advancedPanelOpen);
  const toggleAdvancedPanel = useAppStore((s) => s.toggleAdvancedPanel);
  const intentText = useAppStore((s) => s.intentText);
  const setIntentText = useAppStore((s) => s.setIntentText);
  const customProfiles = useAppStore((s) => s.customProfiles);
  const applyCustomProfile = useAppStore((s) => s.applyCustomProfile);
  const deleteCustomProfile = useAppStore((s) => s.deleteCustomProfile);
  const saveCurrentAsProfile = useAppStore((s) => s.saveCurrentAsProfile);
  const config = useAppStore((s) => s.config);
  const exportIni = useAppStore((s) => s.exportIni);
  const step = useAppStore((s) => s.step);
  const replayOnboarding = useAppStore((s) => s.replayOnboarding);
  const toggleSettingsDialog = useAppStore((s) => s.toggleSettingsDialog);
  const { t, language } = useTranslation();

  if (!advancedPanelOpen) return null;

  const handleSaveProfile = (): void => {
    const name = window.prompt(t("advanced.promptProfileName"));
    if (name && name.trim()) void saveCurrentAsProfile(name.trim());
  };

  const handleReplayOnboarding = (): void => {
    toggleAdvancedPanel();
    replayOnboarding();
  };

  const handleOpenSettings = (): void => {
    toggleAdvancedPanel();
    toggleSettingsDialog();
  };

  return (
    <div className="absolute inset-0 z-20 flex justify-end bg-black/50" onClick={toggleAdvancedPanel}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-[440px] flex-col gap-5 overflow-y-auto border-l border-border-subtle bg-surface-0 p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">{t("advanced.title")}</h2>
          <button onClick={toggleAdvancedPanel} className="text-text-muted hover:text-text-primary">
            ✕
          </button>
        </div>

        <section>
          <h3 className="mb-2 text-xs uppercase tracking-wide text-text-muted">{t("advanced.aiModes")}</h3>
          <div className="grid grid-cols-3 gap-2">
            {AI_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setIntentText(mode.intentText[language])}
                className="flex flex-col items-center gap-1 rounded-lg border border-border-subtle bg-surface-2 py-3 text-xs text-text-secondary hover:border-prusa-orange hover:text-text-primary"
              >
                <span className="text-lg text-prusa-orange">{mode.icon}</span>
                {t(mode.labelKey)}
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs uppercase tracking-wide text-text-muted">{t("advanced.myProfiles")}</h3>
            {intentText && (
              <button onClick={handleSaveProfile} className="text-xs text-prusa-orange hover:text-prusa-orange-glow">
                {t("advanced.saveCurrent")}
              </button>
            )}
          </div>
          {customProfiles.length === 0 ? (
            <p className="text-xs text-text-muted">{t("advanced.noProfiles")}</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {customProfiles.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-2 px-3 py-2">
                  <button onClick={() => applyCustomProfile(profile)} className="text-left text-sm text-text-primary hover:text-prusa-orange">
                    {profile.name}
                  </button>
                  <button onClick={() => void deleteCustomProfile(profile.id)} className="text-xs text-text-muted hover:text-confidence-low">
                    {t("advanced.delete")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {step === "review" && config && (
          <section className="flex min-h-0 flex-1 flex-col">
            <h3 className="mb-2 text-xs uppercase tracking-wide text-text-muted">{t("advanced.rawSettings")}</h3>
            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border-subtle bg-surface-1 p-3">
              <AdvancedTable />
            </div>
            <Button variant="ghost" onClick={() => void exportIni()} className="mt-3">
              {t("advanced.exportIni")}
            </Button>
          </section>
        )}

        <section className="mt-auto border-t border-border-subtle pt-4">
          <h3 className="mb-2 text-xs uppercase tracking-wide text-text-muted">{t("advanced.general")}</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleReplayOnboarding}
              className="flex w-full items-center gap-2 rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-left text-sm text-text-secondary hover:border-prusa-orange hover:text-text-primary"
            >
              <span className="text-prusa-orange">↻</span>
              {t("advanced.replayOnboarding")}
            </button>
            <button
              onClick={handleOpenSettings}
              className="flex w-full items-center gap-2 rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-left text-sm text-text-secondary hover:border-prusa-orange hover:text-text-primary"
            >
              <span className="text-prusa-orange">⚙</span>
              {t("settings.title")}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
