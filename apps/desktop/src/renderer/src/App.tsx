import { useEffect } from "react";
import { useAppStore } from "./state/useAppStore.js";
import { Viewer3D } from "./components/viewer3d/Viewer3D.js";
import { LayerViewControls } from "./components/viewer3d/LayerViewControls.js";
import { ImportPanel } from "./app/ImportPanel.js";
import { IntentPanel } from "./app/IntentPanel.js";
import { ReviewPanel } from "./app/ReviewPanel.js";
import { AdvancedPanel } from "./app/AdvancedPanel.js";
import { OnboardingTour } from "./app/OnboardingTour.js";
import { LeftToolRail } from "./app/LeftToolRail.js";
import { ResizePanel } from "./app/ResizePanel.js";
import { HelpAboutDialog } from "./app/HelpAboutDialog.js";
import { SettingsDialog } from "./app/SettingsDialog.js";
import { UpdateDialog } from "./app/UpdateDialog.js";
import { ProgressBar } from "./components/ui/ProgressBar.js";
import { useTranslation } from "./i18n/useTranslation.js";

export default function App(): React.JSX.Element {
  const { t } = useTranslation();
  const step = useAppStore((s) => s.step);
  const loadProfileDb = useAppStore((s) => s.loadProfileDb);
  const loadCustomProfiles = useAppStore((s) => s.loadCustomProfiles);
  const loadLanguage = useAppStore((s) => s.loadLanguage);
  const printers = useAppStore((s) => s.printers);
  const selectedPrinterId = useAppStore((s) => s.selectedPrinterId);
  const geometry = useAppStore((s) => s.geometry);
  const analysis = useAppStore((s) => s.analysis);
  const config = useAppStore((s) => s.config);
  const layerViewEnabled = useAppStore((s) => s.layerViewEnabled);
  const layerViewHeightMm = useAppStore((s) => s.layerViewHeightMm);
  const toggleAdvancedPanel = useAppStore((s) => s.toggleAdvancedPanel);
  const checkOnboarding = useAppStore((s) => s.checkOnboarding);
  const handleMenuAction = useAppStore((s) => s.handleMenuAction);
  const toolNotice = useAppStore((s) => s.toolNotice);
  const facePickModeActive = useAppStore((s) => s.facePickModeActive);
  const toggleFacePickMode = useAppStore((s) => s.toggleFacePickMode);
  const applyManualFaceOrientation = useAppStore((s) => s.applyManualFaceOrientation);
  const setUpdateState = useAppStore((s) => s.setUpdateState);

  useEffect(() => {
    void loadProfileDb();
    void loadCustomProfiles();
    void checkOnboarding();
    void loadLanguage();
  }, [loadProfileDb, loadCustomProfiles, checkOnboarding, loadLanguage]);

  useEffect(() => window.api.onMenuAction(handleMenuAction), [handleMenuAction]);

  useEffect(() => {
    void window.api.getUpdateState().then(setUpdateState);
    return window.api.onUpdateStateChanged(setUpdateState);
  }, [setUpdateState]);

  const printer = printers.find((p) => p.id === selectedPrinterId);
  const fillPattern = config?.fill_pattern?.value;
  const layerView =
    layerViewEnabled && step === "review"
      ? { heightMm: layerViewHeightMm, fillPattern: typeof fillPattern === "string" ? fillPattern : "grid" }
      : null;

  return (
    <div className="flex h-full flex-col bg-surface-0">
      <header className="flex items-center gap-3 border-b border-border-subtle px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-prusa-orange text-sm font-bold text-surface-0">L</div>
        <h1 className="text-base font-semibold tracking-tight text-text-primary">
          Layer<span className="text-prusa-orange">AI</span>
        </h1>
        {printer && <span className="ml-2 text-xs text-text-muted">{printer.name}</span>}
        <button
          onClick={toggleAdvancedPanel}
          title={t("app.settings")}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-2 hover:text-prusa-orange"
        >
          ⚙
        </button>
      </header>

      <main className="relative flex min-h-0 flex-1">
        <LeftToolRail />
        <div className="relative flex-1">
          <Viewer3D
            printer={printer}
            geometry={geometry}
            overhangFaces={analysis?.overhangFaces ?? []}
            boundingBoxMm={analysis?.boundingBoxMm ?? null}
            layerView={layerView}
            facePickModeActive={facePickModeActive}
            onFacePicked={(normal) => void applyManualFaceOrientation(normal)}
          />
          {facePickModeActive && (
            <div className="absolute left-1/2 top-4 z-30 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-prusa-orange/50 bg-surface-1 px-4 py-2 text-sm text-text-primary shadow-xl">
              {t("facePick.hint")}
              <button onClick={toggleFacePickMode} className="text-xs text-text-muted hover:text-text-primary">
                {t("facePick.cancel")}
              </button>
            </div>
          )}
          {step === "analyzing" && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-0/70">
              <ProgressBar label={t("analyzing.label")} />
            </div>
          )}
          {step === "review" && <LayerViewControls />}
        </div>

        <aside className="w-[420px] shrink-0 border-l border-border-subtle bg-surface-0">
          {step === "import" && <ImportPanel />}
          {(step === "intent" || step === "generating") && <IntentPanel />}
          {step === "review" && <ReviewPanel />}
        </aside>

        <AdvancedPanel />
        <ResizePanel />
        <HelpAboutDialog />
        <SettingsDialog />
        <UpdateDialog />
        <OnboardingTour />

        {toolNotice && (
          <div className="absolute left-1/2 top-4 z-50 max-w-md -translate-x-1/2 rounded-lg border border-border-subtle bg-surface-1 px-4 py-2 text-sm text-text-primary shadow-xl">
            {toolNotice}
          </div>
        )}
      </main>
    </div>
  );
}
