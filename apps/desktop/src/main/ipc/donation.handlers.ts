import { ipcMain, shell } from "electron";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type { DonationConfigResponse, DonationSettingsRequest } from "../../shared/ipc-types.js";
import { clearDonationConfigMemory, resolveDonationConfig } from "../donation-config.js";
import { mainT } from "../localization.js";
import { readSettings, updateSettings } from "../settings-store.js";
import { parsePayPalDonationUrl } from "../security/donation-url.js";

export function registerDonationHandlers(): void {
  ipcMain.handle(IpcChannels.donationGetConfig, (): Promise<DonationConfigResponse> => resolveDonationConfig());

  ipcMain.handle(IpcChannels.settingsSetDonation, async (_event, request: DonationSettingsRequest): Promise<DonationConfigResponse> => {
    const requestedUrl = request.donationUrl?.trim();
    let donationUrl: string | undefined;
    if (requestedUrl) {
      const parsedUrl = parsePayPalDonationUrl(requestedUrl);
      if (!parsedUrl) throw new Error(mainT("native.donation.invalidUrl"));
      donationUrl = parsedUrl;
    }
    const previous = await readSettings();
    await updateSettings({ donationUrl, showWelcomeOnStartup: request.showWelcomeOnStartup });
    if (previous.donationUrl && !donationUrl) clearDonationConfigMemory();
    return resolveDonationConfig(Boolean(previous.donationUrl && !donationUrl));
  });

  ipcMain.handle(IpcChannels.donationOpen, async (): Promise<boolean> => {
    const config = await resolveDonationConfig();
    if (!config.url) throw new Error(mainT("native.donation.notConfigured"));
    await shell.openExternal(config.url);
    return true;
  });
}
