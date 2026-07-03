import { Vector3 } from "three";
import type { MeshGeometryData } from "@layerai/shared-types";

export function getTriangleCount(geometry: MeshGeometryData): number {
  const count = geometry.indices ? geometry.indices.length : geometry.positions.length / 3;
  return Math.floor(count / 3);
}

function readVertex(positions: number[], vertexIndex: number, out: Vector3): Vector3 {
  const base = vertexIndex * 3;
  return out.set(positions[base] ?? 0, positions[base + 1] ?? 0, positions[base + 2] ?? 0);
}

/** Iterates every triangle in the mesh, reusing scratch vectors for allocation-free traversal. */
export function forEachTriangle(
  geometry: MeshGeometryData,
  callback: (v0: Vector3, v1: Vector3, v2: Vector3, triangleIndex: number) => void
): void {
  const { positions, indices } = geometry;
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const triangleCount = getTriangleCount(geometry);

  for (let t = 0; t < triangleCount; t++) {
    if (indices) {
      readVertex(positions, indices[t * 3]!, a);
      readVertex(positions, indices[t * 3 + 1]!, b);
      readVertex(positions, indices[t * 3 + 2]!, c);
    } else {
      const base = t * 9;
      a.set(positions[base] ?? 0, positions[base + 1] ?? 0, positions[base + 2] ?? 0);
      b.set(positions[base + 3] ?? 0, positions[base + 4] ?? 0, positions[base + 5] ?? 0);
      c.set(positions[base + 6] ?? 0, positions[base + 7] ?? 0, positions[base + 8] ?? 0);
    }
    callback(a, b, c, t);
  }
}

export function triangleNormal(v0: Vector3, v1: Vector3, v2: Vector3, out: Vector3): Vector3 {
  const edge1 = new Vector3().subVectors(v1, v0);
  const edge2 = new Vector3().subVectors(v2, v0);
  return out.crossVectors(edge1, edge2).normalize();
}

export function triangleArea(v0: Vector3, v1: Vector3, v2: Vector3): number {
  const edge1 = new Vector3().subVectors(v1, v0);
  const edge2 = new Vector3().subVectors(v2, v0);
  return new Vector3().crossVectors(edge1, edge2).length() / 2;
}
