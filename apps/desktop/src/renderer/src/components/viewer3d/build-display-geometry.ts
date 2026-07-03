import * as THREE from "three";
import type { MeshGeometryData, OverhangFace } from "@layerai/shared-types";

const NORMAL_COLOR = new THREE.Color("#c9c9cf");
const OVERHANG_COLOR = new THREE.Color("#ff6600");

/**
 * Expands the (possibly indexed) analysis geometry into a flat triangle-soup BufferGeometry so
 * overhang coloring never bleeds across shared vertices between a flagged and an unflagged
 * triangle - each triangle gets its own 3 vertex color entries.
 */
export function buildDisplayGeometry(geometry: MeshGeometryData, overhangFaces: OverhangFace[]): THREE.BufferGeometry {
  const { positions, indices } = geometry;
  const triangleCount = indices ? Math.floor(indices.length / 3) : Math.floor(positions.length / 9);

  const overhangSet = new Set(overhangFaces.map((f) => f.triangleIndex));
  const outPositions = new Float32Array(triangleCount * 9);
  const outColors = new Float32Array(triangleCount * 9);

  for (let t = 0; t < triangleCount; t++) {
    const color = overhangSet.has(t) ? OVERHANG_COLOR : NORMAL_COLOR;
    for (let v = 0; v < 3; v++) {
      const srcVertexIndex = indices ? indices[t * 3 + v]! : t * 3 + v;
      const srcBase = srcVertexIndex * 3;
      const dstBase = (t * 3 + v) * 3;
      outPositions[dstBase] = positions[srcBase]!;
      outPositions[dstBase + 1] = positions[srcBase + 1]!;
      outPositions[dstBase + 2] = positions[srcBase + 2]!;
      outColors[dstBase] = color.r;
      outColors[dstBase + 1] = color.g;
      outColors[dstBase + 2] = color.b;
    }
  }

  const bufferGeometry = new THREE.BufferGeometry();
  bufferGeometry.setAttribute("position", new THREE.BufferAttribute(outPositions, 3));
  bufferGeometry.setAttribute("color", new THREE.BufferAttribute(outColors, 3));
  bufferGeometry.computeVertexNormals();
  return bufferGeometry;
}
