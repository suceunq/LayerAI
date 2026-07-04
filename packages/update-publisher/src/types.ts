export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
}

export interface ManifestFileEntry {
  name: string;
  sizeBytes: number;
  sha256: string;
  downloadUrl: string;
}

export interface ReleaseManifest {
  version: string;
  title: string;
  changelog: string;
  publishedAt: string;
  files: ManifestFileEntry[];
}

export interface PublishInputFile {
  path: string;
  name: string;
}

export interface PublishInput {
  version: string;
  title: string;
  changelog: string;
  files: PublishInputFile[];
  prerelease?: boolean;
}

export type PublishProgressEvent =
  | { phase: "validating"; message: string }
  | { phase: "hashing"; fileName: string }
  | { phase: "creating-release"; message: string }
  | { phase: "uploading"; fileName: string; transferredBytes: number; totalBytes: number }
  | { phase: "uploaded"; fileName: string }
  | { phase: "done"; message: string };

export type PublishProgressCallback = (event: PublishProgressEvent) => void;

export interface PublishResult {
  version: string;
  releaseUrl: string;
  manifest: ReleaseManifest;
}

export interface PublishHistoryEntry {
  version: string;
  title: string;
  publishedAt: string;
  status: "success" | "failed";
  releaseUrl?: string;
  errorMessage?: string;
  fileNames: string[];
}
