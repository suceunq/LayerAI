import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("le preload de production reste CommonJS et compatible avec le bac à sable Electron", async () => {
  const preload = await readFile("out/preload/index.cjs", "utf8");
  const main = await readFile("src/main/index.ts", "utf8");
  assert.match(preload, /require\(["']electron["']\)/);
  assert.doesNotMatch(preload, /^import\s/m);
  assert.match(main, /preload:\s*join\(__dirname,\s*["']\.\.\/preload\/index\.cjs["']\)/);
  assert.match(main, /sandbox:\s*true/);
});
