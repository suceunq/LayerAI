import type { SupportedLanguage } from "./ipc-types.js";

export interface MenuLabels {
  file: string;
  fileNew: string;
  fileOpen: string;
  fileSave: string;
  fileExport: string;
  fileExportPdf: string;
  fileExportIni: string;
  fileExportBambu: string;
  fileExportCreality: string;
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
    fileExportBambu: "Profil Bambu Studio (.json)…",
    fileExportCreality: "Profil Creality Print (.json)…",
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
    fileExportBambu: "Bambu Studio profile (.json)…",
    fileExportCreality: "Creality Print profile (.json)…",
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
  de: {
    file: "Datei",
    fileNew: "Neu",
    fileOpen: "Öffnen…",
    fileSave: "Speichern (.3mf)",
    fileExport: "Exportieren",
    fileExportPdf: "PDF-Bericht…",
    fileExportIni: "PrusaSlicer-Profil (.ini)…",
    fileExportBambu: "Bambu-Studio-Profil (.json)…",
    fileExportCreality: "Creality-Print-Profil (.json)…",
    fileQuit: "Beenden",
    edit: "Bearbeiten",
    editUndo: "Rückgängig",
    editRedo: "Wiederholen",
    editPreferences: "Einstellungen…",
    tools: "Werkzeuge",
    toolsAutoOptimize: "Automatisch optimieren",
    toolsRepair: "Modell reparieren",
    toolsScale: "Skalieren…",
    view: "Ansicht",
    viewReload: "Neu laden",
    viewActualSize: "Tatsächliche Größe",
    viewZoomIn: "Vergrößern",
    viewZoomOut: "Verkleinern",
    viewToggleFullScreen: "Vollbild umschalten",
    help: "Hilfe",
    helpCheckUpdates: "Nach Updates suchen",
    helpDocs: "Dokumentation",
    helpTutorials: "Anleitungen",
    helpAbout: "Über LayerAI",
    updatesUnavailableTitle: "Update-Prüfung nicht verfügbar",
    updatesUnavailableDetail: "Diese Funktion ist nur in der installierten Version von LayerAI verfügbar.",
  },
  es: {
    file: "Archivo",
    fileNew: "Nuevo",
    fileOpen: "Abrir…",
    fileSave: "Guardar (.3mf)",
    fileExport: "Exportar",
    fileExportPdf: "Informe PDF…",
    fileExportIni: "Perfil de PrusaSlicer (.ini)…",
    fileExportBambu: "Perfil de Bambu Studio (.json)…",
    fileExportCreality: "Perfil de Creality Print (.json)…",
    fileQuit: "Salir",
    edit: "Editar",
    editUndo: "Deshacer",
    editRedo: "Rehacer",
    editPreferences: "Preferencias…",
    tools: "Herramientas",
    toolsAutoOptimize: "Optimización automática",
    toolsRepair: "Reparar modelo",
    toolsScale: "Escalar…",
    view: "Ver",
    viewReload: "Recargar",
    viewActualSize: "Tamaño real",
    viewZoomIn: "Acercar",
    viewZoomOut: "Alejar",
    viewToggleFullScreen: "Alternar pantalla completa",
    help: "Ayuda",
    helpCheckUpdates: "Buscar actualizaciones",
    helpDocs: "Documentación",
    helpTutorials: "Tutoriales",
    helpAbout: "Acerca de LayerAI",
    updatesUnavailableTitle: "Comprobación de actualizaciones no disponible",
    updatesUnavailableDetail: "Esta función solo está disponible en la versión instalada de LayerAI.",
  },
  it: {
    file: "File",
    fileNew: "Nuovo",
    fileOpen: "Apri…",
    fileSave: "Salva (.3mf)",
    fileExport: "Esporta",
    fileExportPdf: "Rapporto PDF…",
    fileExportIni: "Profilo PrusaSlicer (.ini)…",
    fileExportBambu: "Profilo Bambu Studio (.json)…",
    fileExportCreality: "Profilo Creality Print (.json)…",
    fileQuit: "Esci",
    edit: "Modifica",
    editUndo: "Annulla",
    editRedo: "Ripristina",
    editPreferences: "Preferenze…",
    tools: "Strumenti",
    toolsAutoOptimize: "Ottimizzazione automatica",
    toolsRepair: "Ripara modello",
    toolsScale: "Ridimensiona…",
    view: "Visualizza",
    viewReload: "Ricarica",
    viewActualSize: "Dimensioni effettive",
    viewZoomIn: "Ingrandisci",
    viewZoomOut: "Riduci",
    viewToggleFullScreen: "Attiva/disattiva schermo intero",
    help: "Aiuto",
    helpCheckUpdates: "Controlla aggiornamenti",
    helpDocs: "Documentazione",
    helpTutorials: "Tutorial",
    helpAbout: "Informazioni su LayerAI",
    updatesUnavailableTitle: "Controllo aggiornamenti non disponibile",
    updatesUnavailableDetail: "Questa funzione è disponibile solo nella versione installata di LayerAI.",
  },
};
