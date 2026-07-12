import type { BedShapePoint } from "@layerai/shared-types";

export interface GridArrangementResult {
  /** Bed-space XY centers, one per placed copy. Length = min(requestedCount, maxFit). */
  positions: { x: number; y: number }[];
  /** How many copies of this footprint the bed can hold at this spacing. */
  maxFit: number;
  /** False when requestedCount exceeds maxFit - positions is then truncated to maxFit. */
  fits: boolean;
}

/**
 * Lays out `requestedCount` copies of a rectangular XY footprint on a rectangular bed area in a
 * simple centered grid (no rotation, no bin-packing) - good enough for identical-part batches,
 * which never benefit from rotating individual copies differently anyway.
 */
export function computeGridArrangement(
  requestedCount: number,
  itemWidthMm: number,
  itemDepthMm: number,
  bedShape: BedShapePoint[],
  spacingMm = 6
): GridArrangementResult {
  const minX = Math.min(...bedShape.map((p) => p.x));
  const maxX = Math.max(...bedShape.map((p) => p.x));
  const minY = Math.min(...bedShape.map((p) => p.y));
  const maxY = Math.max(...bedShape.map((p) => p.y));
  const bedWidth = maxX - minX;
  const bedDepth = maxY - minY;
  const bedCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };

  const cellW = itemWidthMm + spacingMm;
  const cellH = itemDepthMm + spacingMm;
  const cols = Math.max(0, Math.floor((bedWidth + spacingMm) / cellW));
  const rows = Math.max(0, Math.floor((bedDepth + spacingMm) / cellH));
  const maxFit = cols * rows;

  const count = Math.max(0, Math.min(requestedCount, maxFit));
  const totalW = cols * cellW - spacingMm;
  const totalH = rows * cellH - spacingMm;
  const startX = bedCenter.x - totalW / 2 + itemWidthMm / 2;
  const startY = bedCenter.y - totalH / 2 + itemDepthMm / 2;

  const positions: { x: number; y: number }[] = [];
  outer: for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (positions.length >= count) break outer;
      positions.push({ x: startX + c * cellW, y: startY + r * cellH });
    }
  }

  return { positions, maxFit, fits: requestedCount <= maxFit };
}
