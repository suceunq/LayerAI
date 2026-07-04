import type { MeshAnalysisResult, PrinterProfile } from "@layerai/shared-types";

export interface SizeFitStatus {
  fits: boolean;
  bedWidthMm: number;
  bedDepthMm: number;
  maxHeightMm: number;
  exceedsX: boolean;
  exceedsY: boolean;
  exceedsZ: boolean;
  /** Integer percent (with a small safety margin) that would make the model fit. 100 when it already fits. */
  recommendedScalePercent: number;
}

export function computeSizeFit(analysis: MeshAnalysisResult, printer: PrinterProfile): SizeFitStatus {
  const xs = printer.bedShape.map((p) => p.x);
  const ys = printer.bedShape.map((p) => p.y);
  const bedWidthMm = Math.max(...xs) - Math.min(...xs);
  const bedDepthMm = Math.max(...ys) - Math.min(...ys);
  const maxHeightMm = printer.maxPrintHeightMm;

  const { x, y, z } = analysis.dimensionsMm;
  const exceedsX = x > bedWidthMm;
  const exceedsY = y > bedDepthMm;
  const exceedsZ = z > maxHeightMm;
  const fits = !exceedsX && !exceedsY && !exceedsZ;

  const ratioX = bedWidthMm / x;
  const ratioY = bedDepthMm / y;
  const ratioZ = maxHeightMm / z;
  const minRatio = Math.min(ratioX, ratioY, ratioZ, 1);
  const recommendedScalePercent = fits ? 100 : Math.max(1, Math.floor(minRatio * 100) - 1);

  return { fits, bedWidthMm, bedDepthMm, maxHeightMm, exceedsX, exceedsY, exceedsZ, recommendedScalePercent };
}
