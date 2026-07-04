import { Vector3, Quaternion, Euler } from "three";
import type { MeshGeometryData, OrientationCandidate } from "@layerai/shared-types";
import { computeBoundingBox, computeFootprintAreaMm2 } from "../geometry/bounds.js";
import { detectOverhangs } from "../features/overhangs.js";
import { placeOnBed } from "./grounding.js";

const CANDIDATE_AXES: { axis: Vector3; label: string }[] = [
  { axis: new Vector3(0, 0, 1), label: "face du dessus (orientation d'origine)" },
  { axis: new Vector3(0, 0, -1), label: "face du dessous" },
  { axis: new Vector3(1, 0, 0), label: "face +X" },
  { axis: new Vector3(-1, 0, 0), label: "face -X" },
  { axis: new Vector3(0, 1, 0), label: "face +Y" },
  { axis: new Vector3(0, -1, 0), label: "face -Y" },
];

function applyRotation(geometry: MeshGeometryData, quaternion: Quaternion): MeshGeometryData {
  const { positions } = geometry;
  const rotated = new Array<number>(positions.length);
  const v = new Vector3();
  for (let i = 0; i < positions.length; i += 3) {
    v.set(positions[i]!, positions[i + 1]!, positions[i + 2]!).applyQuaternion(quaternion);
    rotated[i] = v.x;
    rotated[i + 1] = v.y;
    rotated[i + 2] = v.z;
  }
  return { positions: rotated, indices: geometry.indices };
}

/**
 * Tests resting the mesh on each of its 6 axis-aligned directions (a pragmatic, bounded
 * heuristic - full arbitrary-orientation search via convex-hull face fitting is deferred).
 * Each candidate is scored by resulting overhang area and a height/footprint stability proxy.
 */
export function generateOrientationCandidates(geometry: MeshGeometryData): {
  candidates: OrientationCandidate[];
  bestIndex: number;
  groundedGeometries: MeshGeometryData[];
} {
  const up = new Vector3(0, 0, 1);
  const candidates: OrientationCandidate[] = [];
  const groundedGeometries: MeshGeometryData[] = [];

  for (const { axis, label } of CANDIDATE_AXES) {
    const quaternion = new Quaternion().setFromUnitVectors(axis.clone().normalize(), up);
    const rotated = placeOnBed(applyRotation(geometry, quaternion));
    const boundingBox = computeBoundingBox(rotated);
    const footprintAreaMm2 = computeFootprintAreaMm2(rotated);
    const { overhangAreaMm2, totalSurfaceAreaMm2 } = detectOverhangs(rotated, boundingBox);
    const heightMm = boundingBox.max.z - boundingBox.min.z;

    const overhangRatio = totalSurfaceAreaMm2 > 0 ? overhangAreaMm2 / totalSurfaceAreaMm2 : 0;
    const footprintDiameterMm = 2 * Math.sqrt(Math.max(footprintAreaMm2, 1e-6) / Math.PI);
    const aspectRatio = footprintDiameterMm > 0 ? heightMm / footprintDiameterMm : heightMm;
    const stabilityScore = Math.max(0, 1 - aspectRatio / 6);
    const score = Math.max(0, Math.min(1, (1 - overhangRatio) * 0.7 + stabilityScore * 0.3));

    const euler = new Euler().setFromQuaternion(quaternion, "XYZ");
    candidates.push({
      rotationDeg: {
        x: (euler.x * 180) / Math.PI,
        y: (euler.y * 180) / Math.PI,
        z: (euler.z * 180) / Math.PI,
      },
      score,
      restingFaceDescription: label,
      overhangAreaEstimateMm2: overhangAreaMm2,
      footprintAreaEstimateMm2: footprintAreaMm2,
      heightMmEstimate: heightMm,
    });
    groundedGeometries.push(rotated);
  }

  let bestIndex = 0;
  for (let i = 1; i < candidates.length; i++) {
    if (candidates[i]!.score > candidates[bestIndex]!.score) bestIndex = i;
  }

  return { candidates, bestIndex, groundedGeometries };
}
