export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox3 {
  min: Vec3;
  max: Vec3;
}

/** Raw mesh geometry, always expressed in millimeters. */
export interface MeshGeometryData {
  /** Flat vertex positions [x0,y0,z0,x1,y1,z1,...] in millimeters. */
  positions: number[];
  /** Triangle indices into `positions` (grouped by 3). If absent, positions are already triangle-soup. */
  indices?: number[];
}

export type RiskSeverity = "low" | "medium" | "high";

export type RiskFlagId =
  | "bed_detachment"
  | "warping"
  | "ringing"
  | "fragile_thin_wall"
  | "unsupported_overhang"
  | "instability";

export interface RiskFlag {
  id: RiskFlagId;
  severity: RiskSeverity;
  /** 0..1 */
  confidence: number;
  description: string;
}

export interface OverhangFace {
  triangleIndex: number;
  /** Angle of the face normal measured from the horizontal (XY) plane, in degrees. 0 = vertical wall, 90 = flat ceiling. */
  angleFromHorizontalDeg: number;
  areaMm2: number;
}

export interface BridgeRegion {
  approxCenter: Vec3;
  approxAreaMm2: number;
  approxSpanMm: number;
}

export interface ThinWallRegion {
  approxCenter: Vec3;
  approxThicknessMm: number;
}

export interface OrientationCandidate {
  /** Rotation to apply to the imported mesh, Euler XYZ degrees, applied in XYZ order. */
  rotationDeg: Vec3;
  /** 0..1, higher is better. */
  score: number;
  restingFaceDescription: string;
  overhangAreaEstimateMm2: number;
  footprintAreaEstimateMm2: number;
  heightMmEstimate: number;
}

export interface MeshAnalysisResult {
  boundingBoxMm: BoundingBox3;
  dimensionsMm: Vec3;
  volumeMm3: number;
  /** null until a filament density is known. */
  estimatedWeightG: number | null;
  footprintAreaMm2: number;
  centerOfMassMm: Vec3;
  centerOfMassOffsetFromFootprintCenterMm: number;
  isManifold: boolean;
  triangleCount: number;
  /** 0..1 heuristic, higher = geometrically more complex. */
  complexityScore: number;
  overhangFaces: OverhangFace[];
  overhangAreaMm2: number;
  bridgeRegions: BridgeRegion[];
  thinWallRegions: ThinWallRegion[];
  riskFlags: RiskFlag[];
  supportsRecommended: boolean;
  recommendedInfillPercent: number;
  orientationCandidates: OrientationCandidate[];
  bestOrientationIndex: number;
  /** 0..1, degraded by non-manifold/degenerate input. */
  analysisConfidence: number;
}
