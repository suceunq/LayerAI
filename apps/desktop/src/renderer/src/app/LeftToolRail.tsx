import { useAppStore } from "../state/useAppStore.js";
import { computeSizeFit } from "../lib/size-fit.js";
import { useTranslation } from "../i18n/useTranslation.js";

export function LeftToolRail(): React.JSX.Element | null {
  const { t } = useTranslation();
  const analysis = useAppStore((s) => s.analysis);
  const printers = useAppStore((s) => s.printers);
  const selectedPrinterId = useAppStore((s) => s.selectedPrinterId);
  const toggleResizePanel = useAppStore((s) => s.toggleResizePanel);
  const facePickModeActive = useAppStore((s) => s.facePickModeActive);
  const toggleFacePickMode = useAppStore((s) => s.toggleFacePickMode);

  if (!analysis) return null;

  const printer = printers.find((p) => p.id === selectedPrinterId);
  const fits = printer ? computeSizeFit(analysis, printer).fits : true;

  return (
    <div className="flex w-14 shrink-0 flex-col items-center gap-2 border-r border-border-subtle bg-surface-0 py-4">
      <button
        onClick={toggleResizePanel}
        title={t("app.resize")}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-lg text-text-secondary hover:bg-surface-2 hover:text-accent"
      >
        ⛶
        {!fits && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-confidence-low" />}
      </button>
      <button
        onClick={toggleFacePickMode}
        title={t("app.chooseFace")}
        className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${
          facePickModeActive ? "bg-accent text-surface-0" : "text-text-secondary hover:bg-surface-2 hover:text-accent"
        }`}
      >
        ⤓
      </button>
    </div>
  );
}
