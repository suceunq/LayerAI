export type AiProviderId = "anthropic" | "openai" | "gemini" | "openrouter" | "mistral" | "lmstudio";

export interface AiProviderMeta {
  id: AiProviderId;
  displayName: string;
  docsUrl: string;
  defaultModel: string;
  requiresApiKey: boolean;
  defaultBaseUrl?: string;
  costHint: string;
}

export const AI_PROVIDERS: AiProviderMeta[] = [
  {
    id: "anthropic",
    displayName: "Anthropic (Claude)",
    docsUrl: "https://console.anthropic.com/settings/keys",
    defaultModel: "claude-3-5-haiku-latest",
    requiresApiKey: true,
    costHint: "~0.001 $ / 1k tokens",
  },
  {
    id: "openai",
    displayName: "OpenAI",
    docsUrl: "https://platform.openai.com/api-keys",
    defaultModel: "gpt-4o-mini",
    requiresApiKey: true,
    costHint: "~0.00015 $ / 1k tokens",
  },
  {
    id: "gemini",
    displayName: "Google Gemini",
    docsUrl: "https://aistudio.google.com/app/apikey",
    defaultModel: "gemini-1.5-flash",
    requiresApiKey: true,
    costHint: "~0.000075 $ / 1k tokens",
  },
  {
    id: "openrouter",
    displayName: "OpenRouter",
    docsUrl: "https://openrouter.ai/keys",
    defaultModel: "meta-llama/llama-3.1-8b-instruct:free",
    requiresApiKey: true,
    costHint: "Variable selon le modèle",
  },
  {
    id: "mistral",
    displayName: "Mistral AI",
    docsUrl: "https://console.mistral.ai/api-keys",
    defaultModel: "mistral-small-latest",
    requiresApiKey: true,
    costHint: "~0.0002 $ / 1k tokens",
  },
  {
    id: "lmstudio",
    displayName: "LM Studio (local)",
    docsUrl: "https://lmstudio.ai/",
    defaultModel: "",
    requiresApiKey: false,
    defaultBaseUrl: "http://localhost:1234/v1",
    costHint: "Gratuit (local)",
  },
];

export function providerMeta(id: AiProviderId): AiProviderMeta {
  const meta = AI_PROVIDERS.find((p) => p.id === id);
  if (!meta) throw new Error(`Unknown AI provider: ${id}`);
  return meta;
}
