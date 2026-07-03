import type { AnalyzedMesh, MeshGeometryData } from "@layerai/shared-types";
import {
  computeBoundingBox,
  computeVolumeAndCenterOfMass,
  computeFootprintPolygon,
  computeFootprintAreaMm2,
  estimateManifoldRatio,
  computeComplexityScore,
} from "./geometry/bounds.js";
import { polygonArea, polygonCentroid } from "./geometry/convex-hull-2d.js";
import { getTriangleCount } from "./geometry/triangles.js";
import { detectOverhangs } from "./features/overhangs.js";
import { detectBridges } from "./features/bridges.js";
import { detectThinWalls } from "./features/thin-walls.js";
import { computeRiskFlags } from "./features/risks.js";
import { generateOrientationCandidates } from "./orientation/candidates.js";

export interface AnalyzeMeshOptions {
  overhangThresholdDeg?: number;
  thinWallThresholdMm?: number;
}

export function analyzeMesh(rawGeometry: MeshGeometryData, options: AnalyzeMeshOptions = {}): AnalyzedMesh {
  const { candidates, bestIndex, groundedGeometries } = generateOrientationCandidates(rawGeometry);
  const geometry = groundedGeometries[bestIndex]!;

  const boundingBox = computeBoundingBox(geometry);
  const dimensionsMm = {
    x: boundingBox.max.x - boundingBox.min.x,
    y: boundingBox.max.y - boundingBox.min.y,
    z: boundingBox.max.z - boundingBox.min.z,
  };

  const { volumeMm3, centerOfMass } = computeVolumeAndCenterOfMass(geometry);
  const footprintPolygon = computeFootprintPolygon(geometry);
  const footprintAreaMm2 = polygonArea(footprintPolygon);
  const footprintCenter = polygonCentroid(footprintPolygon);
  const centerOfMassOffsetFromFootprintCenterMm = Math.hypot(
    centerOfMass.x - footprintCenter.x,
    centerOfMass.y - footprintCenter.y
  );

  const manifoldRatio = estimateManifoldRatio(geometry);
  const isManifold = manifoldRatio >= 0.98;
  const triangleCount = getTriangleCount(geometry);
  const complexityScore = computeComplexityScore(geometry, footprintAreaMm2, boundingBox);

  const overhangThresholdDeg = options.overhangThresholdDeg ?? 45;
  const { overhangFaces, overhangAreaMm2, totalSurfaceAreaMm2 } = detectOverhangs(geometry, boundingBox, overhangThresholdDeg);
  const bridgeRegions = detectBridges(geometry, overhangFaces);
  const { thinWallRegions, skipped: thinWallSkipped } = detectThinWalls(geometry, options.thinWallThresholdMm);

  const riskFlags = computeRiskFlags({
    boundingBox,
    footprintAreaMm2,
    footprintPolygon,
    centerOfMass: { x: centerOfMass.x, y: centerOfMass.y, z: centerOfMass.z },
    overhangAreaMm2,
    totalSurfaceAreaMm2,
    thinWallRegions,
    bridgeRegions,
  });

  const overhangRatio = totalSurfaceAreaMm2 > 0 ? overhangAreaMm2 / totalSurfaceAreaMm2 : 0;
  const supportsRecommended = overhangRatio > 0.03 || riskFlags.some((f) => f.id === "unsupported_overhang");

  const fragileFlagPresent = riskFlags.some((f) => f.id === "fragile_thin_wall" || f.id === "instability");
  const recommendedInfillPercent = Math.max(10, Math.min(30, 15 + (fragileFlagPresent ? 5 : 0)));

  const analysisConfidence = Math.max(
    0.3,
    Math.min(1, 0.55 + manifoldRatio * 0.35 + (thinWallSkipped ? 0 : 0.1))
  );

  return {
    geometry,
    analysis: {
      boundingBoxMm: boundingBox,
      dimensionsMm,
      volumeMm3,
      estimatedWeightG: null,
      footprintAreaMm2,
      centerOfMassMm: { x: centerOfMass.x, y: centerOfMass.y, z: centerOfMass.z },
      centerOfMassOffsetFromFootprintCenterMm,
      isManifold,
      triangleCount,
      complexityScore,
      overhangFaces,
      overhangAreaMm2,
      bridgeRegions,
      thinWallRegions,
      riskFlags,
      supportsRecommended,
      recommendedInfillPercent,
      orientationCandidates: candidates,
      bestOrientationIndex: bestIndex,
      analysisConfidence,
    },
  };
}

export function estimateWeightG(volumeMm3: number, densityGCm3: number): number {
  return (volumeMm3 / 1000) * densityGCm3;
}
