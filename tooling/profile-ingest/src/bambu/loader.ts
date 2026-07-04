import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

export interface BambuRawProfile {
  type: string;
  name: string;
  inherits?: string;
  instantiation?: string;
  [key: string]: unknown;
}

export interface BambuProfileSet {
  machines: Map<string, BambuRawProfile>;
  machineModels: Map<string, BambuRawProfile>;
  filaments: Map<string, BambuRawProfile>;
  processes: Map<string, BambuRawProfile>;
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
      // Skip unparseable/non-profile files silently - the BBL folder also holds gcode template
      // JSON fragments that aren't full profiles.
    }
  }
  return profiles;
}

/** Loads BambuStudio's BBL/{machine,filament,process} profile trees into type-keyed maps. */
export function loadBambuProfiles(bblRoot: string): BambuProfileSet {
  const machines = new Map<string, BambuRawProfile>();
  const machineModels = new Map<string, BambuRawProfile>();
  const filaments = new Map<string, BambuRawProfile>();
  const processes = new Map<string, BambuRawProfile>();

  for (const profile of loadJsonFilesIn(join(bblRoot, "machine"))) {
    if (profile.type === "machine") machines.set(profile.name, profile);
    else if (profile.type === "machine_model") machineModels.set(profile.name, profile);
  }
  for (const profile of loadJsonFilesIn(join(bblRoot, "filament"))) {
    if (profile.type === "filament") filaments.set(profile.name, profile);
  }
  for (const profile of loadJsonFilesIn(join(bblRoot, "process"))) {
    if (profile.type === "process") processes.set(profile.name, profile);
  }

  return { machines, machineModels, filaments, processes };
}
