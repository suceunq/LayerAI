import type {
  GitHubProfile,
  PickedFile,
  Project,
  PublishHistoryEntry,
  PublishProgressEvent,
  PublishRunRequest,
  PublishRunResponse,
  ReleaseManifest,
  SaveGitHubProfileRequest,
  SaveProjectRequest,
  TestConnectionRequest,
  TestConnectionResponse,
} from "../shared/ipc-types.js";

export interface UpdateManagerApi {
  projects: {
    list: () => Promise<Project[]>;
    get: (id: string) => Promise<Project | undefined>;
    create: (request: SaveProjectRequest) => Promise<Project>;
    update: (request: SaveProjectRequest) => Promise<Project>;
    delete: (id: string) => Promise<void>;
    openStagingFolder: (id: string) => Promise<void>;
  };
  githubProfiles: {
    list: () => Promise<GitHubProfile[]>;
    create: (request: SaveGitHubProfileRequest) => Promise<GitHubProfile>;
    update: (request: SaveGitHubProfileRequest) => Promise<GitHubProfile>;
    delete: (id: string) => Promise<void>;
    testConnection: (request: TestConnectionRequest) => Promise<TestConnectionResponse>;
  };
  history: {
    list: (projectId: string) => Promise<PublishHistoryEntry[]>;
  };
  dialogs: {
    pickDirectory: () => Promise<string | null>;
    pickIcon: () => Promise<string | null>;
  };
  pickFiles: () => Promise<PickedFile[]>;
  pickManifest: () => Promise<string | null>;
  importManifest: (manifestPath: string) => Promise<ReleaseManifest>;
  publish: (request: PublishRunRequest) => Promise<PublishRunResponse>;
  getAppVersion: () => Promise<string>;
  onPublishProgress: (callback: (event: PublishProgressEvent) => void) => () => void;
}
