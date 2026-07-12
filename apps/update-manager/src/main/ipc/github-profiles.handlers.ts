import { ipcMain } from "electron";
import { getRepoInfo } from "@layerai/update-publisher";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type { GitHubProfile, SaveGitHubProfileRequest, TestConnectionRequest, TestConnectionResponse } from "../../shared/ipc-types.js";
import * as projectStore from "../project-store.js";

export function registerGitHubProfilesHandlers(): void {
  ipcMain.handle(IpcChannels.githubProfilesList, async (): Promise<GitHubProfile[]> => projectStore.listGitHubProfiles());

  ipcMain.handle(IpcChannels.githubProfilesCreate, async (_event, request: SaveGitHubProfileRequest): Promise<GitHubProfile> =>
    projectStore.saveGitHubProfile(request)
  );

  ipcMain.handle(IpcChannels.githubProfilesUpdate, async (_event, request: SaveGitHubProfileRequest): Promise<GitHubProfile> => {
    if (!request.id) throw new Error("Identifiant de compte manquant pour la mise à jour.");
    return projectStore.saveGitHubProfile(request);
  });

  ipcMain.handle(IpcChannels.githubProfilesDelete, async (_event, id: string): Promise<void> => projectStore.deleteGitHubProfile(id));

  ipcMain.handle(
    IpcChannels.githubProfilesTestConnection,
    async (_event, request: TestConnectionRequest): Promise<TestConnectionResponse> => {
      try {
        const info = await getRepoInfo(request);
        return info;
      } catch (error) {
        return {
          exists: false,
          canPush: false,
          defaultBranch: null,
          errorMessage: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );
}
