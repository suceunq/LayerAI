import { ipcMain } from "electron";
import { IpcChannels } from "../../shared/ipc-channels.js";

/** Wired up fully once packages/threemf-writer and packages/pdf-report land. */
export function registerExportHandlers(): void {
  ipcMain.handle(IpcChannels.exportThreeMf, async () => {
    throw new Error("export:threemf not implemented yet");
  });

  ipcMain.handle(IpcChannels.exportPdfReport, async () => {
    throw new Error("export:pdf-report not implemented yet");
  });
}
