export interface GitHubProfile {
  id: string;
  label: string;
  owner: string;
  hasToken: boolean;
  createdAt: string;
}

export interface SaveGitHubProfileRequest {
  id?: string;
  label: string;
  owner: string;
  /** Omitted on update = keep the existing encrypted token. Required when creating a profile. */
  token?: string;
}

export interface TestConnectionRequest {
  owner: string;
  repo: string;
  token: string;
}

export interface TestConnectionResponse {
  exists: boolean;
  canPush: boolean;
  defaultBranch: string | null;
  errorMessage?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  iconPath: string | null;
  /** Resolved read-only for display; recomputed on each fetch from iconPath, never persisted. */
  iconDataUrl: string | null;
  workingDirectory: string;
  stagingFolderName: string;
  rawManifestFileName: string | null;
  githubProfileId: string;
  repo: string;
  downloadUrl: string | null;
  currentVersion: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveProjectRequest {
  id?: string;
  name: string;
  description: string;
  iconPath: string | null;
  workingDirectory: string;
  stagingFolderName: string;
  rawManifestFileName: string | null;
  githubProfileId: string;
  repo: string;
  downloadUrl: string | null;
}

export interface PickedFile {
  path: string;
  name: string;
  sizeBytes: number;
}

/** Raw, minimal manifest optionally auto-detected on drop (see Project.rawManifestFileName) - distinct
 * from update-publisher's richer generated ReleaseManifest (which includes hashes/download URLs). */
export interface ReleaseManifest {
  version: string;
  title: string;
  changelog: string;
  files: PickedFile[];
}

export interface PublishRunRequest {
  projectId: string;
  version: string;
  title: string;
  changelog: string;
  filePaths: string[];
  prerelease?: boolean;
  verifyAll?: boolean;
}

export type PublishRunResponse =
  | { success: true; releaseUrl: string; verified: boolean }
  | { success: false; errorMessage: string };

export type PublishProgressEvent =
  | { phase: "validating"; message: string }
  | { phase: "hashing"; fileName: string }
  | { phase: "creating-release"; message: string }
  | { phase: "uploading"; fileName: string; transferredBytes: number; totalBytes: number }
  | { phase: "uploaded"; fileName: string }
  | { phase: "verifying"; fileName: string }
  | { phase: "done"; message: string };

export interface PublishHistoryEntry {
  version: string;
  title: string;
  publishedAt: string;
  status: "success" | "failed";
  releaseUrl?: string;
  errorMessage?: string;
  fileNames: string[];
  verified?: boolean;
}
