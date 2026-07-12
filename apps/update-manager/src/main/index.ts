import { app, BrowserWindow, shell, Menu, type MenuItemConstructorOptions } from "electron";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { registerPublishHandlers } from "./ipc/publish.handlers.js";
import { registerProjectsHandlers } from "./ipc/projects.handlers.js";
import { registerGitHubProfilesHandlers } from "./ipc/github-profiles.handlers.js";
import { hasCliFlags, runCli } from "./cli-entry.js";

const isDev = !app.isPackaged;

// Must run before whenReady(): Electron resolves the userData path (where the project store and
// history live) from app.name as soon as the app becomes ready, using the raw package.json name
// ("@layerai/update-manager") if setName() hasn't already overridden it by then.
if (process.platform === "win32") app.setAppUserModelId("com.updatemanager.app");
app.setName("Update Manager");

if (isDev) {
  app.commandLine.appendSwitch("remote-debugging-port", "9223");
}

function resolveDevIconPath(): string | undefined {
  const iconPath = join(__dirname, "../../resources/icon.png");
  return existsSync(iconPath) ? iconPath : undefined;
}

/** Electron shows no context menu by default - build a standard edit menu (Cut/Copy/Paste/Select All,
 * plus Undo/Redo while editing) so right-click behaves normally in text fields and textareas. */
function attachEditContextMenu(window: BrowserWindow): void {
  window.webContents.on("context-menu", (_event, params) => {
    const items: MenuItemConstructorOptions[] = [];

    if (params.isEditable) {
      items.push(
        { role: "undo", enabled: params.editFlags.canUndo },
        { role: "redo", enabled: params.editFlags.canRedo },
        { type: "separator" },
        { role: "cut", enabled: params.editFlags.canCut },
        { role: "copy", enabled: params.editFlags.canCopy },
        { role: "paste", enabled: params.editFlags.canPaste },
        { type: "separator" },
        { role: "selectAll", enabled: params.editFlags.canSelectAll }
      );
    } else if (params.selectionText) {
      items.push({ role: "copy" });
    }

    if (items.length > 0) Menu.buildFromTemplate(items).popup({ window });
  });
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

  attachEditContextMenu(mainWindow);

  if (isDev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  // A CLI invocation (`electron . -- --project ...` or the packaged exe with the same flags) publishes
  // headlessly and exits - it never opens a window. Detecting it requires safeStorage/project-store,
  // both only available inside a running Electron process, hence this runs from here rather than tsx.
  if (hasCliFlags(process.argv)) {
    const code = await runCli(process.argv);
    app.exit(code);
    return;
  }

  registerPublishHandlers();
  registerProjectsHandlers();
  registerGitHubProfilesHandlers();
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
