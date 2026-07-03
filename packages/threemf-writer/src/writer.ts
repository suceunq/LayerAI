import JSZip from "jszip";
import type { FilamentProfile, GeneratedConfig, MeshGeometryData, PrinterProfile } from "@layerai/shared-types";
import { CONTENT_TYPES_XML, ROOT_RELS_XML } from "./opc-fixed-parts.js";
import { buildModelXml } from "./model-xml.js";
import { buildPrintConfigText } from "./config-writer.js";
import { weldGeometry } from "./weld.js";

export interface BuildThreeMfInput {
  geometry: MeshGeometryData;
  config: GeneratedConfig;
  printer: PrinterProfile;
  filament: FilamentProfile;
  objectName?: string;
}

export async function buildThreeMf(input: BuildThreeMfInput): Promise<Uint8Array> {
  const { geometry, config, printer, filament, objectName = "LayerAI part" } = input;

  const weldedGeometry = weldGeometry(geometry);

  const zip = new JSZip();
  zip.file("[Content_Types].xml", CONTENT_TYPES_XML);
  zip.file("_rels/.rels", ROOT_RELS_XML);
  zip.file("3D/3dmodel.model", buildModelXml(weldedGeometry, objectName));
  zip.file("Metadata/Slic3r_PE.config", buildPrintConfigText(config, printer, filament));

  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}
