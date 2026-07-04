export const IpcChannels = {
  configGet: "config:get",
  configSave: "config:save",
  filesPick: "files:pick",
  publishRun: "publish:run",
  publishProgress: "publish:progress",
  historyList: "history:list",
  appGetVersion: "app:get-version",
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];
