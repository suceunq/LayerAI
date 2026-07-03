import type { RiskFlagId } from "@layerai/shared-types";

export const RISK_LABELS_FR: Record<RiskFlagId, string> = {
  bed_detachment: "Risque de décollement du plateau",
  warping: "Risque de warping",
  ringing: "Risque de vibrations (ringing)",
  fragile_thin_wall: "Parois fragiles",
  unsupported_overhang: "Surplombs non supportés",
  instability: "Instabilité de la pièce",
};
