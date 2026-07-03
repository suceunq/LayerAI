import { autoUpdater } from "electron-updater";

/**
 * Checks for updates on startup when packaged. No publish/feed is configured yet (see
 * electron-builder.yml `publish: null`) - until a real distribution channel (e.g. GitHub
 * Releases) is set up, this call fails harmlessly and is swallowed rather than surfaced to the
 * user, since "no updates configured" isn't an error worth interrupting the app for.
 */
export function setupAutoUpdater(): void {
  autoUpdater.autoDownload = false;
  autoUpdater.checkForUpdatesAndNotify().catch(() => {
    // No update feed configured yet - expected until a release channel is set up.
  });
}
