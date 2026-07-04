import { Menu, app, shell, dialog, BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";
import { IpcChannels } from "../shared/ipc-channels.js";
import type { SupportedLanguage } from "../shared/ipc-types.js";
import { MENU_TRANSLATIONS, type MenuLabels } from "../shared/menu-translations.js";

function sendToRenderer(action: string): void {
  const window = BrowserWindow.getAllWindows()[0];
  window?.webContents.send(IpcChannels.menuAction, action);
}

function checkForUpdates(m: MenuLabels): void {
  if (!app.isPackaged) {
    void dialog.showMessageBox({
      type: "info",
      message: m.updatesUnavailableTitle,
      detail: m.updatesUnavailableDetail,
    });
    return;
  }
  autoUpdater.checkForUpdatesAndNotify().catch(() => {
    // No update feed configured yet, or network unavailable - fails harmlessly.
  });
}

export function buildAppMenu(language: SupportedLanguage = "fr"): void {
  const m = MENU_TRANSLATIONS[language];

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: m.file,
      submenu: [
        { label: m.fileNew, accelerator: "CmdOrCtrl+N", click: () => sendToRenderer("file:new") },
        { label: m.fileOpen, accelerator: "CmdOrCtrl+O", click: () => sendToRenderer("file:open") },
        { label: m.fileSave, accelerator: "CmdOrCtrl+S", click: () => sendToRenderer("file:save") },
        { type: "separator" },
        {
          label: m.fileExport,
          submenu: [
            { label: m.fileExportPdf, click: () => sendToRenderer("file:export-pdf") },
            { label: m.fileExportIni, click: () => sendToRenderer("file:export-ini") },
          ],
        },
        { type: "separator" },
        { role: "quit", label: m.fileQuit },
      ],
    },
    {
      label: m.edit,
      submenu: [
        { role: "undo", label: m.editUndo },
        { role: "redo", label: m.editRedo },
        { type: "separator" },
        { label: m.editPreferences, click: () => sendToRenderer("edit:preferences") },
      ],
    },
    {
      label: m.tools,
      submenu: [
        { label: m.toolsAutoOptimize, click: () => sendToRenderer("tools:auto-optimize") },
        { label: m.toolsRepair, click: () => sendToRenderer("tools:repair") },
        { label: m.toolsScale, click: () => sendToRenderer("tools:scale") },
      ],
    },
    {
      label: m.view,
      submenu: [
        { role: "reload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: m.help,
      submenu: [
        { label: m.helpCheckUpdates, click: () => checkForUpdates(m) },
        { label: m.helpDocs, click: () => sendToRenderer("help:docs") },
        { label: m.helpTutorials, click: () => sendToRenderer("help:tutorials") },
        {
          label: m.helpReportIssue,
          click: () => shell.openExternal("mailto:?subject=LayerAI%20%E2%80%94%20Signalement%20de%20probl%C3%A8me"),
        },
        { type: "separator" },
        { label: m.helpAbout, click: () => sendToRenderer("help:about") },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  app.setName("LayerAI");
}
