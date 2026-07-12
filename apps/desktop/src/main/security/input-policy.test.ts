import test from "node:test";
import assert from "node:assert/strict";
import { validatePhotoPayload, validateProviderBaseUrl } from "./input-policy.js";

test("refuse les destinations cloud non chiffrées et les identifiants dans l’URL", () => {
  assert.throws(() => validateProviderBaseUrl("openai", "http://example.com/v1"));
  assert.throws(() => validateProviderBaseUrl("openai", "https://user:secret@example.com/v1"));
  assert.equal(validateProviderBaseUrl("openai", "https://example.com/v1/"), "https://example.com/v1");
});

test("limite LM Studio à la machine locale", () => {
  assert.equal(validateProviderBaseUrl("lmstudio", "http://127.0.0.1:1234/v1"), "http://127.0.0.1:1234/v1");
  assert.throws(() => validateProviderBaseUrl("lmstudio", "http://192.168.1.20:1234/v1"));
});

test("valide format, encodage et taille des photos", () => {
  const jpegHeader = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]).toString("base64");
  assert.doesNotThrow(() => validatePhotoPayload(jpegHeader, "image/jpeg"));
  assert.throws(() => validatePhotoPayload("not base64!?", "image/jpeg"));
  assert.throws(() => validatePhotoPayload(jpegHeader, "image/svg+xml"));
  assert.throws(() => validatePhotoPayload(Buffer.from("not-a-jpeg").toString("base64"), "image/jpeg"));
});
