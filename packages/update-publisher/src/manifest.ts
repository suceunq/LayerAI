import type { ManifestFileEntry, ReleaseManifest } from "./types.js";

export interface BuildManifestInput {
  version: string;
  title: string;
  changelog: string;
  publishedAt: string;
  files: ManifestFileEntry[];
}

export function buildManifest(input: BuildManifestInput): ReleaseManifest {
  return {
    version: input.version,
    title: input.title,
    changelog: input.changelog,
    publishedAt: input.publishedAt,
    files: input.files,
  };
}

export function manifestFileName(): string {
  return "layerai-update-manifest.json";
}

export function serializeManifest(manifest: ReleaseManifest): string {
  return JSON.stringify(manifest, null, 2);
}
