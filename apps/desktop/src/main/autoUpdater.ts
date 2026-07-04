import { app, BrowserWindow } from "electron";
import { autoUpdater, CancellationToken } from "electron-updater";
import { IpcChannels } from "../shared/ipc-channels.js";
import type { UpdateState } from "../shared/ipc-types.js";

let state: UpdateState = { status: "idle", currentVersion: app.getVersion() };
let cancellationToken: CancellationToken | null = null;

function broadcast(): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(IpcChannels.updateStateChanged, state);
  }
}

function setState(patch: Partial<UpdateState>): void {
  state = { ...state, ...patch };
  broadcast();
}

/**
 * Wires electron-updater's events into a single UpdateState broadcast to every renderer window.
 * autoDownload stays false so a download only ever starts from an explicit user action (via
 * downloadUpdate), which is what makes cancelDownload's CancellationToken meaningful.
 */
export function setupAutoUpdater(): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on("checking-for-update", () => {
    setState({ status: "checking", errorMessage: undefined });
  });

  autoUpdater.on("update-available", (info) => {
    setState({
      status: "available",
      availableVersion: info.version,
      releaseNotes: typeof info.releaseNotes === "string" ? info.releaseNotes : undefined,
    });
  });

  autoUpdater.on("update-not-available", () => {
    setState({ status: "not-available", availableVersion: undefined });
  });

  autoUpdater.on("download-progress", (progress) => {
    setState({
      status: "downloading",
      progressPercent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      totalBytes: progress.total,
      transferredBytes: progress.transferred,
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    setState({ status: "downloaded", availableVersion: info.version, progressPercent: 100 });
  });

  autoUpdater.on("error", (error) => {
    setState({ status: "error", errorMessage: error.message });
  });
}

export function getUpdateState(): UpdateState {
  return state;
}

export async function checkForUpdates(): Promise<void> {
  if (!app.isPackaged) {
    setState({ status: "dev-unavailable" });
    return;
  }
  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    setState({ status: "error", errorMessage: error instanceof Error ? error.message : String(error) });
  }
}

export async function downloadUpdate(): Promise<void> {
  if (!app.isPackaged) return;
  cancellationToken = new CancellationToken();
  try {
    await autoUpdater.downloadUpdate(cancellationToken);
  } catch (error) {
    if (!cancellationToken.cancelled) {
      setState({ status: "error", errorMessage: error instanceof Error ? error.message : String(error) });
    }
  } finally {
    cancellationToken = null;
  }
}

export function cancelDownload(): void {
  cancellationToken?.cancel();
  setState({ status: "available", progressPercent: undefined, bytesPerSecond: undefined, transferredBytes: undefined });
}

export function installUpdate(): void {
  autoUpdater.quitAndInstall();
}
