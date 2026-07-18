import assert from "node:assert/strict";
import test from "node:test";
import { normalizeText, resolveIntent } from "./index.js";

test("normalise accents, casse et espaces", () => {
  assert.equal(normalizeText("  Très   RÉSISTANT  "), "tres resistant");
});

test("reconnaît une intention française et conserve sa justification", () => {
  const result = resolveIntent("Je veux une pièce très résistante");
  assert.equal(result.unrecognized, false);
  assert.equal(result.languageDetected, "fr");
  assert.ok(result.weights.length > 0);
  assert.ok(result.weights.some((weight) => weight.matchedPhrases.length > 0));
});

test("signale un texte sans intention reconnue", () => {
  const result = resolveIntent("xyzzy plugh");
  assert.equal(result.unrecognized, true);
  assert.deepEqual(result.weights, []);
});

test("reconnaît les intentions allemandes, espagnoles et italiennes", () => {
  const cases = [
    ["Ich möchte ein sehr stabiles mechanisches Teil", "de", "strength"],
    ["Quiero imprimir una pieza lo más rápido posible", "es", "speed"],
    ["Voglio una finitura perfetta e la massima qualità", "it", "quality"],
  ] as const;

  for (const [sentence, language, tag] of cases) {
    const result = resolveIntent(sentence);
    assert.equal(result.unrecognized, false, sentence);
    assert.equal(result.languageDetected, language, sentence);
    assert.ok(result.weights.some((weight) => weight.tag === tag), sentence);
  }
});
