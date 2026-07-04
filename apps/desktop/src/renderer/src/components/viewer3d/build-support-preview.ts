import * as THREE from "three";
import type { MeshGeometryData, OverhangFace } from "@layerai/shared-types";

export interface SupportColumn {
  x: number;
  y: number;
  heightMm: number;
}

const GRID_CELL_MM = 6;
const MIN_COLUMN_HEIGHT_MM = 2;

/**
 * Buckets overhang face centroids into a coarse XY grid and emits one column per occupied cell,
 * reaching from the bed up to the lowest overhang point in that cell. This is a rough, fast
 * approximation of where a slicer would place support material - not a real support algorithm
 * (LayerAI never re-implements slicing), just enough to show the user roughly where and how much
 * support material their current settings will need.
 */
export function computeSupportColumns(geometry: MeshGeometryData, overhangFaces: OverhangFace[]): SupportColumn[] {
  const { positions, indices } = geometry;
  const cellMinHeight = new Map<string, { x: number; y: number; heightMm: number }>();

  for (const face of overhangFaces) {
    const t = face.triangleIndex;
    const i0 = indices ? indices[t * 3]! : t * 3;
    const i1 = indices ? indices[t * 3 + 1]! : t * 3 + 1;
    const i2 = indices ? indices[t * 3 + 2]! : t * 3 + 2;

    const cx = (positions[i0 * 3]! + positions[i1 * 3]! + positions[i2 * 3]!) / 3;
    const cy = (positions[i0 * 3 + 1]! + positions[i1 * 3 + 1]! + positions[i2 * 3 + 1]!) / 3;
    const cz = (positions[i0 * 3 + 2]! + positions[i1 * 3 + 2]! + positions[i2 * 3 + 2]!) / 3;

    if (cz < MIN_COLUMN_HEIGHT_MM) continue;

    const cellX = Math.round(cx / GRID_CELL_MM);
    const cellY = Math.round(cy / GRID_CELL_MM);
    const key = `${cellX}:${cellY}`;
    const existing = cellMinHeight.get(key);
    if (!existing || cz < existing.heightMm) {
      cellMinHeight.set(key, { x: cellX * GRID_CELL_MM, y: cellY * GRID_CELL_MM, heightMm: cz });
    }
  }

  return Array.from(cellMinHeight.values());
}

const COLUMN_RADIUS_MM = 1;
const COLUMN_COLOR = new THREE.Color("#22c3ff");

/** Builds one instanced mesh covering every support column - cheap even for hundreds of columns. */
export function buildSupportPreviewMesh(columns: SupportColumn[]): THREE.InstancedMesh | null {
  if (columns.length === 0) return null;

  const unitCylinder = new THREE.CylinderGeometry(COLUMN_RADIUS_MM, COLUMN_RADIUS_MM, 1, 8);
  unitCylinder.rotateX(Math.PI / 2);
  unitCylinder.translate(0, 0, 0.5);

  const material = new THREE.MeshBasicMaterial({ color: COLUMN_COLOR, transparent: true, opacity: 0.55, depthWrite: false });
  const mesh = new THREE.InstancedMesh(unitCylinder, material, columns.length);

  const dummy = new THREE.Object3D();
  columns.forEach((column, i) => {
    dummy.position.set(column.x, column.y, 0);
    dummy.scale.set(1, 1, Math.max(column.heightMm, MIN_COLUMN_HEIGHT_MM));
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;

  return mesh;
}
