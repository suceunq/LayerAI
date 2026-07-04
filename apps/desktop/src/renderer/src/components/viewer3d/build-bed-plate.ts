import * as THREE from "three";
import type { PrinterProfile } from "@layerai/shared-types";
import { loadSvgTexture } from "./bed-texture-loader.js";

const PLATE_COLOR = "#1c1c20";
const GRID_COLOR = "#3a3a42";
const GRID_COLOR_CENTER = "#ff6600";

/**
 * Builds the print bed as a flat shape matching the selected printer's exact bed polygon, plus a
 * grid overlay. When the printer's official bed texture (from its PrusaSlicer profile) is
 * available, it's rasterized and layered on top once loaded - its SVG viewBox is confirmed to
 * map 1:1 (stretched) onto the bed's bounding box (e.g. the XL texture is literally sized
 * "360mm x 360mm" for a 360x360 bed), so a plain full-bounds plane is a correct fit.
 */
export function buildBedPlate(printer: PrinterProfile): THREE.Group {
  const group = new THREE.Group();
  group.name = "bed-plate";

  const shape = new THREE.Shape(printer.bedShape.map((p) => new THREE.Vector2(p.x, p.y)));
  const plateGeometry = new THREE.ShapeGeometry(shape);
  const plateMaterial = new THREE.MeshStandardMaterial({ color: PLATE_COLOR, roughness: 0.9, metalness: 0.05 });
  const plateMesh = new THREE.Mesh(plateGeometry, plateMaterial);
  plateMesh.receiveShadow = true;
  group.add(plateMesh);

  const minX = Math.min(...printer.bedShape.map((p) => p.x));
  const minY = Math.min(...printer.bedShape.map((p) => p.y));
  const bedWidth = Math.max(...printer.bedShape.map((p) => p.x)) - minX;
  const bedDepth = Math.max(...printer.bedShape.map((p) => p.y)) - minY;

  if (printer.bedTextureSvg) {
    loadSvgTexture(printer.bedTextureSvg)
      .then((texture) => {
        const textureGeometry = new THREE.PlaneGeometry(bedWidth, bedDepth);
        const textureMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.9 });
        const textureMesh = new THREE.Mesh(textureGeometry, textureMaterial);
        textureMesh.position.set(minX + bedWidth / 2, minY + bedDepth / 2, 0.02);
        textureMesh.name = "bed-texture";
        group.add(textureMesh);
      })
      .catch(() => {
        // Falls back to the flat plate + grid below if the texture fails to rasterize.
      });
  }

  const divisions = Math.max(2, Math.round(Math.max(bedWidth, bedDepth) / 20));
  const grid = new THREE.GridHelper(Math.max(bedWidth, bedDepth), divisions, GRID_COLOR_CENTER, GRID_COLOR);
  grid.rotateX(Math.PI / 2);
  grid.position.set(minX + bedWidth / 2, minY + bedDepth / 2, 0.05);
  group.add(grid);

  return group;
}
