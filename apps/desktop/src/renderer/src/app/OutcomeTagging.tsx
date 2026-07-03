import type { PrintOutcomeId } from "@layerai/shared-types";
import { useAppStore } from "../state/useAppStore.js";
import { Card } from "../components/ui/Card.js";

const OUTCOMES: { id: PrintOutcomeId; label: string }[] = [
  { id: "perfect", label: "Impression parfaite" },
  { id: "too_fragile", label: "Trop fragile" },
  { id: "supports_difficult", label: "Supports difficiles" },
  { id: "detachment", label: "Décollement" },
  { id: "warping", label: "Warping" },
  { id: "poor_quality", label: "Mauvaise qualité" },
];

export function OutcomeTagging(): React.JSX.Element {
  const outcomeRecorded = useAppStore((s) => s.outcomeRecorded);
  const recordOutcome = useAppStore((s) => s.recordOutcome);

  return (
    <Card className="p-4">
      <h3 className="mb-1 text-xs uppercase tracking-wide text-text-muted">Après impression</h3>
      {outcomeRecorded ? (
        <p className="text-sm text-confidence-high">Merci ! LayerAI affinera ses futures recommandations avec ce retour.</p>
      ) : (
        <>
          <p className="mb-2 text-[11px] text-text-muted">Dites-nous comment ça s'est passé pour améliorer les prochaines suggestions.</p>
          <div className="flex flex-wrap gap-1.5">
            {OUTCOMES.map((o) => (
              <button
                key={o.id}
                onClick={() => void recordOutcome(o.id)}
                className="rounded-full border border-border-subtle bg-surface-2 px-3 py-1 text-xs text-text-secondary hover:border-prusa-orange hover:text-text-primary"
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
