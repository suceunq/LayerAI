import { Vector3 } from "three";

const EPSILON = 1e-9;

/** Moller-Trumbore ray-triangle intersection. Returns the hit distance along the ray, or null. */
export function rayTriangleDistance(
  origin: Vector3,
  direction: Vector3,
  v0: Vector3,
  v1: Vector3,
  v2: Vector3
): number | null {
  const edge1 = new Vector3().subVectors(v1, v0);
  const edge2 = new Vector3().subVectors(v2, v0);
  const pvec = new Vector3().crossVectors(direction, edge2);
  const det = edge1.dot(pvec);
  if (Math.abs(det) < EPSILON) return null;

  const invDet = 1 / det;
  const tvec = new Vector3().subVectors(origin, v0);
  const u = tvec.dot(pvec) * invDet;
  if (u < 0 || u > 1) return null;

  const qvec = new Vector3().crossVectors(tvec, edge1);
  const v = direction.dot(qvec) * invDet;
  if (v < 0 || u + v > 1) return null;

  const t = edge2.dot(qvec) * invDet;
  return t > EPSILON ? t : null;
}
