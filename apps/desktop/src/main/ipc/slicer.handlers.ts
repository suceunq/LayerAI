import { ipcMain, dialog, BrowserWindow } from "electron";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildThreeMf } from "@layerai/threemf-writer";
import { getPrinterModel, getFilamentBase } from "@layerai/prusa-profile-db";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type { OpenInSlicerRequest, OpenInSlicerResponse, AppSettings } from "../../shared/ipc-types.js";
import { readSettings, updateSettings } from "../settings-store.js";

interface SlicerTarget {
  displayName: string;
  settingsKey: keyof Pick<AppSettings, "prusaSlicerPath" | "bambuStudioPath" | "crealityPrintPath">;
  candidatePaths: string[];
}

function programFilesDirs(): string[] {
  return [process.env["ProgramFiles"], process.env["ProgramFiles(x86)"], process.env["ProgramW6432"]].filter(
    (p): p is string => Boolean(p),
  );
}

function localAppDataDir(): string | undefined {
  return process.env["LOCALAPPDATA"];
}

interface SlicerDescriptor {
  displayName: string;
  settingsKey: SlicerTarget["settingsKey"];
  /** Install-folder name variants to try under both Program Files and %LOCALAPPDATA%\Programs. */
  folderNames: string[];
  exeName: string;
}

/** Add a new vendor here (one row) rather than a new branch - see slicerTargetFor. */
const SLICER_DESCRIPTORS: Record<string, SlicerDescriptor> = {
  "Bambu Lab": { displayName: "Bambu Studio", settingsKey: "bambuStudioPath", folderNames: ["Bambu Studio"], exeName: "bambu-studio.exe" },
  Creality: {
    displayName: "Creality Print",
    settingsKey: "crealityPrintPath",
    folderNames: ["Creality Print", "CrealityPrint"],
    exeName: "CrealityPrint.exe",
  },
  default: { displayName: "PrusaSlicer", settingsKey: "prusaSlicerPath", folderNames: ["Prusa3D/PrusaSlicer"], exeName: "prusa-slicer.exe" },
};

function slicerTargetFor(vendor: string): SlicerTarget {
  const descriptor = SLICER_DESCRIPTORS[vendor] ?? SLICER_DESCRIPTORS["default"]!;
  const roots = [...programFilesDirs(), ...(localAppDataDir() ? [join(localAppDataDir()!, "Programs")] : [])];
  const candidatePaths = roots.flatMap((root) => descriptor.folderNames.map((folder) => join(root, folder, descriptor.exeName)));
  return { displayName: descriptor.displayName, settingsKey: descriptor.settingsKey, candidatePaths };
}

async function locateSlicerExecutable(target: SlicerTarget, window: BrowserWindow | null): Promise<string | null> {
  const settings = await readSettings();
  const storedPath = settings[target.settingsKey];
  if (storedPath && existsSync(storedPath)) return storedPath;

  for (const candidate of target.candidatePaths) {
    if (existsSync(candidate)) return candidate;
  }

  const dialogOptions: Electron.OpenDialogOptions = {
    title: `${target.displayName} introuvable — sélectionnez son exécutable`,
    filters: [{ name: "Exécutable", extensions: ["exe"] }],
    properties: ["openFile"],
  };
  const result = window ? await dialog.showOpenDialog(window, dialogOptions) : await dialog.showOpenDialog(dialogOptions);
  if (result.canceled || !result.filePaths[0]) return null;

  const chosenPath = result.filePaths[0];
  await updateSettings({ [target.settingsKey]: chosenPath });
  return chosenPath;
}

export function registerSlicerHandlers(): void {
  ipcMain.handle(IpcChannels.slicerOpen, async (event, request: OpenInSlicerRequest): Promise<OpenInSlicerResponse> => {
    const printer = getPrinterModel(request.printerId);
    const filament = getFilamentBase(request.filamentId);
    if (!printer) return { opened: false, canceled: false, message: `Imprimante inconnue : ${request.printerId}` };
    if (!filament) return { opened: false, canceled: false, message: `Filament inconnu : ${request.filamentId}` };

    const target = slicerTargetFor(printer.vendor);
    const window = BrowserWindow.fromWebContents(event.sender);

    let executablePath: string | null;
    try {
      executablePath = await locateSlicerExecutable(target, window);
    } catch (err) {
      return { opened: false, canceled: false, message: err instanceof Error ? err.message : String(err) };
    }
    if (!executablePath) return { opened: false, canceled: true };

    try {
      const bytes = await buildThreeMf({
        geometry: request.geometry,
        config: request.config,
        printer,
        filament,
        objectName: request.objectName,
        positions: request.positions,
      });
      const tempDir = join(tmpdir(), "layerai");
      await mkdir(tempDir, { recursive: true });
      const tempFilePath = join(tempDir, `${(request.objectName ?? "projet-layerai").replace(/[^a-z0-9_-]+/gi, "_")}.3mf`);
      await writeFile(tempFilePath, bytes);

      const child = spawn(executablePath, [tempFilePath], { detached: true, stdio: "ignore" });
      child.on("error", () => {});
      child.unref();
      return { opened: true, slicerName: target.displayName };
    } catch (err) {
      return { opened: false, canceled: false, message: err instanceof Error ? err.message : String(err) };
    }
  });
}
