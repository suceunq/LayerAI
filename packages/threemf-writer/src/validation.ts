import JSZip from "jszip";
import type { MeshGeometryData } from "@layerai/shared-types";

const REQUIRED_3MF_FILES = ["[Content_Types].xml", "_rels/.rels", "3D/3dmodel.model"] as const;

export function validateMeshGeometry(geometry: MeshGeometryData): void {
  if (geometry.positions.length === 0 || geometry.positions.length % 3 !== 0) {
    throw new Error("Géométrie invalide : la liste des sommets doit contenir des coordonnées XYZ complètes.");
  }
  if (geometry.positions.some((value) => !Number.isFinite(value))) {
    throw new Error("Géométrie invalide : un sommet contient une coordonnée non finie.");
  }
  const vertexCount = geometry.positions.length / 3;
  if (geometry.indices) {
    if (geometry.indices.length === 0 || geometry.indices.length % 3 !== 0) {
      throw new Error("Géométrie invalide : les indices doivent former des triangles complets.");
    }
    if (geometry.indices.some((index) => !Number.isInteger(index) || index < 0 || index >= vertexCount)) {
      throw new Error("Géométrie invalide : un triangle référence un sommet inexistant.");
    }
  } else if (vertexCount % 3 !== 0) {
    throw new Error("Géométrie invalide : le maillage sans indices doit contenir trois sommets par triangle.");
  }
}

export async function validateThreeMf(bytes: Uint8Array): Promise<void> {
  if (bytes.byteLength < 100) throw new Error("Export 3MF invalide : archive vide ou tronquée.");
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
  } catch (error) {
    throw new Error(`Export 3MF invalide : archive ZIP illisible (${error instanceof Error ? error.message : String(error)}).`);
  }
  for (const path of REQUIRED_3MF_FILES) {
    if (!zip.file(path)) throw new Error(`Export 3MF invalide : fichier obligatoire manquant (${path}).`);
  }
  const model = await zip.file("3D/3dmodel.model")!.async("string");
  if (!model.includes("<model") || !model.includes("<vertices>") || !model.includes("<triangles>")) {
    throw new Error("Export 3MF invalide : modèle XML incomplet.");
  }
  if (!/<vertex\s+x="[^"]+"\s+y="[^"]+"\s+z="[^"]+"/.test(model) || !/<triangle\s+v1="\d+"\s+v2="\d+"\s+v3="\d+"/.test(model)) {
    throw new Error("Export 3MF invalide : aucun sommet ou triangle exploitable.");
  }
  const hasPrusaConfig = Boolean(zip.file("Metadata/Slic3r_PE.config"));
  const hasBambuConfig = Boolean(zip.file("Metadata/print_profile.config"));
  if (!hasPrusaConfig && !hasBambuConfig) throw new Error("Export 3MF invalide : profil d’impression manquant.");
}

export function validateStandaloneIniText(text: string): void {
  const entries = text.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith("#"));
  if (entries.length === 0 || entries.some((line) => !/^[A-Za-z0-9_]+\s*=\s*.+$/.test(line))) {
    throw new Error("Profil INI invalide : une ou plusieurs lignes ne sont pas au format clé = valeur.");
  }
  for (const required of ["printer_model", "nozzle_diameter", "filament_type"]) {
    if (!entries.some((line) => line.startsWith(`${required} =`))) throw new Error(`Profil INI invalide : paramètre obligatoire manquant (${required}).`);
  }
}

export function validateStandaloneBambuJsonText(text: string): void {
  let profile: unknown;
  try { profile = JSON.parse(text); } catch { throw new Error("Profil JSON invalide : document illisible."); }
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) throw new Error("Profil JSON invalide : objet attendu.");
  const value = profile as Record<string, unknown>;
  for (const required of ["type", "name", "from", "printer_model", "nozzle_diameter", "filament_type"]) {
    if (typeof value[required] !== "string" || !value[required]) throw new Error(`Profil JSON invalide : champ obligatoire manquant (${required}).`);
  }
  if (value.type !== "process" || value.from !== "User") throw new Error("Profil JSON invalide : type de preset incompatible.");
}
