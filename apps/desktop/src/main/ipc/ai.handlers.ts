import { ipcMain } from "electron";
import { IpcChannels } from "../../shared/ipc-channels.js";
import type {
  AiSettingsPublic,
  DiagnosePhotoRequest,
  DiagnosePhotoResponse,
  SaveAiProviderRequest,
  TestAiProviderRequest,
  TestAiProviderResponse,
} from "../../shared/ipc-types.js";
import type { AiProviderId } from "../../shared/ai-providers.js";
import * as providerStore from "../ai/provider-store.js";
import { testConnection } from "../ai/provider-client.js";
import { diagnosePrintPhoto } from "../ai/photo-diagnosis.js";
import { validatePhotoPayload, validateProviderBaseUrl, validateProviderText } from "../security/input-policy.js";

export function registerAiHandlers(): void {
  ipcMain.handle(IpcChannels.aiGetSettings, async (): Promise<AiSettingsPublic> => providerStore.getPublicSettings());

  ipcMain.handle(IpcChannels.aiSaveProvider, async (_event, request: SaveAiProviderRequest): Promise<void> => {
    await providerStore.saveProvider({ ...request,
      apiKey: validateProviderText(request.apiKey, "Clé API", 16_384),
      model: validateProviderText(request.model, "Nom du modèle", 256),
      baseUrl: validateProviderBaseUrl(request.id, request.baseUrl),
    });
  });

  ipcMain.handle(IpcChannels.aiDeleteProvider, async (_event, id: AiProviderId): Promise<void> => {
    await providerStore.deleteProvider(id);
  });

  ipcMain.handle(IpcChannels.aiSetDefaultProvider, async (_event, id: AiProviderId | null): Promise<void> => {
    await providerStore.setDefaultProvider(id);
  });

  ipcMain.handle(IpcChannels.aiSetCloudIntentEnabled, async (_event, enabled: boolean): Promise<void> => {
    await providerStore.setCloudIntentEnabled(enabled);
  });

  ipcMain.handle(IpcChannels.aiTestProvider, async (_event, request: TestAiProviderRequest): Promise<TestAiProviderResponse> => {
    const apiKey = await providerStore.resolveApiKey(request.id, request.apiKey);
    const stored = await providerStore.getStoredProviderConfig(request.id);
    return testConnection(request.id, {
      apiKey,
      model: request.model || stored?.model,
      baseUrl: validateProviderBaseUrl(request.id, request.baseUrl || stored?.baseUrl),
    });
  });

  ipcMain.handle(IpcChannels.aiDiagnosePhoto, async (_event, request: DiagnosePhotoRequest): Promise<DiagnosePhotoResponse> => {
    validatePhotoPayload(request.imageBase64, request.mimeType);
    return diagnosePrintPhoto(request.imageBase64, request.mimeType, request.language);
  });
}
