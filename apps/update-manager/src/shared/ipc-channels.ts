export const IpcChannels = {
  projectsList: "projects:list",
  projectsGet: "projects:get",
  projectsCreate: "projects:create",
  projectsUpdate: "projects:update",
  projectsDelete: "projects:delete",
  projectsOpenStagingFolder: "projects:openStagingFolder",

  githubProfilesList: "githubProfiles:list",
  githubProfilesCreate: "githubProfiles:create",
  githubProfilesUpdate: "githubProfiles:update",
  githubProfilesDelete: "githubProfiles:delete",
  githubProfilesTestConnection: "githubProfiles:testConnection",

  dialogPickDirectory: "dialog:pickDirectory",
  dialogPickIcon: "dialog:pickIcon",
  filesPick: "files:pick",
  manifestPick: "manifest:pick",
  manifestImport: "manifest:import",
  publishRun: "publish:run",
  publishProgress: "publish:progress",
  historyList: "history:list",
  appGetVersion: "app:get-version",
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];
