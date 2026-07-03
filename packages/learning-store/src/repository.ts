import type { IntentTag, PrintOutcomeId, PrintOutcomeRecord } from "@layerai/shared-types";
import type { LearningDb } from "./db.js";

export function insertOutcome(db: LearningDb, record: PrintOutcomeRecord): void {
  db.insert(record);
}

export function listOutcomes(db: LearningDb): PrintOutcomeRecord[] {
  return db.all();
}

export interface OutcomeStats {
  total: number;
  byOutcome: Partial<Record<PrintOutcomeId, number>>;
}

/**
 * Aggregates past outcomes for the same printer+filament where the recorded job shared at least
 * one of the given intent tags - a pragmatic proxy for "similar situation" without requiring an
 * exact geometry match, which would rarely occur twice.
 */
export function getOutcomeStats(db: LearningDb, printerId: string, filamentId: string, intentTags: IntentTag[]): OutcomeStats {
  const rows = db.filterByPrinterAndFilament(printerId, filamentId);
  const relevant = intentTags.length === 0 ? rows : rows.filter((r) => r.intentTags.some((t) => intentTags.includes(t)));

  const byOutcome: Partial<Record<PrintOutcomeId, number>> = {};
  for (const row of relevant) {
    byOutcome[row.outcome] = (byOutcome[row.outcome] ?? 0) + 1;
  }

  return { total: relevant.length, byOutcome };
}
