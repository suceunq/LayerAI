import { useState } from "react";
import type { PrintOutcomeId } from "@layerai/shared-types";
import { useAppStore } from "../state/useAppStore.js";
import { useTranslation } from "../i18n/useTranslation.js";

const OUTCOME_KEYS: { id: PrintOutcomeId; key: string }[] = [
  { id: "perfect", key: "outcome.perfect" },
  { id: "too_fragile", key: "outcome.tooFragile" },
  { id: "supports_difficult", key: "outcome.supportsDifficult" },
  { id: "detachment", key: "outcome.detachment" },
  { id: "warping", key: "outcome.warping" },
  { id: "poor_quality", key: "outcome.poorQuality" },
];

/** Progressive disclosure: collapsed by default since there's nothing to report until the user has actually printed. */
export function OutcomeTagging(): React.JSX.Element {
  const outcomeRecorded = useAppStore((s) => s.outcomeRecorded);
  const recordOutcome = useAppStore((s) => s.recordOutcome);
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (outcomeRecorded) {
    return <p className="text-xs text-confidence-high">{t("outcome.thanks")}</p>;
  }

  if (!expanded) {
    return (
      <button onClick={() => setExpanded(true)} className="self-start text-xs text-text-muted hover:text-accent">
        {t("outcome.linkCollapsed")}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] text-text-muted">{t("outcome.question")}</p>
      <div className="flex flex-wrap gap-1.5">
        {OUTCOME_KEYS.map((o) => (
          <button
            key={o.id}
            onClick={() => void recordOutcome(o.id)}
            className="rounded-full border border-border-subtle bg-surface-2 px-3 py-1 text-xs text-text-secondary hover:border-accent hover:text-text-primary"
          >
            {t(o.key)}
          </button>
        ))}
      </div>
    </div>
  );
}
