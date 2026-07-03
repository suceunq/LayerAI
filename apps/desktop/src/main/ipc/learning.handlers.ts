import { ipcMain } from "electron";
import { IpcChannels } from "../../shared/ipc-channels.js";

/** Wired up fully once packages/learning-store lands (phase 4). */
export function registerLearningHandlers(): void {
  ipcMain.handle(IpcChannels.learningRecordOutcome, async () => {
    throw new Error("learning:record-outcome not implemented yet");
  });
}
