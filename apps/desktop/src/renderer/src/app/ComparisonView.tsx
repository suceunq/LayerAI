import { useAppStore } from "../state/useAppStore.js";
import { Card } from "../components/ui/Card.js";
import { useTranslation } from "../i18n/useTranslation.js";
import { formatDurationMinutes } from "../lib/duration.js";

export function ComparisonView(): React.JSX.Element {
  const comparison = useAppStore((s) => s.comparison);
  const quantity = useAppStore((s) => s.quantity);
  const { t } = useTranslation();
  if (!comparison) return <></>;

  const formatDelta = (percent: number): string => {
    const rounded = Math.round(Math.abs(percent));
    if (rounded < 1) return t("comparison.unchanged");
    return percent >= 0 ? `-${rounded}%` : `+${rounded}%`;
  };

  return (
    <Card className="p-4">
      <h3 className="mb-1 text-xs uppercase tracking-wide text-text-muted">{t("comparison.title")}</h3>
      <p className="mb-3 text-[11px] text-text-muted">{t("comparison.subtitle")}</p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-text-secondary">{t("comparison.time")}</div>
          <div className="text-text-primary">
            {formatDurationMinutes(comparison.aiEstimatedTimeMin, t)}{" "}
            <span className={comparison.timeSavedPercent >= 0 ? "text-confidence-high" : "text-confidence-low"}>
              ({formatDelta(comparison.timeSavedPercent)})
            </span>
          </div>
        </div>
        <div>
          <div className="text-text-secondary">{t("comparison.filament")}</div>
          <div className="text-text-primary">
            {comparison.aiFilamentG.toFixed(1)} g{" "}
            <span className={comparison.filamentSavedPercent >= 0 ? "text-confidence-high" : "text-confidence-low"}>
              ({formatDelta(comparison.filamentSavedPercent)})
            </span>
          </div>
        </div>
        <div>
          <div className="text-text-secondary">{t("comparison.strength")}</div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent" style={{ width: `${comparison.strengthScore * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="text-text-secondary">{t("comparison.quality")}</div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent" style={{ width: `${comparison.qualityScore * 100}%` }} />
          </div>
        </div>
      </div>

      {quantity > 1 && (
        <p className="mt-3 border-t border-border-subtle pt-2 text-xs text-text-muted">
          {t("comparison.batchTotal", {
            count: quantity,
            time: formatDurationMinutes(comparison.aiEstimatedTimeMin * quantity, t),
            weight: (comparison.aiFilamentG * quantity).toFixed(1),
          })}
        </p>
      )}
    </Card>
  );
}
