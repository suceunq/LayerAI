export interface PublisherConfig {
  owner: string;
  repo: string;
  hasToken: boolean;
}

export interface SavePublisherConfigRequest {
  owner: string;
  repo: string;
  token?: string;
}

export interface PickedFile {
  path: string;
  name: string;
  sizeBytes: number;
}

export interface PublishRunRequest {
  version: string;
  title: string;
  changelog: string;
  filePaths: string[];
  prerelease?: boolean;
}

export type PublishRunResponse = { success: true; releaseUrl: string } | { success: false; errorMessage: string };

export type PublishProgressEvent =
  | { phase: "validating"; message: string }
  | { phase: "hashing"; fileName: string }
  | { phase: "creating-release"; message: string }
  | { phase: "uploading"; fileName: string; transferredBytes: number; totalBytes: number }
  | { phase: "uploaded"; fileName: string }
  | { phase: "done"; message: string };

export interface PublishHistoryEntry {
  version: string;
  title: string;
  publishedAt: string;
  status: "success" | "failed";
  releaseUrl?: string;
  errorMessage?: string;
  fileNames: string[];
}
