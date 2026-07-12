import { useAppStore } from "../state/useAppStore.js";
import { Button } from "../components/ui/Button.js";
import { Card } from "../components/ui/Card.js";
import { ConfidenceBadge } from "../components/ui/ConfidenceBadge.js";
import { ComparisonView } from "./ComparisonView.js";
import { CostEstimate } from "./CostEstimate.js";
import { OutcomeTagging } from "./OutcomeTagging.js";
import { SupportsControl } from "./SupportsControl.js";
import { PlateQuantityControl } from "./PlateQuantityControl.js";
import { useTranslation } from "../i18n/useTranslation.js";
import { RiskOverview } from "./RiskOverview.js";

const SUPPORTS_CONTROL_KEYS = new Set(["support_material", "support_material_style"]);

export function ReviewPanel(): React.JSX.Element {
  const { t } = useTranslation();
  const explanations = useAppStore((s) => s.explanations);
  const exportThreeMf = useAppStore((s) => s.exportThreeMf);
  const exportPdfReport = useAppStore((s) => s.exportPdfReport);
  const toggleInvoiceDialog = useAppStore((s) => s.toggleInvoiceDialog);
  const openInSlicer = useAppStore((s) => s.openInSlicer);
  const toggleAdvancedPanel = useAppStore((s) => s.toggleAdvancedPanel);
  const startOver = useAppStore((s) => s.startOver);
  const error = useAppStore((s) => s.error);
  const slicerNotice = useAppStore((s) => s.slicerNotice);
  const printers = useAppStore((s) => s.printers);
  const selectedPrinterId = useAppStore((s) => s.selectedPrinterId);

  if (!explanations) return <></>;

  const printer = printers.find((p) => p.id === selectedPrinterId);
  const slicerName = printer?.vendor === "Bambu Lab" ? "Bambu Studio" : printer?.vendor === "Creality" ? "Creality Print" : "PrusaSlicer";
  const learnedCount = explanations.parameters.filter((p) => p.ruleId.startsWith("learning.")).length;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">{t("review.title")}</h2>
        <ConfidenceBadge percent={explanations.overallConfidencePercent} />
      </div>
      <p className="text-sm text-text-secondary">{explanations.summary}</p>

      {learnedCount > 0 && (
        <p className="rounded-lg bg-accent/10 px-3 py-2 text-xs text-accent">{t("learning.summary", { count: learnedCount })}</p>
      )}

      <RiskOverview />

      <ComparisonView />

      <CostEstimate />

      <PlateQuantityControl />

      <SupportsControl />

      <div className="flex flex-col gap-2">
        {explanations.parameters
          .filter((p) => !SUPPORTS_CONTROL_KEYS.has(p.parameterKey))
          .map((p) => {
            const learned = p.ruleId.startsWith("learning.");
            return (
              <Card key={p.parameterKey} className={`p-3 ${learned ? "border-accent/60" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm text-text-primary">
                    {p.parameterKey} = <span className="text-accent">{p.valueLabel}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {learned && (
                      <span
                        title={t("learning.badgeHint")}
                        className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent"
                      >
                        {t("learning.badge")}
                      </span>
                    )}
                    <ConfidenceBadge percent={p.confidencePercent} />
                  </div>
                </div>
                <p className="mt-1 text-xs text-text-secondary">{p.whyText}</p>
              </Card>
            );
          })}
      </div>

      <button onClick={toggleAdvancedPanel} className="self-start text-xs text-text-muted hover:text-accent">
        {t("review.advancedLink")}
      </button>

      {error && <p className="text-sm text-confidence-low">{error}</p>}
      {slicerNotice && <p className="text-sm text-accent">{slicerNotice}</p>}

      <div className="mt-auto flex flex-col gap-2">
        <Button onClick={() => void openInSlicer()} className="w-full">
          {t("review.openInSlicer", { slicer: slicerName })}
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void exportThreeMf()} className="flex-1">
            {t("review.exportThreeMf")}
          </Button>
          <Button variant="secondary" onClick={() => void exportPdfReport()} className="flex-1">
            {t("review.exportPdf")}
          </Button>
        </div>
        <Button variant="secondary" onClick={toggleInvoiceDialog} className="w-full">
          {t("invoice.title")}
        </Button>
        <button onClick={startOver} className="self-center text-xs text-text-muted hover:text-text-primary">
          {t("review.startOver")}
        </button>
      </div>

      <OutcomeTagging />
    </div>
  );
}
