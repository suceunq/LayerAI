import * as THREE from "three";
import type { PrinterProfile } from "@layerai/shared-types";

const PLATE_COLOR = "#1c1c20";
const GRID_COLOR = "#3a3a42";
const GRID_COLOR_CENTER = "#ff6600";

/** Builds the print bed as a flat shape matching the selected printer's exact bed polygon, plus a grid overlay. */
export function buildBedPlate(printer: PrinterProfile): THREE.Group {
  const group = new THREE.Group();
  group.name = "bed-plate";

  const shape = new THREE.Shape(printer.bedShape.map((p) => new THREE.Vector2(p.x, p.y)));
  const plateGeometry = new THREE.ShapeGeometry(shape);
  const plateMaterial = new THREE.MeshStandardMaterial({ color: PLATE_COLOR, roughness: 0.9, metalness: 0.05 });
  const plateMesh = new THREE.Mesh(plateGeometry, plateMaterial);
  plateMesh.receiveShadow = true;
  group.add(plateMesh);

  const bedWidth = Math.max(...printer.bedShape.map((p) => p.x)) - Math.min(...printer.bedShape.map((p) => p.x));
  const bedDepth = Math.max(...printer.bedShape.map((p) => p.y)) - Math.min(...printer.bedShape.map((p) => p.y));
  const divisions = Math.max(2, Math.round(Math.max(bedWidth, bedDepth) / 20));
  const grid = new THREE.GridHelper(Math.max(bedWidth, bedDepth), divisions, GRID_COLOR_CENTER, GRID_COLOR);
  grid.rotateX(Math.PI / 2);
  grid.position.set(bedWidth / 2, bedDepth / 2, 0.05);
  group.add(grid);

  return group;
}
