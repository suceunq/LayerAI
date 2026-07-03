import type { MeshGeometryData } from "@layerai/shared-types";

/**
 * Welds coincident vertices (by rounded position) into a shared-index representation. Required
 * for a correct 3MF export: PrusaSlicer's manifold/part detection is based on shared vertex
 * *indices*, not shared 3D positions, so triangle-soup input (e.g. from STL, where every
 * triangle owns 3 unique vertex slots even at identical coordinates) reads as N disconnected
 * open-edged parts unless indices are welded first.
 */
export function weldGeometry(geometry: MeshGeometryData, precision = 5): MeshGeometryData {
  const { positions, indices } = geometry;
  const sourceVertexCount = positions.length / 3;

  const weldedIndexOf = new Map<string, number>();
  const weldedPositions: number[] = [];
  const remap = new Array<number>(sourceVertexCount);

  for (let i = 0; i < sourceVertexCount; i++) {
    const base = i * 3;
    const x = positions[base]!;
    const y = positions[base + 1]!;
    const z = positions[base + 2]!;
    const key = `${x.toFixed(precision)}_${y.toFixed(precision)}_${z.toFixed(precision)}`;

    let weldedId = weldedIndexOf.get(key);
    if (weldedId === undefined) {
      weldedId = weldedPositions.length / 3;
      weldedPositions.push(x, y, z);
      weldedIndexOf.set(key, weldedId);
    }
    remap[i] = weldedId;
  }

  const sourceIndices = indices ?? Array.from({ length: sourceVertexCount }, (_, i) => i);
  const weldedIndices = sourceIndices.map((i) => remap[i]!);

  return { positions: weldedPositions, indices: weldedIndices };
}
