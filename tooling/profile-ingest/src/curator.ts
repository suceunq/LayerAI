import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { InheritResolver } from "./inherit-resolver.js";
import type { SectionsByType } from "./ini-parser.js";

/**
 * PrusaSlicer's own display names carry legacy/marketing verbiage ("Original ", "i3 ") and a
 * "&&"-joined alternate-name convention that reads poorly in a compact picker UI. Trimmed to a
 * plain "Prusa <model>" form.
 */
function cleanPrinterName(rawName: string): string {
  return rawName
    .replace(/^Original\s+/, "")
    .replace(/^Prusa\s+i3\s+/, "Prusa ")
    .replace(/\s*&&\s*/g, " / ")
    .trim();
}

export interface CuratedPrinter {
  id: string;
  name: string;
  vendor: string;
  family: string;
  technology: string;
  bedShape: { x: number; y: number }[];
  maxPrintHeightMm: number;
  nozzleDiametersMm: number[];
  defaultNozzleDiameterMm: number;
  hasMmu: boolean;
  isInputShaper: boolean;
  thumbnail?: string;
  /** Raw SVG markup of the official top-down bed texture, when available. Its viewBox maps 1:1 (stretched) onto the bed_shape bounding box - confirmed against PrusaSlicer's own SVGs (e.g. XL's texture is literally "360mm x 360mm" for a 360x360 bed). */
  bedTextureSvg?: string;
}

export interface CuratedFilament {
  id: string;
  name: string;
  materialType: string;
  densityGCm3: number;
  diameterMm: number;
  defaultNozzleTempC: number;
  defaultFirstLayerNozzleTempC: number;
  defaultBedTempC: number;
  defaultFirstLayerBedTempC: number;
  costPerKg?: number;
  isFlexible: boolean;
  isAbrasive: boolean;
  notes?: string;
  sourceSection: string;
}

export interface CuratedPresetRange {
  printerId: string;
  minLayerHeightMm: number;
  maxLayerHeightMm: number;
  standardLayerHeightsMm: number[];
}

function parseBedShape(value: string): { x: number; y: number }[] {
  return value.split(",").map((pair) => {
    const [xs, ys] = pair.trim().split("x");
    return { x: parseFloat(xs ?? "0"), y: parseFloat(ys ?? "0") };
  });
}

function parseNozzleVariants(value: string): number[] {
  return Array.from(
    new Set(
      value
        .split(";")
        .map((v) => v.trim().replace(/^HF/, ""))
        .map((v) => parseFloat(v))
        .filter((n) => !Number.isNaN(n))
    )
  ).sort((a, b) => a - b);
}

const STANDARD_LAYER_HEIGHTS_MM = [0.1, 0.15, 0.2, 0.25, 0.3];

function readBedTextureSvg(assetsDir: string, fileName: string | undefined): string | undefined {
  if (!fileName) return undefined;
  try {
    return readFileSync(join(assetsDir, fileName), "utf-8");
  } catch {
    return undefined;
  }
}

export function curatePrintersAndPresets(
  resolver: InheritResolver,
  sections: SectionsByType,
  assetsDir: string
): { printers: CuratedPrinter[]; presets: CuratedPresetRange[] } {
  const printerModelNames = resolver.concreteNamesOfType("printer_model");
  const concretePrinterNames = resolver.concreteNamesOfType("printer");

  // Resolve every concrete [printer:*] section once, indexed by printer_model + printer_variant,
  // so each printer_model block can pick its default-nozzle variant without re-resolving.
  const byModelVariant = new Map<string, Map<string, Record<string, string>>>();
  for (const name of concretePrinterNames) {
    let resolved: Record<string, string>;
    try {
      resolved = resolver.resolve("printer", name);
    } catch {
      continue;
    }
    const modelId = resolved.printer_model;
    const variant = resolved.printer_variant;
    if (!modelId || !variant) continue;
    if (!byModelVariant.has(modelId)) byModelVariant.set(modelId, new Map());
    byModelVariant.get(modelId)!.set(variant, resolved);
  }

  const printers: CuratedPrinter[] = [];
  const presets: CuratedPresetRange[] = [];

  for (const modelName of printerModelNames) {
    const modelKeys = sections.get("printer_model")!.get(modelName)!.keys;
    const variantsMap = byModelVariant.get(modelName);
    if (!variantsMap || variantsMap.size === 0) continue;

    const nozzleDiametersMm = parseNozzleVariants(modelKeys.variants ?? "0.4");
    const preferredOrder = ["0.4", "HF0.4", ...Array.from(variantsMap.keys())];
    const chosen = preferredOrder.map((v) => variantsMap.get(v)).find((v) => v !== undefined);
    if (!chosen) continue;

    printers.push({
      id: modelName,
      name: cleanPrinterName(modelKeys.name ?? modelName),
      vendor: "Prusa Research",
      family: modelKeys.family ?? modelName,
      technology: modelKeys.technology ?? "FFF",
      bedShape: parseBedShape(chosen.bed_shape ?? "0x0,250x0,250x210,0x210"),
      maxPrintHeightMm: parseFloat(chosen.max_print_height ?? "200"),
      nozzleDiametersMm: nozzleDiametersMm.length > 0 ? nozzleDiametersMm : [parseFloat(chosen.nozzle_diameter ?? "0.4")],
      defaultNozzleDiameterMm: nozzleDiametersMm.includes(0.4) ? 0.4 : (nozzleDiametersMm[0] ?? 0.4),
      hasMmu: /MMU/.test(modelName),
      isInputShaper: /IS(MMU\d)?$/.test(modelName),
      thumbnail: modelKeys.thumbnail,
      bedTextureSvg: readBedTextureSvg(assetsDir, modelKeys.bed_texture),
    });

    const minLayerHeightMm = parseFloat(chosen.min_layer_height ?? "0.05");
    const maxLayerHeightMm = parseFloat(chosen.max_layer_height ?? "0.3");
    presets.push({
      printerId: modelName,
      minLayerHeightMm,
      maxLayerHeightMm,
      standardLayerHeightsMm: STANDARD_LAYER_HEIGHTS_MM.filter(
        (h) => h >= minLayerHeightMm && h <= maxLayerHeightMm
      ),
    });
  }

  return { printers, presets };
}

interface CuratedFilamentSource {
  id: string;
  sectionName: string;
  isFlexible?: boolean;
}

/**
 * One representative concrete PrusaSlicer profile section per base material, chosen from
 * bare (non-printer-suffixed) entries so the resolved defaults aren't skewed by one specific
 * nozzle/printer combination.
 */
const CURATED_FILAMENT_SOURCES: CuratedFilamentSource[] = [
  { id: "PLA", sectionName: "Prusament PLA" },
  { id: "PETG", sectionName: "Prusament PETG" },
  { id: "ASA", sectionName: "Prusament ASA" },
  { id: "ABS", sectionName: "Generic ABS" },
  { id: "PC_BLEND", sectionName: "Prusament PC Blend" },
  { id: "HIPS", sectionName: "Generic HIPS" },
  { id: "TPU", sectionName: "NinjaTek NinjaFlex TPU", isFlexible: true },
  { id: "PVA", sectionName: "PrimaSelect PVA+" },
  { id: "PA", sectionName: "Fiberlogy Nylon PA12" },
];

/** Carbon-filled variants aren't cleanly represented by one bare PrusaResearch.ini section
 *  across vendors, so they're derived from their base material with hand-tuned deltas
 *  (hotter nozzle, abrasive flag) authored for LayerAI rather than sourced verbatim. */
const CARBON_FIBER_VARIANTS: { id: string; baseId: string; label: string }[] = [
  { id: "PLA_CF", baseId: "PLA", label: "PLA-CF" },
  { id: "PETG_CF", baseId: "PETG", label: "PETG-CF" },
  { id: "PA_CF", baseId: "PA", label: "PA-CF" },
];

export function curateFilaments(resolver: InheritResolver): CuratedFilament[] {
  const filaments: CuratedFilament[] = [];

  for (const source of CURATED_FILAMENT_SOURCES) {
    let resolved: Record<string, string>;
    try {
      resolved = resolver.resolve("filament", source.sectionName);
    } catch {
      continue;
    }
    const materialType = resolved.filament_type ?? source.id;
    filaments.push({
      id: source.id,
      name: resolved.filament_vendor ? `${resolved.filament_vendor} ${materialType}` : source.sectionName,
      materialType,
      densityGCm3: parseFloat(resolved.filament_density ?? "1.24"),
      diameterMm: parseFloat(resolved.filament_diameter ?? "1.75"),
      defaultNozzleTempC: parseFloat(resolved.temperature ?? "210"),
      defaultFirstLayerNozzleTempC: parseFloat(resolved.first_layer_temperature ?? resolved.temperature ?? "210"),
      defaultBedTempC: parseFloat(resolved.bed_temperature ?? "60"),
      defaultFirstLayerBedTempC: parseFloat(resolved.first_layer_bed_temperature ?? resolved.bed_temperature ?? "60"),
      costPerKg: resolved.filament_cost ? parseFloat(resolved.filament_cost) : undefined,
      isFlexible: source.isFlexible ?? false,
      isAbrasive: false,
      notes: `Derived from PrusaSlicer profile section [filament:${source.sectionName}]`,
      sourceSection: source.sectionName,
    });
  }

  for (const variant of CARBON_FIBER_VARIANTS) {
    const base = filaments.find((f) => f.id === variant.baseId);
    if (!base) continue;
    filaments.push({
      ...base,
      id: variant.id,
      name: `${base.name} Carbon Fiber`,
      materialType: variant.label,
      defaultNozzleTempC: base.defaultNozzleTempC + 10,
      defaultFirstLayerNozzleTempC: base.defaultFirstLayerNozzleTempC + 10,
      isAbrasive: true,
      notes: `Heuristic LayerAI derivation of ${base.id} for a carbon-filled variant (not a direct PrusaSlicer profile section) - hardened nozzle recommended.`,
    });
  }

  return filaments;
}
