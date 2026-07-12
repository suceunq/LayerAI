import JSZip from "jszip";
import type { FilamentProfile, GeneratedConfig, MeshGeometryData, PrinterProfile } from "@layerai/shared-types";
import { CONTENT_TYPES_XML, ROOT_RELS_XML } from "./opc-fixed-parts.js";
import { buildModelXml } from "./model-xml.js";
import { buildPrintConfigText, buildBambuPrintConfigText } from "./config-writer.js";
import { weldGeometry } from "./weld.js";

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

  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
