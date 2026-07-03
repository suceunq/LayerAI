import { ipcMain } from "electron";
import { IpcChannels } from "../../shared/ipc-channels.js";

/**
 * Wired up fully once packages/mesh-analysis, packages/intent-engine and
 * packages/config-generator land (see project task list) - registered here now so the
 * IPC surface and preload API are stable from the start of the renderer build.
 */
export function registerAnalysisHandlers(): void {
  ipcMain.handle(IpcChannels.analysisRun, async () => {
    throw new Error("analysis:run not implemented yet");
  });

  ipcMain.handle(IpcChannels.configGenerate, async () => {
    throw new Error("config:generate not implemented yet");
  });

  ipcMain.handle(IpcChannels.profileDbGetPrinters, async () => {
    const { getAllPrinters } = await import("@layerai/prusa-profile-db");
    return getAllPrinters();
  });

  ipcMain.handle(IpcChannels.profileDbGetFilaments, async () => {
    const { getAllFilaments } = await import("@layerai/prusa-profile-db");
    return getAllFilaments();
  });
}
