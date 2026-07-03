import type { RiskFlag, Vec3, BoundingBox3, ThinWallRegion, BridgeRegion } from "@layerai/shared-types";
import { pointInPolygon, shrinkPolygon, type Point2 } from "../geometry/convex-hull-2d.js";

export interface RiskInputs {
  boundingBox: BoundingBox3;
  footprintAreaMm2: number;
  footprintPolygon: Point2[];
  centerOfMass: Vec3;
  overhangAreaMm2: number;
  totalSurfaceAreaMm2: number;
  thinWallRegions: ThinWallRegion[];
  bridgeRegions: BridgeRegion[];
}

export function computeRiskFlags(inputs: RiskInputs): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const { boundingBox, footprintAreaMm2, footprintPolygon, centerOfMass, overhangAreaMm2, totalSurfaceAreaMm2, thinWallRegions } = inputs;

  const heightMm = boundingBox.max.z - boundingBox.min.z;
  const footprintDiameterMm = 2 * Math.sqrt(Math.max(footprintAreaMm2, 1e-6) / Math.PI);
  const aspectRatio = footprintDiameterMm > 0 ? heightMm / footprintDiameterMm : 0;

  // Bed detachment: small footprint relative to a tall model concentrates thermal/mechanical stress.
  if (footprintAreaMm2 < 200 && heightMm > 40) {
    flags.push({
      id: "bed_detachment",
      severity: footprintAreaMm2 < 80 ? "high" : "medium",
      confidence: 0.6,
      description: "Petite surface de contact avec le plateau par rapport à la hauteur de la pièce.",
    });
  }

  // Warping: large flat first-layer footprint is the classic ABS/ASA warping profile.
  if (footprintAreaMm2 > 6000) {
    flags.push({
      id: "warping",
      severity: footprintAreaMm2 > 15000 ? "high" : "medium",
      confidence: 0.5,
      description: "Grande surface de première couche - risque de décollement des coins sur matériaux sujets au warping.",
    });
  }

  // Ringing/vibration: tall, thin, unsupported columns amplify motion-induced artifacts.
  if (aspectRatio > 4 && heightMm > 60) {
    flags.push({
      id: "ringing",
      severity: aspectRatio > 8 ? "high" : "medium",
      confidence: 0.45,
      description: "Géométrie haute et fine - risque de vibrations visibles (ringing) à vitesse élevée.",
    });
  }

  if (thinWallRegions.length > 0) {
    const worstThicknessMm = Math.min(...thinWallRegions.map((r) => r.approxThicknessMm));
    flags.push({
      id: "fragile_thin_wall",
      severity: worstThicknessMm < 0.4 ? "high" : "medium",
      confidence: 0.55,
      description: `Parois fines détectées (jusqu'à ${worstThicknessMm.toFixed(2)} mm) - risque de casse.`,
    });
  }

  const overhangRatio = totalSurfaceAreaMm2 > 0 ? overhangAreaMm2 / totalSurfaceAreaMm2 : 0;
  if (overhangRatio > 0.05) {
    flags.push({
      id: "unsupported_overhang",
      severity: overhangRatio > 0.2 ? "high" : "medium",
      confidence: 0.7,
      description: `${Math.round(overhangRatio * 100)}% de la surface est en surplomb marqué - des supports sont probablement nécessaires.`,
    });
  }

  // Stability: does the center of mass project inside a safety-shrunk footprint?
  const shrunkFootprint = shrinkPolygon(footprintPolygon, 0.1);
  const comProjection: Point2 = { x: centerOfMass.x, y: centerOfMass.y };
  if (footprintPolygon.length >= 3 && !pointInPolygon(comProjection, shrunkFootprint)) {
    flags.push({
      id: "instability",
      severity: "high",
      confidence: 0.5,
      description: "Le centre de masse est proche du bord de l'empreinte au sol - risque de bascule pendant l'impression.",
    });
  }

  return flags;
}
