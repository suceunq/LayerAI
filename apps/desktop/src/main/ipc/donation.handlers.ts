import { ipcMain, shell } from "electron";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type { DonationConfigResponse, DonationSettingsRequest } from "../../shared/ipc-types.js";
import { resolveDonationConfig } from "../donation-config.js";
import { mainT } from "../localization.js";
import { updateSettings } from "../settings-store.js";

export function registerDonationHandlers(): void {
  ipcMain.handle(IpcChannels.donationGetConfig, async (): Promise<DonationConfigResponse> => ({
    configured: Boolean((await resolveDonationConfig()).url),
  }));

  ipcMain.handle(IpcChannels.settingsSetDonation, async (_event, request: DonationSettingsRequest): Promise<DonationConfigResponse> => {
    await updateSettings({ showWelcomeOnStartup: request.showWelcomeOnStartup });
    return { configured: Boolean((await resolveDonationConfig()).url) };
  });

  ipcMain.handle(IpcChannels.donationOpen, async (): Promise<boolean> => {
    const config = await resolveDonationConfig();
    if (!config.url) throw new Error(mainT("native.donation.notConfigured"));
    await shell.openExternal(config.url);
    return true;
  });
}
