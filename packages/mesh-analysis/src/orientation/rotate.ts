import { Quaternion, Vector3 } from "three";
import type { MeshGeometryData } from "@layerai/shared-types";

export interface QuaternionLike {
  x: number;
  y: number;
  z: number;
  w: number;
}

export function rotateGeometry(geometry: MeshGeometryData, q: QuaternionLike): MeshGeometryData {
  const { positions } = geometry;
  const rotated = new Array<number>(positions.length);
  const quaternion = new Quaternion(q.x, q.y, q.z, q.w);
  const v = new Vector3();
  for (let i = 0; i < positions.length; i += 3) {
    v.set(positions[i]!, positions[i + 1]!, positions[i + 2]!).applyQuaternion(quaternion);
    rotated[i] = v.x;
    rotated[i + 1] = v.y;
    rotated[i + 2] = v.z;
  }
  return { positions: rotated, indices: geometry.indices };
}

/** Quaternion that rotates `downNormal` to point straight down (-Z), so the face it belongs to rests on the bed. */
export function quaternionRestingFace(downNormal: { x: number; y: number; z: number }): QuaternionLike {
  const up = new Vector3(0, 0, 1);
  const axis = new Vector3(downNormal.x, downNormal.y, downNormal.z).negate().normalize();
  const q = new Quaternion().setFromUnitVectors(axis, up);
  return { x: q.x, y: q.y, z: q.z, w: q.w };
}
