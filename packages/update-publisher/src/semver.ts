const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-.]+))?(?:\+[0-9A-Za-z-.]+)?$/;

export interface ParsedSemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

export function parseSemVer(version: string): ParsedSemVer | null {
  const match = SEMVER_RE.exec(version.trim());
  if (!match) return null;
  const [, major, minor, patch, prerelease] = match;
  return { major: Number(major), minor: Number(minor), patch: Number(patch), prerelease };
}

export function isValidSemVer(version: string): boolean {
  return parseSemVer(version) !== null;
}

/** Returns negative if a<b, 0 if equal, positive if a>b. Ignores prerelease/build ordering nuances beyond simple presence. */
export function compareSemVer(a: string, b: string): number {
  const pa = parseSemVer(a);
  const pb = parseSemVer(b);
  if (!pa || !pb) throw new Error(`Version SemVer invalide : "${a}" ou "${b}"`);
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  if (pa.patch !== pb.patch) return pa.patch - pb.patch;
  if (pa.prerelease && !pb.prerelease) return -1;
  if (!pa.prerelease && pb.prerelease) return 1;
  if (pa.prerelease && pb.prerelease) return pa.prerelease.localeCompare(pb.prerelease);
  return 0;
}
