import { providerMeta, type AiProviderId } from "../../shared/ai-providers.js";
import { validateProviderBaseUrl } from "../security/input-policy.js";

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

async function readJson<T>(res: Response): Promise<T> {
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > MAX_RESPONSE_BYTES) throw new Error("Réponse du fournisseur anormalement volumineuse.");
  const text = await res.text();
  if (Buffer.byteLength(text, "utf8") > MAX_RESPONSE_BYTES) throw new Error("Réponse du fournisseur anormalement volumineuse.");
  return JSON.parse(text) as T;
}

interface ChatImage {
  base64: string;
  mimeType: string;
}

interface ChatParams {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  prompt: string;
  image?: ChatImage;
}

async function extractError(res: Response): Promise<string> {
  try {
    const data = await readJson<{ error?: { message?: string }; message?: string }>(res);
    return data.error?.message ?? data.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

async function anthropicChat({ apiKey, model, prompt, image }: ChatParams): Promise<string> {
  if (!apiKey) throw new Error("Clé API manquante");
  const content = image
    ? [{ type: "image", source: { type: "base64", media_type: image.mimeType, data: image.base64 } }, { type: "text", text: prompt }]
    : prompt;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: model || providerMeta("anthropic").defaultModel,
      max_tokens: 512,
      messages: [{ role: "user", content }],
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(await extractError(res));
  const data = await readJson<{ content?: { text?: string }[] }>(res);
  return data.content?.[0]?.text ?? "";
}

async function geminiChat({ apiKey, model, prompt, image }: ChatParams): Promise<string> {
  if (!apiKey) throw new Error("Clé API manquante");
  const modelName = model || providerMeta("gemini").defaultModel;
  const parts = image ? [{ text: prompt }, { inline_data: { mime_type: image.mimeType, data: image.base64 } }] : [{ text: prompt }];
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }] }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(await extractError(res));
  const data = await readJson<{ candidates?: { content?: { parts?: { text?: string }[] } }[] }>(res);
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function openAiCompatibleChat(
  defaultBaseUrl: string,
  defaultModel: string,
  { apiKey, model, baseUrl, prompt, image }: ChatParams
): Promise<string> {
  const base = validateProviderBaseUrl("openai", baseUrl || defaultBaseUrl)!;
  const url = `${base}/chat/completions`;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (apiKey) headers["authorization"] = `Bearer ${apiKey}`;
  const content = image
    ? [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:${image.mimeType};base64,${image.base64}` } }]
    : prompt;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ model: model || defaultModel, messages: [{ role: "user", content }] }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(await extractError(res));
  const data = await readJson<{ choices?: { message?: { content?: string } }[] }>(res);
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * LM Studio's local server has no API key and no fixed model name - whatever the user has
 * loaded inside the LM Studio app is what's available. Sending a made-up model name (e.g.
 * "local-model") silently mismatches and some LM Studio versions respond 200 with an empty
 * completion rather than an error, which looked like a mysterious failure. Querying /v1/models
 * first and using whatever is actually loaded avoids needing a model field at all.
 */
async function lmStudioChat({ model, baseUrl, prompt, image }: ChatParams): Promise<string> {
  const base = validateProviderBaseUrl("lmstudio", baseUrl || providerMeta("lmstudio").defaultBaseUrl || "http://localhost:1234/v1")!;

  let resolvedModel = model;
  if (!resolvedModel) {
    const modelsRes = await fetch(`${base}/models`, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!modelsRes.ok) throw new Error(await extractError(modelsRes));
    const modelsData = await readJson<{ data?: { id?: string }[] }>(modelsRes);
    resolvedModel = modelsData.data?.[0]?.id;
    if (!resolvedModel) throw new Error("Aucun modèle chargé dans LM Studio. Chargez un modèle dans l'application LM Studio, puis réessayez.");
  }

  const content = image
    ? [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:${image.mimeType};base64,${image.base64}` } }]
    : prompt;
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: resolvedModel, messages: [{ role: "user", content }] }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(await extractError(res));
  const data = await readJson<{ choices?: { message?: { content?: string } }[] }>(res);
  return data.choices?.[0]?.message?.content ?? "";
}

export async function chatComplete(id: AiProviderId, params: ChatParams): Promise<string> {
  switch (id) {
    case "anthropic":
      return anthropicChat(params);
    case "gemini":
      return geminiChat(params);
    case "openai":
      return openAiCompatibleChat("https://api.openai.com/v1", providerMeta("openai").defaultModel, params);
    case "openrouter":
      return openAiCompatibleChat("https://openrouter.ai/api/v1", providerMeta("openrouter").defaultModel, params);
    case "mistral":
      return openAiCompatibleChat("https://api.mistral.ai/v1", providerMeta("mistral").defaultModel, params);
    case "lmstudio":
      return lmStudioChat(params);
  }
}

export async function testConnection(
  id: AiProviderId,
  params: Omit<ChatParams, "prompt">
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const reply = await chatComplete(id, { ...params, prompt: "Réponds uniquement par: OK" });
    if (!reply.trim()) throw new Error("Réponse vide du fournisseur");
    return { success: true };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}
