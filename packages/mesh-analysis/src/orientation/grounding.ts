import type { MeshGeometryData } from "@layerai/shared-types";

/**
 * Places the mesh on the build plate: translates Z so the lowest point touches the plate at
 * Z=0 (never floating, never clipped below), and translates X/Y so the footprint's bounding-box
 * center sits at the world origin (never off-center in a corner). Applied after import and after
 * any orientation change - the printer bed itself is centered around this same origin at render
 * time, so a mesh centered here lands centered on any selected bed regardless of its size.
 */
export function placeOnBed(geometry: MeshGeometryData): MeshGeometryData {
  const { positions } = geometry;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i]!;
    const y = positions[i + 1]!;
    const z = positions[i + 2]!;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
  }

  const offsetX = (minX + maxX) / 2;
  const offsetY = (minY + maxY) / 2;
  const offsetZ = minZ;

  if (Math.abs(offsetX) < 1e-9 && Math.abs(offsetY) < 1e-9 && Math.abs(offsetZ) < 1e-9) {
    return geometry;
  }

  const placed = new Array<number>(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    placed[i] = positions[i]! - offsetX;
    placed[i + 1] = positions[i + 1]! - offsetY;
    placed[i + 2] = positions[i + 2]! - offsetZ;
  }

  return { positions: placed, indices: geometry.indices };
}
