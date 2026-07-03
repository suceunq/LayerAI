import { createHash } from "node:crypto";
import type { MeshAnalysisResult } from "@layerai/shared-types";

/**
 * A coarse geometry fingerprint (rounded dimensions/volume/triangle-count bucket) used to group
 * "similar" print jobs for outcome learning. Deliberately loose - exact-mesh matching would
 * almost never hit twice, so nearby geometries are folded into the same bucket.
 */
export function computeGeometrySignature(analysis: MeshAnalysisResult): string {
  const round = (n: number, step: number): number => Math.round(n / step) * step;
  const key = [
    round(analysis.dimensionsMm.x, 5),
    round(analysis.dimensionsMm.y, 5),
    round(analysis.dimensionsMm.z, 5),
    round(analysis.volumeMm3, 500),
    round(analysis.triangleCount, 50),
  ].join("_");
  return createHash("sha1").update(key).digest("hex").slice(0, 16);
}
