import type { AiProviderId } from "../../shared/ai-providers.js";

export const MAX_MODEL_FILE_BYTES = 250 * 1024 * 1024;
export const MAX_PHOTO_BYTES = 12 * 1024 * 1024;
export const ALLOWED_PHOTO_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateProviderBaseUrl(providerId: AiProviderId, rawUrl: string | undefined): string | undefined {
  const trimmed = rawUrl?.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > 2048) throw new Error("Adresse de serveur trop longue.");
  let url: URL;
  try { url = new URL(trimmed); } catch { throw new Error("Adresse de serveur invalide."); }
  if (url.username || url.password) throw new Error("L’adresse du serveur ne doit pas contenir d’identifiants.");
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Seules les adresses HTTP(S) sont autorisées.");
  if (providerId === "lmstudio") {
    const host = url.hostname.toLowerCase();
    if (!new Set(["localhost", "127.0.0.1", "::1", "[::1]"]).has(host)) {
      throw new Error("LM Studio doit utiliser un serveur local (localhost)." );
    }
  } else if (url.protocol !== "https:") {
    throw new Error("Une adresse HTTPS est obligatoire pour un fournisseur cloud.");
  }
  return url.toString().replace(/\/$/, "");
}

export function validateProviderText(value: string | undefined, label: string, maxLength: number): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > maxLength || /[\u0000-\u001f\u007f]/.test(trimmed)) throw new Error(`${label} invalide ou trop long.`);
  return trimmed;
}

export function validatePhotoPayload(imageBase64: string, mimeType: string): void {
  if (!ALLOWED_PHOTO_MIME_TYPES.has(mimeType)) throw new Error("Format d’image non autorisé. Utilisez JPEG, PNG ou WebP.");
  if (!/^[a-zA-Z0-9+/]*={0,2}$/.test(imageBase64)) throw new Error("Image encodée invalide.");
  const padding = imageBase64.endsWith("==") ? 2 : imageBase64.endsWith("=") ? 1 : 0;
  const byteLength = Math.floor((imageBase64.length * 3) / 4) - padding;
  if (byteLength <= 0 || byteLength > MAX_PHOTO_BYTES) throw new Error("L’image doit peser moins de 12 Mo.");
  const header = Buffer.from(imageBase64.slice(0, 32), "base64");
  const validSignature = mimeType === "image/jpeg"
    ? header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff
    : mimeType === "image/png"
      ? header.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      : header.subarray(0, 4).toString("ascii") === "RIFF" && header.subarray(8, 12).toString("ascii") === "WEBP";
  if (!validSignature) throw new Error("Le contenu de l’image ne correspond pas au format annoncé.");
}
