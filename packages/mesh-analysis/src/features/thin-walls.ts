import { Vector3 } from "three";
import type { ThinWallRegion, MeshGeometryData } from "@layerai/shared-types";
import { forEachTriangle, getTriangleCount } from "../geometry/triangles.js";
import { rayTriangleDistance } from "../geometry/raycast.js";

const MAX_SAMPLES = 300;
const MAX_TRIANGLES_FOR_RAYCAST = 20000;
const DEFAULT_THICKNESS_THRESHOLD_MM = 0.8; // ~2x a 0.4mm nozzle

interface Triangle {
  v0: Vector3;
  v1: Vector3;
  v2: Vector3;
  normal: Vector3;
  centroid: Vector3;
}

/**
 * Samples a bounded subset of triangle centroids and casts a ray into the mesh along the inward
 * normal, brute-force intersecting every triangle to find the opposing surface. A short hit
 * distance indicates a locally thin wall. Bounded by MAX_SAMPLES x MAX_TRIANGLES_FOR_RAYCAST to
 * keep the analysis responsive; very dense meshes skip this pass entirely (reflected in the
 * caller's confidence score) rather than stalling the UI.
 */
export function detectThinWalls(
  geometry: MeshGeometryData,
  thicknessThresholdMm = DEFAULT_THICKNESS_THRESHOLD_MM
): { thinWallRegions: ThinWallRegion[]; skipped: boolean } {
  const triangleCount = getTriangleCount(geometry);
  if (triangleCount === 0 || triangleCount > MAX_TRIANGLES_FOR_RAYCAST) {
    return { thinWallRegions: [], skipped: triangleCount > MAX_TRIANGLES_FOR_RAYCAST };
  }

  const triangles: Triangle[] = [];
  forEachTriangle(geometry, (v0, v1, v2) => {
    const edge1 = new Vector3().subVectors(v1, v0);
    const edge2 = new Vector3().subVectors(v2, v0);
    const normal = new Vector3().crossVectors(edge1, edge2);
    if (normal.lengthSq() < 1e-12) return;
    normal.normalize();
    const centroid = new Vector3().add(v0).add(v1).add(v2).multiplyScalar(1 / 3);
    triangles.push({ v0: v0.clone(), v1: v1.clone(), v2: v2.clone(), normal, centroid });
  });

  const stride = Math.max(1, Math.floor(triangles.length / MAX_SAMPLES));
  const regions: ThinWallRegion[] = [];
  const rayOrigin = new Vector3();
  const rayDir = new Vector3();

  for (let i = 0; i < triangles.length; i += stride) {
    const sample = triangles[i]!;
    rayDir.copy(sample.normal).multiplyScalar(-1); // cast inward, opposite the outward normal
    rayOrigin.copy(sample.centroid).addScaledVector(sample.normal, -1e-3); // nudge off-surface

    let nearest = Infinity;
    for (let j = 0; j < triangles.length; j++) {
      if (j === i) continue;
      const t = triangles[j]!;
      const dist = rayTriangleDistance(rayOrigin, rayDir, t.v0, t.v1, t.v2);
      if (dist !== null && dist < nearest) nearest = dist;
    }

    if (nearest < thicknessThresholdMm) {
      regions.push({
        approxCenter: { x: sample.centroid.x, y: sample.centroid.y, z: sample.centroid.z },
        approxThicknessMm: nearest,
      });
    }
  }

  return { thinWallRegions: regions, skipped: false };
}
