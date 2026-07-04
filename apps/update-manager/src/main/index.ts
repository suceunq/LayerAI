import { app, BrowserWindow, shell } from "electron";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { registerPublishHandlers } from "./ipc/publish.handlers.js";

const isDev = !app.isPackaged;

if (isDev) {
  app.commandLine.appendSwitch("remote-debugging-port", "9223");
}

function resolveDevIconPath(): string | undefined {
  const iconPath = join(__dirname, "../../resources/icon.png");
  return existsSync(iconPath) ? iconPath : undefined;
}

function createMainWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 980,
    height: 760,
    minWidth: 780,
    minHeight: 560,
    show: false,
    backgroundColor: "#0B0B0D",
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

app.whenReady().then(() => {
  if (process.platform === "win32") app.setAppUserModelId("com.layerai.updatemanager");
  app.setName("LayerAI Update Manager");

  registerPublishHandlers();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
