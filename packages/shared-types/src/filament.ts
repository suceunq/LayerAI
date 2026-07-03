export interface FilamentProfile {
  /** Stable slug, e.g. "PLA", "PETG", "ASA". */
  id: string;
  name: string;
  /** PrusaSlicer filament_type value, e.g. "PLA", "PETG", "ASA", "TPU". */
  materialType: string;
  densityGCm3: number;
  diameterMm: number;
  defaultNozzleTempC: number;
  defaultFirstLayerNozzleTempC: number;
  defaultBedTempC: number;
  defaultFirstLayerBedTempC: number;
  costPerKg?: number;
  /** Rigid vs flexible affects retraction/speed defaults. */
  isFlexible: boolean;
  /** Abrasive (carbon/wood filled) affects nozzle/speed guidance. */
  isAbrasive: boolean;
  notes?: string;
}
