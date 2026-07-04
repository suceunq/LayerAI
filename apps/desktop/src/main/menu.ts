import { Menu, app, shell, dialog, BrowserWindow } from "electron";
import { autoUpdater } from "electron-updater";
import { IpcChannels } from "../shared/ipc-channels.js";

function sendToRenderer(action: string): void {
  const window = BrowserWindow.getAllWindows()[0];
  window?.webContents.send(IpcChannels.menuAction, action);
}

function checkForUpdates(): void {
  if (!app.isPackaged) {
    void dialog.showMessageBox({
      type: "info",
      message: "Vérification des mises à jour indisponible",
      detail: "Cette fonctionnalité n'est disponible que dans la version installée de LayerAI.",
    });
    return;
  }
  autoUpdater.checkForUpdatesAndNotify().catch(() => {
    // No update feed configured yet, or network unavailable - fails harmlessly.
  });
}

export function buildAppMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "Fichier",
      submenu: [
        { label: "Nouveau", accelerator: "CmdOrCtrl+N", click: () => sendToRenderer("file:new") },
        { label: "Ouvrir…", accelerator: "CmdOrCtrl+O", click: () => sendToRenderer("file:open") },
        { label: "Enregistrer (.3mf)", accelerator: "CmdOrCtrl+S", click: () => sendToRenderer("file:save") },
        { type: "separator" },
        {
          label: "Exporter",
          submenu: [
            { label: "Rapport PDF…", click: () => sendToRenderer("file:export-pdf") },
            { label: "Profil PrusaSlicer (.ini)…", click: () => sendToRenderer("file:export-ini") },
          ],
        },
        { type: "separator" },
        { role: "quit", label: "Quitter" },
      ],
    },
    {
      label: "Édition",
      submenu: [
        { role: "undo", label: "Annuler" },
        { role: "redo", label: "Rétablir" },
        { type: "separator" },
        { label: "Préférences…", click: () => sendToRenderer("edit:preferences") },
      ],
    },
    {
      label: "Outils",
      submenu: [
        { label: "Optimisation automatique", click: () => sendToRenderer("tools:auto-optimize") },
        { label: "Réparation du modèle", click: () => sendToRenderer("tools:repair") },
        { label: "Mise à l'échelle…", click: () => sendToRenderer("tools:scale") },
      ],
    },
    {
      label: "Affichage",
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
      label: "Aide",
      submenu: [
        { label: "Vérifier les mises à jour", click: checkForUpdates },
        { label: "Documentation", click: () => sendToRenderer("help:docs") },
        { label: "Tutoriels", click: () => sendToRenderer("help:tutorials") },
        {
          label: "Signaler un problème…",
          click: () => shell.openExternal("mailto:?subject=LayerAI%20%E2%80%94%20Signalement%20de%20probl%C3%A8me"),
        },
        { type: "separator" },
        { label: "À propos de LayerAI", click: () => sendToRenderer("help:about") },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  app.setName("LayerAI");
}
