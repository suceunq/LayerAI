export interface BedShapePoint {
  x: number;
  y: number;
}

export type PrinterTechnology = "FFF" | "SLA";

export interface PrinterProfile {
  /** Stable slug, e.g. "MK4S". Matches the source vendor's printer_model id. */
  id: string;
  /** Display name, e.g. "Prusa MK4S". */
  name: string;
  /** Vendor/brand grouping, e.g. "Prusa Research", "Bambu Lab". */
  vendor: string;
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
  /** Raw SVG markup of the official top-down bed texture, when available. Its viewBox maps 1:1 (stretched) onto bedShape's bounding box. */
  bedTextureSvg?: string;
}
