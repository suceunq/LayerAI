import type { CrealityProfileSet } from "./loader.js";
import { BambuResolver, firstValue, numericValue } from "../bambu/resolver.js";
import type { CuratedPrinter, CuratedFilament, CuratedPresetRange } from "../curator.js";

/** Creality stores printable_area as one comma-joined "XxY" string, unlike Bambu's array-of-strings. */
function parseBedShapeCsv(value: string): { x: number; y: number }[] {
  return value.split(",").map((pair) => {
    const [xs, ys] = pair.split("x");
    return { x: parseFloat(xs ?? "0"), y: parseFloat(ys ?? "0") };
  });
}

function parseNozzleDiameters(resolved: Record<string, unknown>): number[] {
  const raw = resolved.nozzle_diameter;
  const values = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(";") : [];
  return Array.from(new Set(values.map((v) => parseFloat(String(v))).filter((n) => !Number.isNaN(n)))).sort((a, b) => a - b);
}

export function curateCrealityPrintersAndPresets(profiles: CrealityProfileSet): {
  printers: CuratedPrinter[];
  presets: CuratedPresetRange[];
} {
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
    // Only curate one representative nozzle variant per model (the default 0.4mm), same heuristic
    // as the Prusa and Bambu curators - avoids emitting near-duplicate nozzle-size entries.
    const printerVariant = firstValue(resolved, "printer_variant");
    if (printerVariant !== "0.4") continue;

    const modelInfo = profiles.machineModels.get(printerModelName);
    const bedShapeRaw = firstValue(resolved, "printable_area");
    const bedShape = bedShapeRaw ? parseBedShapeCsv(bedShapeRaw) : [];
    if (bedShape.length === 0) continue;

    const nozzleDiametersMm = parseNozzleDiameters(resolved);
    const maxPrintHeightMm = numericValue(resolved, "printable_height", 250);
    const minLayerHeightMm = numericValue(resolved, "min_layer_height", 0.08);
    const maxLayerHeightMm = numericValue(resolved, "max_layer_height", 0.28);

    printers.push({
      id: name.replace(/\s+/g, "_").toUpperCase(),
      name: printerModelName,
      vendor: "Creality",
      family: (modelInfo?.family as string) ?? "Creality",
      technology: "FFF",
      bedShape,
      maxPrintHeightMm,
      nozzleDiametersMm: nozzleDiametersMm.length > 0 ? nozzleDiametersMm : [0.4],
      defaultNozzleDiameterMm: nozzleDiametersMm.includes(0.4) ? 0.4 : (nozzleDiametersMm[0] ?? 0.4),
      hasMmu: false,
      isInputShaper: false,
      thumbnail: undefined,
      bedTextureSvg: undefined,
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

interface CrealityFilamentSource {
  id: string;
  sectionName: string;
  isFlexible?: boolean;
}

/** One representative "@Creality K2 Plus" (flagship printer, widest material range) profile per
 * base material, mirroring the Bambu curator's "@BBL X1C" approach. */
const CURATED_CREALITY_FILAMENT_SOURCES: CrealityFilamentSource[] = [
  { id: "CREALITY_PLA", sectionName: "CR-PLA @Creality K2 Plus 0.4 nozzle" },
  { id: "CREALITY_PETG", sectionName: "CR-PETG @Creality K2 Plus 0.4 nozzle" },
  { id: "CREALITY_ASA", sectionName: "Generic ASA @Creality K2 Plus 0.4 nozzle" },
  { id: "CREALITY_ABS", sectionName: "CR-ABS @Creality K2 Plus 0.4 nozzle" },
  { id: "CREALITY_PC", sectionName: "Generic PC @Creality K2 Plus 0.4 nozzle" },
  { id: "CREALITY_TPU", sectionName: "CR-TPU @Creality K2 Plus 0.4 nozzle", isFlexible: true },
  { id: "CREALITY_PVA", sectionName: "Generic PVA @Creality K2 Plus 0.4 nozzle" },
  { id: "CREALITY_PA", sectionName: "CR-Nylon @Creality K2 Plus 0.4 nozzle" },
  { id: "CREALITY_PA_CF", sectionName: "Generic PA-CF @Creality K2 Plus 0.4 nozzle" },
  { id: "CREALITY_PLA_CF", sectionName: "Generic PLA-CF @Creality K2 Plus 0.4 nozzle" },
  { id: "CREALITY_PETG_CF", sectionName: "Generic PETG-CF @Creality K2 Plus 0.4 nozzle" },
];

export function curateCrealityFilaments(profiles: CrealityProfileSet): CuratedFilament[] {
  const resolver = new BambuResolver({ filament: profiles.filaments });
  const filaments: CuratedFilament[] = [];

  for (const source of CURATED_CREALITY_FILAMENT_SOURCES) {
    let resolved: Record<string, unknown>;
    try {
      resolved = resolver.resolve("filament", source.sectionName);
    } catch {
      continue;
    }

    const materialType = firstValue(resolved, "filament_type") ?? source.id;
    const vendor = firstValue(resolved, "filament_vendor") ?? "Creality";
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
      notes: `Derived from CrealityPrint profile [filament:${source.sectionName}]`,
      sourceSection: source.sectionName,
    });
  }

  return filaments;
}
