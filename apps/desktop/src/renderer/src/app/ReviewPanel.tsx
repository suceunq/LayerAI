import { useAppStore } from "../state/useAppStore.js";
import { Button } from "../components/ui/Button.js";
import { Card } from "../components/ui/Card.js";
import { ConfidenceBadge } from "../components/ui/ConfidenceBadge.js";
import { ComparisonView } from "./ComparisonView.js";
import { OutcomeTagging } from "./OutcomeTagging.js";

export function ReviewPanel(): React.JSX.Element {
  const explanations = useAppStore((s) => s.explanations);
  const exportThreeMf = useAppStore((s) => s.exportThreeMf);
  const exportPdfReport = useAppStore((s) => s.exportPdfReport);
  const toggleAdvancedPanel = useAppStore((s) => s.toggleAdvancedPanel);
  const startOver = useAppStore((s) => s.startOver);
  const error = useAppStore((s) => s.error);

  if (!explanations) return <></>;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Configuration générée</h2>
        <ConfidenceBadge percent={explanations.overallConfidencePercent} />
      </div>
      <p className="text-sm text-text-secondary">{explanations.summary}</p>

      <ComparisonView />

      <div className="flex flex-col gap-2">
        {explanations.parameters.map((p) => (
          <Card key={p.parameterKey} className="p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-text-primary">
                {p.parameterKey} = <span className="text-prusa-orange">{p.valueLabel}</span>
              </span>
              <ConfidenceBadge percent={p.confidencePercent} />
            </div>
            <p className="mt-1 text-xs text-text-secondary">{p.whyText}</p>
          </Card>
        ))}
      </div>

      <button onClick={toggleAdvancedPanel} className="self-start text-xs text-text-muted hover:text-prusa-orange">
        ▸ Modifier les réglages avancés, sauvegarder un profil…
      </button>

      {error && <p className="text-sm text-confidence-low">{error}</p>}

      <div className="mt-auto flex flex-col gap-2">
        <div className="flex gap-3">
          <Button variant="secondary" onClick={startOver}>
            Recommencer
          </Button>
          <Button onClick={() => void exportThreeMf()} className="flex-1">
            Exporter le projet 3MF →
          </Button>
        </div>
        <Button variant="ghost" onClick={() => void exportPdfReport()}>
          Rapport PDF
        </Button>
      </div>

      <OutcomeTagging />
    </div>
  );
}
