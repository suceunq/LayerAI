import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { BambuProfileSet } from "./loader.js";
import { BambuResolver, firstValue, numericValue } from "./resolver.js";
import type { CuratedPrinter, CuratedFilament, CuratedPresetRange } from "../curator.js";

function parseBedShapeArray(values: string[]): { x: number; y: number }[] {
  return values.map((pair) => {
    const [xs, ys] = pair.split("x");
    return { x: parseFloat(xs ?? "0"), y: parseFloat(ys ?? "0") };
  });
}

function parseNozzleDiameters(resolved: Record<string, unknown>): number[] {
  const raw = resolved.nozzle_diameter;
  const values = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(";") : [];
  return Array.from(new Set(values.map((v) => parseFloat(String(v))).filter((n) => !Number.isNaN(n)))).sort((a, b) => a - b);
}

function readBedTextureSvg(bblRoot: string, fileName: string | undefined): string | undefined {
  if (!fileName) return undefined;
  try {
    return readFileSync(join(bblRoot, fileName), "utf-8");
  } catch {
    return undefined;
  }
}

export function curateBambuPrintersAndPresets(
  profiles: BambuProfileSet,
  bblRoot: string
): { printers: CuratedPrinter[]; presets: CuratedPresetRange[] } {
  const resolver = new BambuResolver({ machine: profiles.machines });
  const printers: CuratedPrinter[] = [];
  const presets: CuratedPresetRange[] = [];

  for (const [name, raw] of profiles.machines) {
    if (raw.instantiation !== "true") continue;

    let resolved: Record<string, unknown>;
    try {
      resolved = resolver.resolve("machine", name);
    } catch {
      continue;
    }

    const printerModelName = firstValue(resolved, "printer_model");
    if (!printerModelName) continue;
    // Only curate one representative nozzle variant per model (the default 0.4mm), mirroring the
    // Prusa curation approach - avoids emitting dozens of near-duplicate nozzle-size entries.
    const printerVariant = firstValue(resolved, "printer_variant");
    if (printerVariant !== "0.4") continue;

    const modelInfo = profiles.machineModels.get(printerModelName);
    const bedShapeRaw = resolved.printable_area;
    const bedShape = Array.isArray(bedShapeRaw) ? parseBedShapeArray(bedShapeRaw as string[]) : [];
    if (bedShape.length === 0) continue;

    const nozzleDiametersMm = parseNozzleDiameters(resolved);
    const maxPrintHeightMm = numericValue(resolved, "printable_height", 250);
    const minLayerHeightMm = numericValue(resolved, "min_layer_height", 0.08);
    const maxLayerHeightMm = numericValue(resolved, "max_layer_height", 0.28);

    printers.push({
      id: name.replace(/\s+/g, "_").toUpperCase(),
      name: printerModelName,
      vendor: "Bambu Lab",
      family: (modelInfo?.family as string) ?? "Bambu Lab",
      technology: "FFF",
      bedShape,
      maxPrintHeightMm,
      nozzleDiametersMm: nozzleDiametersMm.length > 0 ? nozzleDiametersMm : [0.4],
      defaultNozzleDiameterMm: nozzleDiametersMm.includes(0.4) ? 0.4 : (nozzleDiametersMm[0] ?? 0.4),
      hasMmu: false,
      isInputShaper: false,
      thumbnail: undefined,
      bedTextureSvg: readBedTextureSvg(bblRoot, modelInfo?.bed_texture as string | undefined),
    });

    presets.push({
      printerId: name.replace(/\s+/g, "_").toUpperCase(),
      minLayerHeightMm,
      maxLayerHeightMm,
      standardLayerHeightsMm: [0.1, 0.15, 0.2, 0.25, 0.3].filter((h) => h >= minLayerHeightMm && h <= maxLayerHeightMm),
    });
  }

  return { printers, presets };
}

interface BambuFilamentSource {
  id: string;
  sectionName: string;
  isFlexible?: boolean;
}

/** One representative "@BBL X1C" (flagship printer) profile per base material - X1C supports the widest material range, so it has an entry for nearly everything. */
const CURATED_BAMBU_FILAMENT_SOURCES: BambuFilamentSource[] = [
  { id: "BAMBU_PLA", sectionName: "Bambu PLA Basic @BBL X1C" },
  { id: "BAMBU_PETG", sectionName: "Bambu PETG Basic @BBL X1C" },
  { id: "BAMBU_ASA", sectionName: "Bambu ASA @BBL X1C" },
  { id: "BAMBU_ABS", sectionName: "Bambu ABS @BBL X1C" },
  { id: "BAMBU_PC", sectionName: "Bambu PC @BBL X1C" },
  { id: "BAMBU_TPU", sectionName: "Bambu TPU 95A @BBL X1C", isFlexible: true },
  { id: "BAMBU_PVA", sectionName: "Bambu PVA @BBL X1C" },
  { id: "BAMBU_PA_CF", sectionName: "Bambu PAHT-CF @BBL X1C" },
  { id: "BAMBU_PLA_CF", sectionName: "Bambu PLA-CF @BBL X1C" },
  { id: "BAMBU_PETG_CF", sectionName: "Bambu PETG-CF @BBL X1C" },
];

export function curateBambuFilaments(profiles: BambuProfileSet): CuratedFilament[] {
  const resolver = new BambuResolver({ filament: profiles.filaments });
  const filaments: CuratedFilament[] = [];

  for (const source of CURATED_BAMBU_FILAMENT_SOURCES) {
    let resolved: Record<string, unknown>;
    try {
      resolved = resolver.resolve("filament", source.sectionName);
    } catch {
      continue;
    }

    const materialType = firstValue(resolved, "filament_type") ?? source.id;
    const vendor = firstValue(resolved, "filament_vendor") ?? "Bambu Lab";
    const bedTempC =
      numericValue(resolved, "textured_plate_temp", NaN) ||
      numericValue(resolved, "hot_plate_temp", NaN) ||
      numericValue(resolved, "cool_plate_temp", 55);

    filaments.push({
      id: source.id,
      name: `${vendor} ${materialType}`,
      materialType,
      densityGCm3: numericValue(resolved, "filament_density", 1.24),
      diameterMm: numericValue(resolved, "filament_diameter", 1.75),
      defaultNozzleTempC: numericValue(resolved, "nozzle_temperature", 220),
      defaultFirstLayerNozzleTempC: numericValue(resolved, "nozzle_temperature_initial_layer", numericValue(resolved, "nozzle_temperature", 220)),
      defaultBedTempC: bedTempC,
      defaultFirstLayerBedTempC: bedTempC,
      costPerKg: numericValue(resolved, "filament_cost", 0) || undefined,
      isFlexible: source.isFlexible ?? false,
      isAbrasive: /CF|GF/.test(materialType),
      notes: `Derived from BambuStudio profile [filament:${source.sectionName}]`,
      sourceSection: source.sectionName,
    });
  }

  return filaments;
}
