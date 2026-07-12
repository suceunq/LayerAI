import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { BambuRawProfile } from "../bambu/loader.js";

export interface CrealityProfileSet {
  machines: Map<string, BambuRawProfile>;
  machineModels: Map<string, BambuRawProfile>;
  filaments: Map<string, BambuRawProfile>;
}

function loadJsonFilesIn(dir: string): BambuRawProfile[] {
  const profiles: BambuRawProfile[] = [];
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  } catch {
    return profiles;
  }
  for (const file of files) {
    try {
      const raw = JSON.parse(readFileSync(join(dir, file), "utf-8")) as BambuRawProfile;
      if (raw && typeof raw === "object" && raw.name) profiles.push(raw);
    } catch {
      // Skip unparseable/non-profile files silently.
    }
  }
  return profiles;
}

/** Loads CrealityPrint's Creality/{machine,filament} profile trees into type-keyed maps. Same
 * OrcaSlicer-derived JSON schema as BambuStudio's BBL tree (see ../bambu/loader.ts). */
export function loadCrealityProfiles(crealityRoot: string): CrealityProfileSet {
  const machines = new Map<string, BambuRawProfile>();
  const machineModels = new Map<string, BambuRawProfile>();
  const filaments = new Map<string, BambuRawProfile>();

  for (const profile of loadJsonFilesIn(join(crealityRoot, "machine"))) {
    if (profile.type === "machine") machines.set(profile.name, profile);
    else if (profile.type === "machine_model") machineModels.set(profile.name, profile);
  }
  for (const profile of loadJsonFilesIn(join(crealityRoot, "filament"))) {
    if (profile.type === "filament") filaments.set(profile.name, profile);
  }

  return { machines, machineModels, filaments };
}
