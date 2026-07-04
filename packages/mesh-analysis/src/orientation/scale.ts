import type { MeshGeometryData } from "@layerai/shared-types";

/** Uniformly scales the mesh from the origin. Safe to call on a placed mesh (centered XY, grounded Z=0): scaling from the origin preserves both. */
export function scaleGeometry(geometry: MeshGeometryData, scaleFactor: number): MeshGeometryData {
  const { positions } = geometry;
  const scaled = new Array<number>(positions.length);
  for (let i = 0; i < positions.length; i++) {
    scaled[i] = positions[i]! * scaleFactor;
  }
  return { positions: scaled, indices: geometry.indices };
}
