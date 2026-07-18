import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const ROOT = path.resolve(import.meta.dirname, "..");
const LOCALES_DIR = path.join(ROOT, "src", "renderer", "src", "i18n", "locales");
const LANGUAGES = ["fr", "en", "de", "es", "it"];

async function loadCatalogs() {
  return Object.fromEntries(
    await Promise.all(
      LANGUAGES.map(async (language) => [
        language,
        JSON.parse(await readFile(path.join(LOCALES_DIR, `${language}.json`), "utf8")),
      ]),
    ),
  );
}

function placeholders(value) {
  return [...value.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]).sort();
}

async function sourceFiles(directory, extensionPattern) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(fullPath, extensionPattern);
    return extensionPattern.test(entry.name) ? [fullPath] : [];
  }));
  return nested.flat();
}

test("les cinq catalogues sont complets et conservent leurs variables", async () => {
  const catalogs = await loadCatalogs();
  const referenceKeys = Object.keys(catalogs.en).sort();

  for (const language of LANGUAGES) {
    const catalog = catalogs[language];
    assert.deepEqual(Object.keys(catalog).sort(), referenceKeys, `${language}: clés différentes du catalogue anglais`);
    for (const key of referenceKeys) {
      assert.ok(catalog[key].trim(), `${language}: traduction vide pour ${key}`);
      assert.deepEqual(placeholders(catalog[key]), placeholders(catalogs.en[key]), `${language}: variables différentes pour ${key}`);
    }
  }
});

test("chaque clé statique utilisée par les interfaces existe", async () => {
  const { en } = await loadCatalogs();
  const files = await sourceFiles(path.join(ROOT, "src"), /\.(?:ts|tsx)$/);
  const missing = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(/\b(?:t|mainT)\(\s*["']([^"']+)["']/g)) {
      if (!(match[1] in en)) missing.push(`${path.relative(ROOT, file)}: ${match[1]}`);
    }
  }

  assert.deepEqual(missing, []);
});

test("les vues ne réintroduisent pas de texte visible codé en dur", async () => {
  const rendererRoot = path.join(ROOT, "src", "renderer", "src");
  const files = await sourceFiles(rendererRoot, /\.tsx$/);
  const allowed = new Set(["Layer", "AI", "L", "docs/licensing", "✓", "×", "−", "+"]);
  const literals = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(/(?<![=])>[ \t]*([A-Za-zÀ-ÿ][^\r\n<>{}]*)</g)) {
      const value = match[1].replace(/\s+/g, " ").trim();
      if (/[A-Za-zÀ-ÿ]/.test(value) && !allowed.has(value)) {
        literals.push(`${path.relative(ROOT, file)}: ${value}`);
      }
    }
  }

  assert.deepEqual(literals, []);
});

test("les erreurs natives destinées à l’utilisateur passent par le catalogue", async () => {
  const files = await sourceFiles(path.join(ROOT, "src", "main"), /\.ts$/);
  const hardcodedErrors = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (/throw new Error\(\s*["']/.test(source)) hardcodedErrors.push(path.relative(ROOT, file));
  }
  assert.deepEqual(hardcodedErrors, []);
});
