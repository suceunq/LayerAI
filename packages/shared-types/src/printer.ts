export interface BedShapePoint {
  x: number;
  y: number;
}

export type PrinterTechnology = "FFF" | "SLA";

export interface PrinterProfile {
  /** Stable slug, e.g. "MK4S". Matches the PrusaSlicer printer_model id. */
  id: string;
  /** Display name, e.g. "Original Prusa MK4S". */
  name: string;
  /** Model family grouping, e.g. "MK4", "XL", "CORE One", "MINI". */
  family: string;
  technology: PrinterTechnology;
  /** Build plate polygon in millimeters, in printer/bed coordinate space. */
  bedShape: BedShapePoint[];
  maxPrintHeightMm: number;
  nozzleDiametersMm: number[];
  defaultNozzleDiameterMm: number;
  hasMmu: boolean;
  isInputShaper: boolean;
  thumbnail?: string;
}
