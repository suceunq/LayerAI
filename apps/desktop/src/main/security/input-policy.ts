import type { AiProviderId } from "../../shared/ai-providers.js";
import { mainT } from "../localization.js";

export const MAX_MODEL_FILE_BYTES = 250 * 1024 * 1024;
export const MAX_PHOTO_BYTES = 12 * 1024 * 1024;
export const ALLOWED_PHOTO_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateProviderBaseUrl(providerId: AiProviderId, rawUrl: string | undefined): string | undefined {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > 2048) throw new Error(mainT("native.server.tooLong"));
  let url: URL;
  try { url = new URL(trimmed); } catch { throw new Error(mainT("native.server.invalid")); }
  if (url.username || url.password) throw new Error(mainT("native.server.credentials"));
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error(mainT("native.server.httpOnly"));
  if (providerId === "lmstudio") {
    const host = url.hostname.toLowerCase();
    if (!new Set(["localhost", "127.0.0.1", "::1", "[::1]"]).has(host)) {
      throw new Error(mainT("native.server.localOnly"));
    }
  } else if (url.protocol !== "https:") {
    throw new Error(mainT("native.server.httpsRequired"));
  }
  return url.toString().replace(/\/$/, "");
}

export function validateProviderText(value: string | undefined, label: string, maxLength: number): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > maxLength || /[\u0000-\u001f\u007f]/.test(trimmed)) throw new Error(mainT("native.field.invalid", { label }));
  return trimmed;
}

export function validatePhotoPayload(imageBase64: string, mimeType: string): void {
  if (!ALLOWED_PHOTO_MIME_TYPES.has(mimeType)) throw new Error(mainT("native.photo.invalidType"));
  if (!/^[a-zA-Z0-9+/]*={0,2}$/.test(imageBase64)) throw new Error(mainT("native.photo.invalidEncoding"));
  const padding = imageBase64.endsWith("==") ? 2 : imageBase64.endsWith("=") ? 1 : 0;
  const byteLength = Math.floor((imageBase64.length * 3) / 4) - padding;
  if (byteLength <= 0 || byteLength > MAX_PHOTO_BYTES) throw new Error(mainT("native.photo.tooLarge"));
  const header = Buffer.from(imageBase64.slice(0, 32), "base64");
  const validSignature = mimeType === "image/jpeg"
    ? header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff
    : mimeType === "image/png"
      ? header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      : header.subarray(0, 4).toString("ascii") === "RIFF" && header.subarray(8, 12).toString("ascii") === "WEBP";
  if (!validSignature) throw new Error(mainT("native.photo.signatureMismatch"));
}
