import type {
  PickedFile,
  PublisherConfig,
  PublishHistoryEntry,
  PublishProgressEvent,
  PublishRunRequest,
  PublishRunResponse,
  SavePublisherConfigRequest,
} from "../shared/ipc-types.js";

export interface UpdateManagerApi {
  getConfig: () => Promise<PublisherConfig>;
  saveConfig: (request: SavePublisherConfigRequest) => Promise<void>;
  pickFiles: () => Promise<PickedFile[]>;
  publish: (request: PublishRunRequest) => Promise<PublishRunResponse>;
  getHistory: () => Promise<PublishHistoryEntry[]>;
  getAppVersion: () => Promise<string>;
  onPublishProgress: (callback: (event: PublishProgressEvent) => void) => () => void;
}
