import type { SupportedLanguage } from "./ipc-types.js";

export interface MenuLabels {
  file: string;
  fileNew: string;
  fileOpen: string;
  fileSave: string;
  fileExport: string;
  fileExportPdf: string;
  fileExportIni: string;
  fileQuit: string;
  edit: string;
  editUndo: string;
  editRedo: string;
  editPreferences: string;
  tools: string;
  toolsAutoOptimize: string;
  toolsRepair: string;
  toolsScale: string;
  view: string;
  viewReload: string;
  viewToggleDevTools: string;
  viewActualSize: string;
  viewZoomIn: string;
  viewZoomOut: string;
  viewToggleFullScreen: string;
  help: string;
  helpCheckUpdates: string;
  helpDocs: string;
  helpTutorials: string;
  helpAbout: string;
  updatesUnavailableTitle: string;
  updatesUnavailableDetail: string;
}

export const MENU_TRANSLATIONS: Record<SupportedLanguage, MenuLabels> = {
  fr: {
    file: "Fichier",
    fileNew: "Nouveau",
    fileOpen: "Ouvrir…",
    fileSave: "Enregistrer (.3mf)",
    fileExport: "Exporter",
    fileExportPdf: "Rapport PDF…",
    fileExportIni: "Profil PrusaSlicer (.ini)…",
    fileQuit: "Quitter",
    edit: "Édition",
    editUndo: "Annuler",
    editRedo: "Rétablir",
    editPreferences: "Préférences…",
    tools: "Outils",
    toolsAutoOptimize: "Optimisation automatique",
    toolsRepair: "Réparation du modèle",
    toolsScale: "Mise à l'échelle…",
    view: "Affichage",
    viewReload: "Recharger",
    viewToggleDevTools: "Outils de développement",
    viewActualSize: "Taille réelle",
    viewZoomIn: "Zoomer",
    viewZoomOut: "Dézoomer",
    viewToggleFullScreen: "Plein écran",
    help: "Aide",
    helpCheckUpdates: "Vérifier les mises à jour",
    helpDocs: "Documentation",
    helpTutorials: "Tutoriels",
    helpAbout: "À propos de LayerAI",
    updatesUnavailableTitle: "Vérification des mises à jour indisponible",
    updatesUnavailableDetail: "Cette fonctionnalité n'est disponible que dans la version installée de LayerAI.",
  },
  en: {
    file: "File",
    fileNew: "New",
    fileOpen: "Open…",
    fileSave: "Save (.3mf)",
    fileExport: "Export",
    fileExportPdf: "PDF report…",
    fileExportIni: "PrusaSlicer profile (.ini)…",
    fileQuit: "Quit",
    edit: "Edit",
    editUndo: "Undo",
    editRedo: "Redo",
    editPreferences: "Preferences…",
    tools: "Tools",
    toolsAutoOptimize: "Auto-optimize",
    toolsRepair: "Repair model",
    toolsScale: "Scale…",
    view: "View",
    viewReload: "Reload",
    viewToggleDevTools: "Toggle Developer Tools",
    viewActualSize: "Actual Size",
    viewZoomIn: "Zoom In",
    viewZoomOut: "Zoom Out",
    viewToggleFullScreen: "Toggle Full Screen",
    help: "Help",
    helpCheckUpdates: "Check for updates",
    helpDocs: "Documentation",
    helpTutorials: "Tutorials",
    helpAbout: "About LayerAI",
    updatesUnavailableTitle: "Update check unavailable",
    updatesUnavailableDetail: "This feature is only available in the installed version of LayerAI.",
  },
};
