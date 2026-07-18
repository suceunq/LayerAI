import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("le gestionnaire utilise un preload CommonJS dans la sandbox Electron", async () => {
  const [main, preload] = await Promise.all([
    readFile(new URL("../src/main/index.ts", import.meta.url), "utf8"),
    readFile(new URL("../out/preload/index.cjs", import.meta.url), "utf8"),
  ]);
  assert.match(main, /sandbox:\s*true/);
  assert.match(main, /preload\/index\.cjs/);
  assert.match(preload, /contextBridge/);
});

test("bloque navigation, permissions et protocoles externes non HTTPS", async () => {
  const main = await readFile(new URL("../src/main/index.ts", import.meta.url), "utf8");
  assert.match(main, /startsWith\("https:\/\/"\)/);
  assert.match(main, /will-navigate/);
  assert.match(main, /setPermissionRequestHandler/);
});
