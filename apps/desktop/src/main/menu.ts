import { Menu, app, BrowserWindow } from "electron";
import { IpcChannels } from "../shared/ipc-channels.js";
import type { SupportedLanguage } from "../shared/ipc-types.js";
import { MENU_TRANSLATIONS } from "../shared/menu-translations.js";

function sendToRenderer(action: string): void {
  const window = BrowserWindow.getAllWindows()[0];
  window?.webContents.send(IpcChannels.menuAction, action);
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
        { role: "reload", label: m.viewReload },
        { role: "toggleDevTools", label: m.viewToggleDevTools },
        { type: "separator" },
        { role: "resetZoom", label: m.viewActualSize },
        { role: "zoomIn", label: m.viewZoomIn },
        { role: "zoomOut", label: m.viewZoomOut },
        { type: "separator" },
        { role: "togglefullscreen", label: m.viewToggleFullScreen },
      ],
    },
    {
      label: m.help,
      submenu: [
        { label: m.helpCheckUpdates, click: () => sendToRenderer("help:check-updates") },
        { label: m.helpDocs, click: () => sendToRenderer("help:docs") },
        { label: m.helpTutorials, click: () => sendToRenderer("help:tutorials") },
        { type: "separator" },
        { label: m.helpAbout, click: () => sendToRenderer("help:about") },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  app.setName("LayerAI");
}
