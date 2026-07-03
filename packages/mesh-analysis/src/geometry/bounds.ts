import { Vector3 } from "three";
import type { BoundingBox3, MeshGeometryData } from "@layerai/shared-types";
import { forEachTriangle, getTriangleCount } from "./triangles.js";
import { convexHull2d, polygonArea, type Point2 } from "./convex-hull-2d.js";

export function computeBoundingBox(geometry: MeshGeometryData): BoundingBox3 {
  const min = new Vector3(Infinity, Infinity, Infinity);
  const max = new Vector3(-Infinity, -Infinity, -Infinity);
  const { positions } = geometry;
  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]!;
    const y = positions[i + 1]!;
    const z = positions[i + 2]!;
    if (x < min.x) min.x = x;
    if (y < min.y) min.y = y;
    if (z < min.z) min.z = z;
    if (x > max.x) max.x = x;
    if (y > max.y) max.y = y;
    if (z > max.z) max.z = z;
  }
  return { min: { x: min.x, y: min.y, z: min.z }, max: { x: max.x, y: max.y, z: max.z } };
}

/**
 * Signed-tetrahedron-sum volume and center of mass, assuming the mesh is a closed manifold with
 * consistent winding. This is the standard formula: decompose the mesh into tetrahedra formed by
 * each triangle and the origin, sum their signed volumes and volume-weighted centroids.
 */
export function computeVolumeAndCenterOfMass(geometry: MeshGeometryData): { volumeMm3: number; centerOfMass: Vector3 } {
  let volumeSum = 0;
  const centroidSum = new Vector3();

  forEachTriangle(geometry, (v0, v1, v2) => {
    const signedVolume = v0.dot(new Vector3().crossVectors(v1, v2)) / 6;
    const tetraCentroid = new Vector3().add(v0).add(v1).add(v2).multiplyScalar(0.25);
    centroidSum.addScaledVector(tetraCentroid, signedVolume);
    volumeSum += signedVolume;
  });

  if (Math.abs(volumeSum) < 1e-9) {
    return { volumeMm3: 0, centerOfMass: new Vector3() };
  }

  return {
    volumeMm3: Math.abs(volumeSum),
    centerOfMass: centroidSum.divideScalar(volumeSum),
  };
}

export function computeFootprintPolygon(geometry: MeshGeometryData): Point2[] {
  const points: Point2[] = [];
  const { positions } = geometry;
  for (let i = 0; i < positions.length; i += 3) {
    points.push({ x: positions[i]!, y: positions[i + 1]! });
  }
  return convexHull2d(points);
}

export function computeFootprintAreaMm2(geometry: MeshGeometryData): number {
  return polygonArea(computeFootprintPolygon(geometry));
}

/**
 * Approximates manifoldness by welding vertices to a small position tolerance and checking that
 * every resulting edge is shared by exactly two triangles. STL triangle-soup data has no shared
 * vertex indices, so position-based welding is required rather than an index-based edge check.
 */
export function estimateManifoldRatio(geometry: MeshGeometryData): number {
  const weldedIndexOf = new Map<string, number>();
  const keyFor = (x: number, y: number, z: number): string =>
    `${x.toFixed(3)}_${y.toFixed(3)}_${z.toFixed(3)}`;

  const edgeCounts = new Map<string, number>();
  let edgeTotal = 0;

  forEachTriangle(geometry, (v0, v1, v2) => {
    const ids = [v0, v1, v2].map((v) => {
      const key = keyFor(v.x, v.y, v.z);
      let id = weldedIndexOf.get(key);
      if (id === undefined) {
        id = weldedIndexOf.size;
        weldedIndexOf.set(key, id);
      }
      return id;
    });

    for (let e = 0; e < 3; e++) {
      const a = ids[e]!;
      const b = ids[(e + 1) % 3]!;
      const edgeKey = a < b ? `${a}_${b}` : `${b}_${a}`;
      edgeCounts.set(edgeKey, (edgeCounts.get(edgeKey) ?? 0) + 1);
      edgeTotal++;
    }
  });

  if (edgeTotal === 0) return 0;
  let wellFormedEdges = 0;
  for (const count of edgeCounts.values()) {
    if (count === 2) wellFormedEdges += 2;
  }
  return wellFormedEdges / edgeTotal;
}

export function computeComplexityScore(geometry: MeshGeometryData, footprintAreaMm2: number, boundingBox: BoundingBox3): number {
  const triangleCount = getTriangleCount(geometry);
  const bboxVolume =
    (boundingBox.max.x - boundingBox.min.x) * (boundingBox.max.y - boundingBox.min.y) * (boundingBox.max.z - boundingBox.min.z);
  const triangleDensity = bboxVolume > 0 ? triangleCount / bboxVolume : 0;
  const footprintFactor = footprintAreaMm2 > 0 ? Math.min(1, 2000 / footprintAreaMm2) : 1;
  return Math.max(0, Math.min(1, Math.log10(triangleDensity + 1) / 4 + footprintFactor * 0.1));
}
