import { useState } from "react";
import type { PrintOutcomeId } from "@layerai/shared-types";
import { useAppStore } from "../state/useAppStore.js";

const OUTCOMES: { id: PrintOutcomeId; label: string }[] = [
  { id: "perfect", label: "Impression parfaite" },
  { id: "too_fragile", label: "Trop fragile" },
  { id: "supports_difficult", label: "Supports difficiles" },
  { id: "detachment", label: "Décollement" },
  { id: "warping", label: "Warping" },
  { id: "poor_quality", label: "Mauvaise qualité" },
];

/** Progressive disclosure: collapsed by default since there's nothing to report until the user has actually printed. */
export function OutcomeTagging(): React.JSX.Element {
  const outcomeRecorded = useAppStore((s) => s.outcomeRecorded);
  const recordOutcome = useAppStore((s) => s.recordOutcome);
  const [expanded, setExpanded] = useState(false);

  if (outcomeRecorded) {
    return <p className="text-xs text-confidence-high">Merci pour ce retour, LayerAI en tiendra compte pour ses prochaines suggestions.</p>;
  }

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="self-start text-xs text-text-muted hover:text-prusa-orange">
        ▸ J'ai déjà imprimé ce modèle, donner un retour
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] text-text-muted">Comment ça s'est passé ?</p>
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
    </div>
  );
}
