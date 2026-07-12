import * as THREE from "three";

const TEXTURE_SIZE = 128;
const LINE_COLOR = "#5b9ef7";
const BG_COLOR = "rgba(47, 128, 237, 0.12)";

/**
 * A small illustrative canvas pattern per fill_pattern value - visually distinct per pattern so
 * the layer-view cap plane gives a sense of "grid vs. diagonal vs. dense", but not a geometrically
 * accurate rendering of the real slicer infill path. Purely decorative/estimate, consistent with
 * the rest of the synthetic layer view.
 */
export function buildInfillTexture(pattern: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = 2;

  const drawGrid = (spacing: number, angleDeg: number): void => {
    ctx.save();
    ctx.translate(TEXTURE_SIZE / 2, TEXTURE_SIZE / 2);
    ctx.rotate((angleDeg * Math.PI) / 180);
    ctx.translate(-TEXTURE_SIZE, -TEXTURE_SIZE);
    for (let x = 0; x <= TEXTURE_SIZE * 2; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, TEXTURE_SIZE * 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  switch (pattern) {
    case "cubic":
      drawGrid(24, 0);
      drawGrid(24, 60);
      drawGrid(24, 120);
      break;
    case "gyroid": {
      ctx.beginPath();
      for (let y = 0; y <= TEXTURE_SIZE; y += 16) {
        for (let x = 0; x <= TEXTURE_SIZE; x += 4) {
          const yOffset = y + 8 * Math.sin((x / TEXTURE_SIZE) * Math.PI * 4);
          if (x === 0) ctx.moveTo(x, yOffset);
          else ctx.lineTo(x, yOffset);
        }
      }
      ctx.stroke();
      break;
    }
    case "grid":
    default:
      drawGrid(20, 0);
      drawGrid(20, 90);
      break;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}
