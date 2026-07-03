import type { MeshGeometryData } from "@layerai/shared-types";

/**
 * Translates the mesh so its lowest point touches the build plate at Z=0. Applied after import
 * and after any orientation change - a model must never be left floating above or clipped below
 * the plate.
 */
export function groundMesh(geometry: MeshGeometryData): MeshGeometryData {
  const { positions } = geometry;
  let minZ = Infinity;
  for (let i = 2; i < positions.length; i += 3) {
    const z = positions[i]!;
    if (z < minZ) minZ = z;
  }
  if (!Number.isFinite(minZ) || Math.abs(minZ) < 1e-9) {
    return geometry;
  }

  const grounded = new Array<number>(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    grounded[i] = positions[i]!;
    grounded[i + 1] = positions[i + 1]!;
    grounded[i + 2] = positions[i + 2]! - minZ;
  }

  return { positions: grounded, indices: geometry.indices };
}
