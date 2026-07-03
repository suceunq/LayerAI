import JSZip from "jszip";
import type { MeshGeometryData } from "@layerai/shared-types";

const VERTEX_RE = /<vertex\s+x="([^"]+)"\s+y="([^"]+)"\s+z="([^"]+)"\s*\/>/g;
const TRIANGLE_RE = /<triangle\s+v1="(\d+)"\s+v2="(\d+)"\s+v3="(\d+)"[^/]*\/>/g;

/**
 * Minimal 3MF reader: unzips the package and regex-extracts the first object's vertices/
 * triangles from 3D/3dmodel.model. Deliberately narrow - it reads back exactly the shape LayerAI
 * itself writes (see @layerai/threemf-writer), not the full 3MF spec (multiple objects, build
 * item transforms, textures). Good enough for round-tripping LayerAI-authored or simple
 * single-object 3MF files; complex multi-part project files may only load their first object.
 */
export async function parseThreeMf(buffer: Uint8Array): Promise<MeshGeometryData> {
  const zip = await JSZip.loadAsync(buffer);
  const modelFile = zip.file("3D/3dmodel.model");
  if (!modelFile) throw new Error("Fichier .3mf invalide : 3D/3dmodel.model introuvable.");

  const xml = await modelFile.async("string");

  const positions: number[] = [];
  for (const match of xml.matchAll(VERTEX_RE)) {
    positions.push(parseFloat(match[1]!), parseFloat(match[2]!), parseFloat(match[3]!));
  }

  const indices: number[] = [];
  for (const match of xml.matchAll(TRIANGLE_RE)) {
    indices.push(parseInt(match[1]!, 10), parseInt(match[2]!, 10), parseInt(match[3]!, 10));
  }

  if (positions.length === 0 || indices.length === 0) {
    throw new Error("Fichier .3mf invalide : aucun maillage exploitable trouvé.");
  }

  return { positions, indices };
}
