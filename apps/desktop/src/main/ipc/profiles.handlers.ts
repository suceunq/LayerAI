import { ipcMain, app } from "electron";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type { CustomProfile, SaveCustomProfileRequest } from "../../shared/ipc-types.js";

function profilesFilePath(): string {
  return join(app.getPath("userData"), "custom-profiles.json");
}

async function readProfiles(): Promise<CustomProfile[]> {
  try {
    const raw = await readFile(profilesFilePath(), "utf-8");
    return JSON.parse(raw) as CustomProfile[];
  } catch {
    return [];
  }
}

async function writeProfiles(profiles: CustomProfile[]): Promise<void> {
  await mkdir(app.getPath("userData"), { recursive: true });
  await writeFile(profilesFilePath(), JSON.stringify(profiles, null, 2), "utf-8");
}

export function registerProfilesHandlers(): void {
  ipcMain.handle(IpcChannels.customProfilesList, async (): Promise<CustomProfile[]> => readProfiles());

  ipcMain.handle(IpcChannels.customProfilesSave, async (_event, request: SaveCustomProfileRequest): Promise<CustomProfile> => {
    const profiles = await readProfiles();
    const profile: CustomProfile = { ...request, id: randomUUID(), createdAt: new Date().toISOString() };
    profiles.push(profile);
    await writeProfiles(profiles);
    return profile;
  });

  ipcMain.handle(IpcChannels.customProfilesDelete, async (_event, id: string): Promise<void> => {
    const profiles = await readProfiles();
    await writeProfiles(profiles.filter((p) => p.id !== id));
  });
}
