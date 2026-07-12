import { useEffect, useMemo, useRef, useState } from "react";
import { useAppStore, computePlateArrangement } from "./state/useAppStore.js";
import { Viewer3D, type Viewer3DHandle } from "./components/viewer3d/Viewer3D.js";
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
import { PhotoDiagnosisDialog } from "./app/PhotoDiagnosisDialog.js";
import { InvoiceDialog } from "./app/InvoiceDialog.js";
import { FeedbackDialog } from "./app/FeedbackDialog.js";
import { ProgressBar } from "./components/ui/ProgressBar.js";
import { useTranslation } from "./i18n/useTranslation.js";

export default function App(): React.JSX.Element {
  const { t } = useTranslation();
  const step = useAppStore((s) => s.step);
  const loadProfileDb = useAppStore((s) => s.loadProfileDb);
  const loadCustomProfiles = useAppStore((s) => s.loadCustomProfiles);
  const loadRecentProjects = useAppStore((s) => s.loadRecentProjects);
  const loadLanguage = useAppStore((s) => s.loadLanguage);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const printers = useAppStore((s) => s.printers);
  const selectedPrinterId = useAppStore((s) => s.selectedPrinterId);
  const geometry = useAppStore((s) => s.geometry);
  const analysis = useAppStore((s) => s.analysis);
  const config = useAppStore((s) => s.config);
  const layerViewEnabled = useAppStore((s) => s.layerViewEnabled);
  const toggleLayerView = useAppStore((s) => s.toggleLayerView);
  const checkModelHealth = useAppStore((s) => s.checkModelHealth);
  const togglePhotoDiagnosisDialog = useAppStore((s) => s.togglePhotoDiagnosisDialog);
  const toggleFeedbackDialog = useAppStore((s) => s.toggleFeedbackDialog);
  const layerViewHeightMm = useAppStore((s) => s.layerViewHeightMm);
  const toggleAdvancedPanel = useAppStore((s) => s.toggleAdvancedPanel);
  const checkOnboarding = useAppStore((s) => s.checkOnboarding);
  const handleMenuAction = useAppStore((s) => s.handleMenuAction);
  const toolNotice = useAppStore((s) => s.toolNotice);
  const facePickModeActive = useAppStore((s) => s.facePickModeActive);
  const toggleFacePickMode = useAppStore((s) => s.toggleFacePickMode);
  const applyManualFaceOrientation = useAppStore((s) => s.applyManualFaceOrientation);
  const setUpdateState = useAppStore((s) => s.setUpdateState);
  const quantity = useAppStore((s) => s.quantity);
  const multiPlateEnabled = useAppStore((s) => s.multiPlateEnabled);
  const currentPlateIndex = useAppStore((s) => s.currentPlateIndex);
  const showToolNotice = useAppStore((s) => s.showToolNotice);
  const importedFile = useAppStore((s) => s.importedFile);

  const [surfaceInspect, setSurfaceInspect] = useState<{
    x: number;
    y: number;
    overhang: { angleFromHorizontalDeg: number; areaMm2: number } | null;
  } | null>(null);

  const viewerRef = useRef<Viewer3DHandle>(null);

  const handleCaptureImage = async (): Promise<void> => {
    const dataUrl = viewerRef.current?.captureImage();
    if (!dataUrl) return;
    const suggestedFileName = importedFile?.fileName.replace(/\.[^.]+$/, "") ?? "layerai-capture";
    try {
      const result = await window.api.exportCaptureImage({ dataUrl, suggestedFileName });
      if (result.saved) showToolNotice(t("capture.saved"));
    } catch (err) {
      showToolNotice(err instanceof Error ? err.message : String(err));
    }
  };

  useEffect(() => {
    void loadProfileDb();
    void loadCustomProfiles();
    void loadRecentProjects();
    void checkOnboarding();
    void loadLanguage();
  }, [loadProfileDb, loadCustomProfiles, loadRecentProjects, checkOnboarding, loadLanguage]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => window.api.onMenuAction(handleMenuAction), [handleMenuAction]);

  useEffect(() => {
    void window.api.getUpdateState().then(setUpdateState);
    return window.api.onUpdateStateChanged(setUpdateState);
  }, [setUpdateState]);

  useEffect(() => setSurfaceInspect(null), [step, geometry]);

  const printer = printers.find((p) => p.id === selectedPrinterId);
  // Memoized so the array references stay stable across renders that don't actually change the
  // arrangement (e.g. dragging the layer-view slider) - Viewer3D's camera-fit effect keys off
  // these by reference, so a fresh-but-equal array on every render was silently re-centering and
  // re-zooming the camera out from under the user mid-interaction.
  const plateArrangement = useMemo(
    () => computePlateArrangement(analysis, printer, quantity, multiPlateEnabled ? currentPlateIndex : 0),
    [analysis, printer, quantity, multiPlateEnabled, currentPlateIndex]
  );
  const plateArrangementPositions = useMemo(() => plateArrangement?.positions ?? [], [plateArrangement]);
  const allPlatesPositions = useMemo(
    () =>
      multiPlateEnabled && plateArrangement && plateArrangement.totalPlates > 1
        ? Array.from({ length: plateArrangement.totalPlates }, (_, i) => computePlateArrangement(analysis, printer, quantity, i)?.positions ?? [])
        : undefined,
    [multiPlateEnabled, plateArrangement, analysis, printer, quantity]
  );
  const fillPattern = config?.fill_pattern?.value;
  const layerView =
    layerViewEnabled && step === "review"
      ? { heightMm: layerViewHeightMm, fillPattern: typeof fillPattern === "string" ? fillPattern : "grid" }
      : null;

  return (
    <div className="layerai-shell flex h-full flex-col bg-surface-0">
      <header className="layerai-header flex items-center gap-3 border-b border-border-subtle px-5 py-3">
        <div className="layerai-logo flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-sm font-black text-surface-0">L</div>
        <h1 className="text-base font-semibold tracking-tight text-text-primary">
          Layer<span className="text-accent">AI</span>
        </h1>
        {printer && <span className="ml-2 mr-1 text-xs text-text-muted">{printer.name}</span>}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleLayerView}
            disabled={!analysis}
            title={analysis ? t("layerView.toggle") : t("layerView.noModelHint")}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              layerViewEnabled
                ? "border-accent bg-accent text-surface-0"
                : "border-border-subtle text-text-secondary hover:border-accent hover:text-text-primary"
            }`}
          >
            {t("layerView.toggle")}
          </button>
          <button
            onClick={checkModelHealth}
            disabled={!analysis}
            title={analysis ? t("app.diagnostic") : t("menuAction.noModelHealth")}
            className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("app.diagnostic")}
          </button>
          <button
            onClick={toggleAdvancedPanel}
            title={t("app.settings")}
            className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-text-primary"
          >
            {t("app.settings")}
          </button>
          <button
            onClick={togglePhotoDiagnosisDialog}
            title={t("diagnosis.title")}
            className="rounded-full border border-border-subtle px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-accent hover:text-text-primary"
          >
            {t("diagnosis.title")}
          </button>
          <button
            onClick={toggleFeedbackDialog}
            title={t("app.feedback")}
            className="rounded-full border border-accent/50 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:border-accent hover:bg-accent hover:text-surface-0"
          >
            ✉ {t("app.feedback")}
          </button>
        </div>
        <div className="ml-auto flex items-center gap-1 rounded-full border border-border-subtle p-0.5">
          <button
            onClick={() => void setTheme("dark")}
            title={t("settings.theme.dark")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              theme === "dark" ? "bg-accent text-surface-0" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t("settings.theme.dark")}
          </button>
          <button
            onClick={() => void setTheme("light")}
            title={t("settings.theme.light")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              theme === "light" ? "bg-accent text-surface-0" : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {t("settings.theme.light")}
          </button>
        </div>
      </header>

      <LayerViewControls />

      <main className="layerai-workspace relative flex min-h-0 flex-1">
        <LeftToolRail />
        <div className="relative flex-1">
          <Viewer3D
            ref={viewerRef}
            printer={printer}
            geometry={geometry}
            overhangFaces={analysis?.overhangFaces ?? []}
            boundingBoxMm={analysis?.boundingBoxMm ?? null}
            layerView={layerView}
            facePickModeActive={facePickModeActive}
            onFacePicked={(normal) => void applyManualFaceOrientation(normal)}
            showSupportPreview={step === "review" && config?.support_material?.value === true}
            onSurfaceClicked={setSurfaceInspect}
            plateArrangementPositions={plateArrangementPositions}
            allPlatesPositions={allPlatesPositions}
            activePlateIndex={currentPlateIndex}
            theme={theme}
          />
          {step === "review" && (
            <button
              onClick={() => void handleCaptureImage()}
              title={t("capture.button")}
              className="absolute right-3 top-3 z-30 flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle bg-surface-1/80 text-text-secondary shadow-lg hover:border-accent hover:text-accent"
            >
              📷
            </button>
          )}
          {surfaceInspect && (
            <div
              className="absolute z-30 max-w-xs rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-xs text-text-secondary shadow-xl"
              style={{ left: surfaceInspect.x + 12, top: surfaceInspect.y + 12 }}
            >
              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="font-semibold text-text-primary">{t("supports.explainZoneTitle")}</span>
                <button onClick={() => setSurfaceInspect(null)} className="text-text-muted hover:text-text-primary">
                  ✕
                </button>
              </div>
              {surfaceInspect.overhang ? (
                <p>
                  {t("supports.explainOverhang", {
                    angle: Math.round(surfaceInspect.overhang.angleFromHorizontalDeg),
                    area: Math.round(surfaceInspect.overhang.areaMm2),
                  })}
                </p>
              ) : (
                <p>{t("supports.explainNoOverhang")}</p>
              )}
            </div>
          )}
          {facePickModeActive && (
            <div className="absolute left-1/2 top-4 z-30 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-accent/50 bg-surface-1 px-4 py-2 text-sm text-text-primary shadow-xl">
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
        </div>

        <aside className="layerai-panel w-[420px] shrink-0 border-l border-border-subtle bg-surface-0">
          {step === "import" && <ImportPanel />}
          {(step === "intent" || step === "generating") && <IntentPanel />}
          {step === "review" && <ReviewPanel />}
        </aside>

        <AdvancedPanel />
        <ResizePanel />
        <HelpAboutDialog />
        <SettingsDialog />
        <UpdateDialog />
        <PhotoDiagnosisDialog />
        <InvoiceDialog />
        <FeedbackDialog />
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
