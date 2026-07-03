import { useAppStore } from "../state/useAppStore.js";
import { Card } from "../components/ui/Card.js";

function formatDelta(percent: number): string {
  const rounded = Math.round(Math.abs(percent));
  if (rounded < 1) return "≈ inchangé";
  return percent >= 0 ? `-${rounded}%` : `+${rounded}%`;
}

export function ComparisonView(): React.JSX.Element {
  const comparison = useAppStore((s) => s.comparison);
  if (!comparison) return <></>;

  return (
    <Card className="p-4">
      <h3 className="mb-1 text-xs uppercase tracking-wide text-text-muted">Comparaison vs réglages standards</h3>
      <p className="mb-3 text-[11px] text-text-muted">Estimations indicatives, pas une prédiction du slicer.</p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-text-secondary">Temps estimé</div>
          <div className="text-text-primary">
            {comparison.aiEstimatedTimeMin.toFixed(0)} min{" "}
            <span className={comparison.timeSavedPercent >= 0 ? "text-confidence-high" : "text-confidence-low"}>
              ({formatDelta(comparison.timeSavedPercent)})
            </span>
          </div>
        </div>
        <div>
          <div className="text-text-secondary">Filament estimé</div>
          <div className="text-text-primary">
            {comparison.aiFilamentG.toFixed(1)} g{" "}
            <span className={comparison.filamentSavedPercent >= 0 ? "text-confidence-high" : "text-confidence-low"}>
              ({formatDelta(comparison.filamentSavedPercent)})
            </span>
          </div>
        </div>
        <div>
          <div className="text-text-secondary">Solidité</div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-prusa-orange" style={{ width: `${comparison.strengthScore * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="text-text-secondary">Qualité</div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-prusa-orange" style={{ width: `${comparison.qualityScore * 100}%` }} />
          </div>
        </div>
      </div>
    </Card>
  );
}
