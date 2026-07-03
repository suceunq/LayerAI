import type { MeshGeometryData } from "./mesh.js";
import type { GeneratedConfig } from "./config.js";
import type { IntentTag } from "./intent.js";

export type ImportedModelFormat = "stl" | "obj" | "3mf";

export interface ImportedModel {
  fileName: string;
  format: ImportedModelFormat;
  geometry: MeshGeometryData;
}

export type PrintOutcomeId =
  | "perfect"
  | "too_fragile"
  | "supports_difficult"
  | "detachment"
  | "warping"
  | "poor_quality";

export interface PrintOutcomeRecord {
  id: string;
  /** ISO 8601 timestamp. */
  timestamp: string;
  geometrySignature: string;
  printerId: string;
  filamentId: string;
  intentTags: IntentTag[];
  configUsed: GeneratedConfig;
  outcome: PrintOutcomeId;
  notes?: string;
}
