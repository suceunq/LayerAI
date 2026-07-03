import { Menu, app, shell } from "electron";

export function buildAppMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: "LayerAI",
      submenu: [{ role: "about" }, { type: "separator" }, { role: "quit" }],
    },
    {
      label: "Édition",
      submenu: [{ role: "undo" }, { role: "redo" }, { type: "separator" }, { role: "cut" }, { role: "copy" }, { role: "paste" }],
    },
    {
      label: "Affichage",
      submenu: [{ role: "reload" }, { role: "toggleDevTools" }, { type: "separator" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { type: "separator" }, { role: "togglefullscreen" }],
    },
    {
      label: "Aide",
      submenu: [
        {
          label: "À propos de PrusaSlicer",
          click: () => shell.openExternal("https://www.prusa3d.com/prusaslicer/"),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  app.setName("LayerAI");
}
