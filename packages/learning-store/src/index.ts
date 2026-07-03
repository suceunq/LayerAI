export { openLearningDb, LearningDb } from "./db.js";
export { insertOutcome, listOutcomes, getOutcomeStats } from "./repository.js";
export type { OutcomeStats } from "./repository.js";
export { computeAdjustments } from "./weighting.js";
export type { LearningAdjustment } from "./weighting.js";
export { computeGeometrySignature } from "./signature.js";
