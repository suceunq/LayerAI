import { app, shell, BrowserWindow } from "electron";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { registerImportHandlers } from "./ipc/import.handlers.js";
import { registerAnalysisHandlers } from "./ipc/analysis.handlers.js";
import { registerExportHandlers } from "./ipc/export.handlers.js";
import { registerSlicerHandlers } from "./ipc/slicer.handlers.js";
import { registerLearningHandlers } from "./ipc/learning.handlers.js";
import { registerProfilesHandlers } from "./ipc/profiles.handlers.js";
import { registerSettingsHandlers } from "./ipc/settings.handlers.js";
import { registerAiHandlers } from "./ipc/ai.handlers.js";
import { registerUpdateHandlers } from "./ipc/update.handlers.js";
import { buildAppMenu } from "./menu.js";
import { setupAutoUpdater, checkForUpdates } from "./autoUpdater.js";
import { readSettings } from "./settings-store.js";

const isDev = !app.isPackaged;

if (isDev) {
  app.commandLine.appendSwitch("remote-debugging-port", "9222");
}

function resolveDevIconPath(): string | undefined {
  const iconPath = join(__dirname, "../../resources/icon.png");
  return existsSync(iconPath) ? iconPath : undefined;
}

function createMainWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    backgroundColor: "#0B0B0D",
    autoHideMenuBar: false,
    icon: isDev ? resolveDevIconPath() : undefined,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: "detach" });
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (isDev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  if (process.platform === "win32") app.setAppUserModelId("com.layerai.app");

  const settings = await readSettings();
  buildAppMenu(settings.language ?? "fr");
  registerImportHandlers();
  registerAnalysisHandlers();
  registerExportHandlers();
  registerSlicerHandlers();
  registerLearningHandlers();
  registerProfilesHandlers();
  registerSettingsHandlers();
  registerAiHandlers();
  registerUpdateHandlers();

  createMainWindow();

  if (!isDev) {
    setupAutoUpdater();
    if (settings.checkUpdatesOnStartup !== false) void checkForUpdates();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
