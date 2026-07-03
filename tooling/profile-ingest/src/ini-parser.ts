export interface RawSection {
  type: string;
  name: string;
  inherits: string[];
  keys: Record<string, string>;
}

/** type -> name -> section. Abstract sections keep their literal "*name*" as the map key. */
export type SectionsByType = Map<string, Map<string, RawSection>>;

const SECTION_HEADER = /^\[([a-zA-Z_]+):(.+)]$/;

/**
 * Parses a PrusaSlicer vendor .ini file into raw sections, preserving inherits chains
 * unresolved. PrusaSlicer profile files are strictly line-based: one key=value per line,
 * embedded gcode uses literal "\n" escape sequences rather than real newlines, so no
 * line-continuation handling is needed.
 */
export function parseIni(text: string): SectionsByType {
  const sections: SectionsByType = new Map();
  let current: RawSection | null = null;

  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (line.length === 0) continue;

    const headerMatch = SECTION_HEADER.exec(line);
    if (headerMatch) {
      const [, type, name] = headerMatch;
      current = { type: type!, name: name!, inherits: [], keys: {} };
      if (!sections.has(type!)) sections.set(type!, new Map());
      sections.get(type!)!.set(name!, current);
      continue;
    }

    if (!current) continue; // stray line before any section (e.g. [vendor] handled separately)

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim();
    if (key === "inherits") {
      current.inherits = value
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    } else {
      current.keys[key] = value;
    }
  }

  return sections;
}
