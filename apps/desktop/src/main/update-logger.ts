import { app } from "electron";
import { appendFile, mkdir, rename, stat } from "node:fs/promises";
import { dirname, join } from "node:path";

const MAX_LOG_BYTES = 2 * 1024 * 1024;
let writeQueue: Promise<void> = Promise.resolve();

function logPath(): string {
  return join(app.getPath("userData"), "logs", "updates.log");
}

async function rotateIfNeeded(path: string): Promise<void> {
  try {
    if ((await stat(path)).size < MAX_LOG_BYTES) return;
    await rename(path, `${path}.1`).catch(() => undefined);
  } catch {
    // The file does not exist yet.
  }
}

export function logUpdate(level: "info" | "warn" | "error", event: string, details?: unknown): void {
  const path = logPath();
  const entry = JSON.stringify({ timestamp: new Date().toISOString(), level, event, details }) + "\n";
  writeQueue = writeQueue
    .then(async () => {
      await mkdir(dirname(path), { recursive: true });
      await rotateIfNeeded(path);
      await appendFile(path, entry, "utf-8");
    })
    .catch(() => undefined);
}

export const updaterLogger = {
  info(message?: unknown): void {
    logUpdate("info", "electron-updater", message);
  },
  warn(message?: unknown): void {
    logUpdate("warn", "electron-updater", message);
  },
  error(message?: unknown): void {
    logUpdate("error", "electron-updater", message);
  },
};

