import { Vector3 } from "three";
import type { MeshGeometryData } from "@layerai/shared-types";
import { forEachTriangle, triangleNormal, triangleArea } from "../geometry/triangles.js";

interface NormalCluster {
  normal: Vector3;
  areaMm2: number;
}

const CLUSTER_DOT_THRESHOLD = 0.95;

/**
 * Groups triangle face normals into clusters of similar direction (within ~18 degrees), weighted
 * by triangle area, and returns the largest clusters' directions. Used as extra orientation
 * candidates alongside the 6 world axes - critical for meshes imported at an arbitrary angle, or
 * for organic/curved shapes where no world-axis candidate produces a good resting orientation
 * (e.g. a coil that needs to lie on its side, at an angle none of X/Y/Z happen to match).
 */
export function dominantFaceNormals(geometry: MeshGeometryData, maxClusters = 12): Vector3[] {
  const clusters: NormalCluster[] = [];
  const n = new Vector3();

  forEachTriangle(geometry, (v0, v1, v2) => {
    const area = triangleArea(v0, v1, v2);
    if (area < 1e-6) return;
    triangleNormal(v0, v1, v2, n);
    if (n.lengthSq() < 0.5) return;

    let bestCluster: NormalCluster | undefined;
    let bestDot = CLUSTER_DOT_THRESHOLD;
    for (const cluster of clusters) {
      const dot = cluster.normal.dot(n);
      if (dot > bestDot) {
        bestDot = dot;
        bestCluster = cluster;
      }
    }

    if (bestCluster) {
      bestCluster.normal.multiplyScalar(bestCluster.areaMm2).addScaledVector(n, area).normalize();
      bestCluster.areaMm2 += area;
    } else {
      clusters.push({ normal: n.clone(), areaMm2: area });
    }
  });

  clusters.sort((a, b) => b.areaMm2 - a.areaMm2);
  return clusters.slice(0, maxClusters).map((c) => c.normal);
}
