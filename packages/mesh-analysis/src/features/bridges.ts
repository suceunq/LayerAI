import type { BridgeRegion, OverhangFace, MeshGeometryData } from "@layerai/shared-types";
import { forEachTriangle } from "../geometry/triangles.js";

const NEAR_FLAT_THRESHOLD_DEG = 80;
const CLUSTER_CELL_SIZE_MM = 5;
const MIN_CLUSTER_AREA_MM2 = 25;

interface FaceCentroid {
  x: number;
  y: number;
  z: number;
  areaMm2: number;
}

/**
 * Clusters near-flat downward-facing overhang triangles (already detected by detectOverhangs)
 * into spatially contiguous regions via grid-cell flood fill. Large clusters are treated as
 * bridge candidates - approximating "a span with no support directly beneath it" without a full
 * multi-layer heightfield reconstruction.
 */
export function detectBridges(geometry: MeshGeometryData, overhangFaces: OverhangFace[]): BridgeRegion[] {
  const candidates = overhangFaces.filter((f) => f.angleFromHorizontalDeg >= NEAR_FLAT_THRESHOLD_DEG);
  if (candidates.length === 0) return [];

  const centroids: FaceCentroid[] = [];
  const candidateIndexByTriangle = new Map<number, number>();
  candidates.forEach((f, i) => candidateIndexByTriangle.set(f.triangleIndex, i));

  forEachTriangle(geometry, (v0, v1, v2, triangleIndex) => {
    if (!candidateIndexByTriangle.has(triangleIndex)) return;
    const candidate = candidates[candidateIndexByTriangle.get(triangleIndex)!]!;
    centroids.push({
      x: (v0.x + v1.x + v2.x) / 3,
      y: (v0.y + v1.y + v2.y) / 3,
      z: (v0.z + v1.z + v2.z) / 3,
      areaMm2: candidate.areaMm2,
    });
  });

  const cellOf = (x: number, y: number): string => `${Math.floor(x / CLUSTER_CELL_SIZE_MM)}_${Math.floor(y / CLUSTER_CELL_SIZE_MM)}`;
  const cellToFaces = new Map<string, FaceCentroid[]>();
  for (const c of centroids) {
    const key = cellOf(c.x, c.y);
    if (!cellToFaces.has(key)) cellToFaces.set(key, []);
    cellToFaces.get(key)!.push(c);
  }

  const visited = new Set<string>();
  const regions: BridgeRegion[] = [];

  for (const startKey of cellToFaces.keys()) {
    if (visited.has(startKey)) continue;
    const stack = [startKey];
    const clusterFaces: FaceCentroid[] = [];
    const clusterCellKeys: string[] = [];

    while (stack.length > 0) {
      const key = stack.pop()!;
      if (visited.has(key)) continue;
      visited.add(key);
      const faces = cellToFaces.get(key);
      if (!faces) continue;
      clusterFaces.push(...faces);
      clusterCellKeys.push(key);

      const [cx, cy] = key.split("_").map(Number) as [number, number];
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          const neighborKey = `${cx + dx}_${cy + dy}`;
          if (cellToFaces.has(neighborKey) && !visited.has(neighborKey)) stack.push(neighborKey);
        }
      }
    }

    const totalArea = clusterFaces.reduce((sum, f) => sum + f.areaMm2, 0);
    if (totalArea < MIN_CLUSTER_AREA_MM2) continue;

    const weightedCenter = clusterFaces.reduce(
      (acc, f) => ({ x: acc.x + f.x * f.areaMm2, y: acc.y + f.y * f.areaMm2, z: acc.z + f.z * f.areaMm2 }),
      { x: 0, y: 0, z: 0 }
    );

    const spanMm = Math.sqrt(clusterCellKeys.length) * CLUSTER_CELL_SIZE_MM;

    regions.push({
      approxCenter: {
        x: weightedCenter.x / totalArea,
        y: weightedCenter.y / totalArea,
        z: weightedCenter.z / totalArea,
      },
      approxAreaMm2: totalArea,
      approxSpanMm: spanMm,
    });
  }

  return regions;
}
