import JSZip from "jszip";
import type { FilamentProfile, GeneratedConfig, MeshGeometryData, PrinterProfile } from "@layerai/shared-types";
import { CONTENT_TYPES_XML, ROOT_RELS_XML } from "./opc-fixed-parts.js";
import { buildModelXml } from "./model-xml.js";
import { buildPrintConfigText, buildBambuPrintConfigText } from "./config-writer.js";
import { weldGeometry } from "./weld.js";
import { validateMeshGeometry, validateThreeMf } from "./validation.js";

export interface BuildThreeMfInput {
  geometry: MeshGeometryData;
  config: GeneratedConfig;
  printer: PrinterProfile;
  filament: FilamentProfile;
  objectName?: string;
  /** Bed-space centers for each copy to place, e.g. from computeGridArrangement. Defaults to a single centered copy. */
  positions?: { x: number; y: number }[];
}

function bedCenterOf(printer: PrinterProfile): { x: number; y: number } {
  const xs = printer.bedShape.map((p) => p.x);
  const ys = printer.bedShape.map((p) => p.y);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
}

export async function buildThreeMf(input: BuildThreeMfInput): Promise<Uint8Array> {
  const { geometry, config, printer, filament, objectName = "LayerAI part", positions = [bedCenterOf(printer)] } = input;

  validateMeshGeometry(geometry);
  if (positions.length === 0 || positions.some((position) => !Number.isFinite(position.x) || !Number.isFinite(position.y))) {
    throw new Error("Placement invalide : au moins une position XY finie est requise.");
  }

  const weldedGeometry = weldGeometry(geometry);

  const zip = new JSZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES_XML);
  zip.file("_rels/.rels", ROOT_RELS_XML);
  zip.file("3D/3dmodel.model", buildModelXml(weldedGeometry, objectName, positions));

  if (printer.vendor === "Bambu Lab" || printer.vendor === "Creality") {
    zip.file("Metadata/print_profile.config", buildBambuPrintConfigText(config, printer, filament));
  } else {
    zip.file("Metadata/Slic3r_PE.config", buildPrintConfigText(config, printer, filament));
  }

  const bytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  await validateThreeMf(bytes);
  return bytes;
}
