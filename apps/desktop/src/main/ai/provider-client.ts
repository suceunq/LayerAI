import { providerMeta, type AiProviderId } from "../../shared/ai-providers.js";

interface ChatParams {
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  prompt: string;
}

async function extractError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: { message?: string }; message?: string };
    return data.error?.message ?? data.message ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

async function anthropicChat({ apiKey, model, prompt }: ChatParams): Promise<string> {
  if (!apiKey) throw new Error("Clé API manquante");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: model || providerMeta("anthropic").defaultModel,
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  const data = (await res.json()) as { content?: { text?: string }[] };
  return data.content?.[0]?.text ?? "";
}

async function geminiChat({ apiKey, model, prompt }: ChatParams): Promise<string> {
  if (!apiKey) throw new Error("Clé API manquante");
  const modelName = model || providerMeta("gemini").defaultModel;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function openAiCompatibleChat(defaultBaseUrl: string, defaultModel: string, { apiKey, model, baseUrl, prompt }: ChatParams): Promise<string> {
  const url = `${(baseUrl || defaultBaseUrl).replace(/\/$/, "")}/chat/completions`;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (apiKey) headers["authorization"] = `Bearer ${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ model: model || defaultModel, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

/**
 * LM Studio's local server has no API key and no fixed model name - whatever the user has
 * loaded inside the LM Studio app is what's available. Sending a made-up model name (e.g.
 * "local-model") silently mismatches and some LM Studio versions respond 200 with an empty
 * completion rather than an error, which looked like a mysterious failure. Querying /v1/models
 * first and using whatever is actually loaded avoids needing a model field at all.
 */
async function lmStudioChat({ model, baseUrl, prompt }: ChatParams): Promise<string> {
  const base = (baseUrl || providerMeta("lmstudio").defaultBaseUrl || "http://localhost:1234/v1").replace(/\/$/, "");

  let resolvedModel = model;
  if (!resolvedModel) {
    const modelsRes = await fetch(`${base}/models`);
    if (!modelsRes.ok) throw new Error(await extractError(modelsRes));
    const modelsData = (await modelsRes.json()) as { data?: { id?: string }[] };
    resolvedModel = modelsData.data?.[0]?.id;
    if (!resolvedModel) throw new Error("Aucun modèle chargé dans LM Studio. Chargez un modèle dans l'application LM Studio, puis réessayez.");
  }

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: resolvedModel, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(await extractError(res));
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
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
