import { Vector3 } from "three";
import type { OverhangFace, MeshGeometryData, BoundingBox3 } from "@layerai/shared-types";
import { forEachTriangle } from "../geometry/triangles.js";

const BED_CONTACT_EPSILON_MM = 0.05;

/**
 * Flags downward-facing triangles (candidate overhangs) by face-normal angle from horizontal -
 * the same first-pass heuristic real slicers use for overhang highlighting. Triangles sitting at
 * the mesh's minimum Z (the bed-contact face) are excluded since they're supported by the plate,
 * not floating.
 */
export function detectOverhangs(
  geometry: MeshGeometryData,
  boundingBox: BoundingBox3,
  thresholdDeg = 45
): { overhangFaces: OverhangFace[]; overhangAreaMm2: number; totalSurfaceAreaMm2: number } {
  const overhangFaces: OverhangFace[] = [];
  let overhangAreaMm2 = 0;
  let totalSurfaceAreaMm2 = 0;

  const edge1 = new Vector3();
  const edge2 = new Vector3();
  const normal = new Vector3();

  forEachTriangle(geometry, (v0, v1, v2, triangleIndex) => {
    edge1.subVectors(v1, v0);
    edge2.subVectors(v2, v0);
    normal.crossVectors(edge1, edge2);
    const area = normal.length() / 2;
    totalSurfaceAreaMm2 += area;
    if (area < 1e-9) return;
    normal.normalize();

    if (normal.z >= -1e-6) return; // upward or vertical face, not an overhang underside

    const avgZ = (v0.z + v1.z + v2.z) / 3;
    if (avgZ - boundingBox.min.z <= BED_CONTACT_EPSILON_MM) return; // resting on the bed, not floating

    // angleFromHorizontalDeg: 0 = vertical wall, 90 = flat downward-facing ceiling.
    const angleFromHorizontalDeg = 90 - (Math.acos(Math.min(1, Math.abs(normal.z))) * 180) / Math.PI;
    if (angleFromHorizontalDeg < thresholdDeg) return;

    overhangFaces.push({ triangleIndex, angleFromHorizontalDeg, areaMm2: area });
    overhangAreaMm2 += area;
  });

  return { overhangFaces, overhangAreaMm2, totalSurfaceAreaMm2 };
}
