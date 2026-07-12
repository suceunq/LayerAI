export type FilamentGroup = "prusa" | "bambu" | "creality";

/** Prusa Research filament ids are unprefixed; other vendors use a slicer-family prefix since
 * their config vocabularies (and 3mf metadata format) differ from PrusaSlicer's. */
export function filamentGroupForVendor(vendor: string | undefined): FilamentGroup {
  if (vendor === "Bambu Lab") return "bambu";
  if (vendor === "Creality") return "creality";
  return "prusa";
}

export function filamentGroupOfId(filamentId: string): FilamentGroup {
  if (filamentId.startsWith("BAMBU_")) return "bambu";
  if (filamentId.startsWith("CREALITY_")) return "creality";
  return "prusa";
}
