import type { DiagnosePhotoResponse, PhotoDiagnosisCorrection, PhotoDiagnosisResult, PrintDefectId } from "../../shared/ipc-types.js";
import * as providerStore from "./provider-store.js";
import { chatComplete } from "./provider-client.js";

const DEFECT_IDS: PrintDefectId[] = [
  "stringing",
  "elephantFoot",
  "warping",
  "layerShift",
  "overExtrusion",
  "underExtrusion",
  "poorAdhesion",
  "poorBridging",
  "none",
  "other",
];

/** Only these GeneratedConfig keys are safe to auto-adjust - every one is always present in a
 * generated config (baseline rules always set them), so the review screen's updateConfigValue
 * (which no-ops on unknown keys) can apply a correction unconditionally. */
const CORRECTABLE_KEYS = new Set([
  "temperature",
  "bed_temperature",
  "perimeter_speed",
  "infill_speed",
  "travel_speed",
  "bridge_speed",
  "min_fan_speed",
  "max_fan_speed",
  "default_acceleration",
  "fill_density",
  "brim_width",
  "skirts",
]);

function buildPrompt(language: "fr" | "en"): string {
  const outputLanguage = language === "en" ? "English" : "French";
  return `You are an expert 3D printing failure analyst. You are shown a photo of a 3D printed part (or a print in progress). Identify the single most visible print defect from this exact list: ${DEFECT_IDS.join(", ")} (use "none" if the print looks clean, "other" for a real defect not covered by the list).
Respond with ONLY a JSON object (no markdown fences, no text outside the JSON) with this exact shape:
{
  "defectId": "<one value from the list above>",
  "defectLabel": "<short human-readable name, in ${outputLanguage}>",
  "confidencePercent": <integer 0-100>,
  "explanation": "<1-2 sentences in ${outputLanguage}: what you see and what typically causes it>",
  "corrections": [{"parameterKey": "<key>", "deltaValue": <number>, "label": "<short ${outputLanguage} label for this setting>"}],
  "additionalAdvice": "<optional short ${outputLanguage} sentence for advice outside the correctable settings below - omit the field if not needed>"
}
Only use "parameterKey" values from this exact list: ${Array.from(CORRECTABLE_KEYS).join(", ")}.
"deltaValue" is a relative adjustment to the current value (e.g. -5 for temperature means "decrease nozzle temperature by 5°C"; positive values for a speed key mean "increase by that many mm/s"). Only include corrections that meaningfully address the defect - an empty array is fine if none of the listed keys apply, put general guidance in "additionalAdvice" instead. If the print looks clean ("none"), return an empty corrections array and a reassuring explanation.`;
}

interface RawCorrection {
  parameterKey?: unknown;
  deltaValue?: unknown;
  label?: unknown;
}

function parseCorrections(raw: unknown): PhotoDiagnosisCorrection[] {
  if (!Array.isArray(raw)) return [];
  const corrections: PhotoDiagnosisCorrection[] = [];
  for (const entry of raw as RawCorrection[]) {
    if (typeof entry !== "object" || entry === null) continue;
    const { parameterKey, deltaValue, label } = entry;
    if (typeof parameterKey !== "string" || !CORRECTABLE_KEYS.has(parameterKey)) continue;
    if (typeof deltaValue !== "number" || !Number.isFinite(deltaValue)) continue;
    corrections.push({ parameterKey, deltaValue, label: typeof label === "string" && label ? label : parameterKey });
  }
  return corrections;
}

function parseResult(raw: string): PhotoDiagnosisResult | null {
  try {
    const jsonMatch = /\{[\s\S]*\}/.exec(raw);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as {
      defectId?: unknown;
      defectLabel?: unknown;
      confidencePercent?: unknown;
      explanation?: unknown;
      corrections?: unknown;
      additionalAdvice?: unknown;
    };
    if (typeof parsed.defectId !== "string" || !DEFECT_IDS.includes(parsed.defectId as PrintDefectId)) return null;
    const defectId = parsed.defectId as PrintDefectId;
    return {
      defectId,
      defectLabel: typeof parsed.defectLabel === "string" && parsed.defectLabel ? parsed.defectLabel : defectId,
      confidencePercent:
        typeof parsed.confidencePercent === "number" ? Math.max(0, Math.min(100, Math.round(parsed.confidencePercent))) : 50,
      explanation: typeof parsed.explanation === "string" ? parsed.explanation : "",
      corrections: parseCorrections(parsed.corrections),
      additionalAdvice: typeof parsed.additionalAdvice === "string" && parsed.additionalAdvice ? parsed.additionalAdvice : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Cloud-only by design: there is no local vision model, so unlike text-intent resolution this
 * has no on-device fallback. Requires the user to have configured and selected a default AI
 * provider in Settings - the caller surfaces that requirement as a normal (non-error) message.
 */
export async function diagnosePrintPhoto(imageBase64: string, mimeType: string, language: "fr" | "en"): Promise<DiagnosePhotoResponse> {
  const providerId = await providerStore.getDefaultProviderId();
  if (!providerId) {
    return {
      success: false,
      message:
        language === "en"
          ? "No AI provider configured. Add one in Settings → API Keys to use the photo diagnosis."
          : "Aucun fournisseur IA configuré. Ajoutez-en un dans Paramètres → Clés API pour utiliser le diagnostic photo.",
    };
  }

  try {
    const apiKey = await providerStore.resolveApiKey(providerId);
    const config = await providerStore.getStoredProviderConfig(providerId);
    const raw = await chatComplete(providerId, {
      apiKey,
      model: config?.model,
      baseUrl: config?.baseUrl,
      prompt: buildPrompt(language),
      image: { base64: imageBase64, mimeType },
    });
    const result = parseResult(raw);
    if (!result) {
      return {
        success: false,
        message:
          language === "en"
            ? "Couldn't parse the AI's response. Try again, or switch providers in Settings."
            : "Réponse de l'IA illisible. Réessayez, ou changez de fournisseur dans Paramètres.",
      };
    }
    return { success: true, result };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : String(err) };
  }
}
