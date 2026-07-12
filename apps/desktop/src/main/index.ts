import { app, shell, screen, BrowserWindow, nativeTheme } from "electron";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { registerImportHandlers } from "./ipc/import.handlers.js";
import { registerAnalysisHandlers } from "./ipc/analysis.handlers.js";
import { registerExportHandlers } from "./ipc/export.handlers.js";
import { registerSlicerHandlers } from "./ipc/slicer.handlers.js";
import { registerLearningHandlers } from "./ipc/learning.handlers.js";
import { registerProfilesHandlers } from "./ipc/profiles.handlers.js";
import { registerRecentProjectsHandlers } from "./ipc/recent-projects.handlers.js";
import { registerSettingsHandlers } from "./ipc/settings.handlers.js";
import { registerAiHandlers } from "./ipc/ai.handlers.js";
import { registerUpdateHandlers } from "./ipc/update.handlers.js";
import { registerInvoiceHandlers } from "./ipc/invoice.handlers.js";
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
  const { width: workWidth, height: workHeight } = screen.getPrimaryDisplay().workAreaSize;
  const width = Math.min(1440, workWidth);
  const height = Math.min(900, workHeight);
  // Fit within whatever screen the app launches on instead of a fixed 1440x900 - on
  // smaller/lower-resolution displays a hardcoded size clips content (e.g. the header
  // controls) and leaves a gap over the OS taskbar until the window is maximized.
  const shouldMaximize = workWidth <= 1440 || workHeight <= 900;

  const mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: Math.min(1100, workWidth),
    minHeight: Math.min(700, workHeight),
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#0B0B0D" : "#F4F4F6",
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
    if (shouldMaximize) mainWindow.maximize();
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: "detach" });
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    // Only hand off http(s) links to the OS - never let a window-open request pass an arbitrary
    // scheme (file:, custom protocol handlers...) straight to shell.openExternal.
    if (details.url.startsWith("https://") || details.url.startsWith("http://")) {
      shell.openExternal(details.url);
    }
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
  nativeTheme.themeSource = settings.theme ?? "dark";
  buildAppMenu(settings.language ?? "fr");
  registerImportHandlers();
  registerAnalysisHandlers();
  registerExportHandlers();
  registerSlicerHandlers();
  registerLearningHandlers();
  registerProfilesHandlers();
  registerRecentProjectsHandlers();
  registerSettingsHandlers();
  registerAiHandlers();
  registerUpdateHandlers();
  registerInvoiceHandlers();

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
