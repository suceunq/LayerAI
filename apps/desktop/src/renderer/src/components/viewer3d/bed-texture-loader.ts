import * as THREE from "three";

const RASTER_SIZE = 1024;

/**
 * Rasterizes an SVG bed-texture (from PrusaSlicer's own profile assets) into a three.js texture.
 * Uses the browser's native SVG rendering (Electron's renderer is a full Chromium context) via an
 * <img> + canvas round-trip, rather than pulling in an SVG rasterization library - no native
 * dependency, works identically in dev and packaged builds. Loaded as a base64 data URI (not a
 * blob: URL) since the app's CSP only allows `img-src 'self' data:`.
 */
export function loadSvgTexture(svgMarkup: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgMarkup)))}`;
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = RASTER_SIZE;
      canvas.height = RASTER_SIZE;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, 0, 0, RASTER_SIZE, RASTER_SIZE);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      resolve(texture);
    };
    image.onerror = (err) => reject(err);
    image.src = dataUrl;
  });
}
