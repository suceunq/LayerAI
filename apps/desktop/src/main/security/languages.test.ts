import assert from "node:assert/strict";
import test from "node:test";
import { isLanguagePreference, resolveSupportedLanguage } from "../../shared/languages.js";

test("sélectionne automatiquement une langue prise en charge depuis la locale système", () => {
  assert.equal(resolveSupportedLanguage("de-DE"), "de");
  assert.equal(resolveSupportedLanguage("es_ES"), "es");
  assert.equal(resolveSupportedLanguage("it-IT"), "it");
  assert.equal(resolveSupportedLanguage("en-US"), "en");
  assert.equal(resolveSupportedLanguage("fr-FR"), "fr");
});

test("utilise le français comme repli et valide les préférences", () => {
  assert.equal(resolveSupportedLanguage("pt-BR"), "fr");
  assert.equal(resolveSupportedLanguage(undefined), "fr");
  assert.equal(isLanguagePreference("system"), true);
  assert.equal(isLanguagePreference("it"), true);
  assert.equal(isLanguagePreference("pt"), false);
});
