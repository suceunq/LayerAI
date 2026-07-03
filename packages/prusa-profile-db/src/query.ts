import type { PrinterProfile, FilamentProfile } from "@layerai/shared-types";
import { printers, filaments, presets, meta } from "./loader.js";
import type { PrinterLayerHeightRange } from "./schema.js";

export function getAllPrinters(): PrinterProfile[] {
  return printers;
}

export function getPrinterModel(id: string): PrinterProfile | undefined {
  return printers.find((p) => p.id === id);
}

export function getAllFilaments(): FilamentProfile[] {
  return filaments;
}

export function getFilamentBase(id: string): FilamentProfile | undefined {
  return filaments.find((f) => f.id === id);
}

export function getLayerHeightRange(printerId: string): PrinterLayerHeightRange | undefined {
  return presets.find((p) => p.printerId === printerId);
}

export function getDbMeta() {
  return meta;
}
