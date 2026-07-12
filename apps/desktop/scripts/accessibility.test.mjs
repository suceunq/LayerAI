import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

function luminance(hex) {
  const channels = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(a, b) {
  const [bright, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (bright + 0.05) / (dark + 0.05);
}

test("les textes secondaires respectent le contraste WCAG AA dans les deux thèmes", () => {
  assert.ok(contrast("#8492ad", "#090d17") >= 4.5);
  assert.ok(contrast("#5f6b80", "#eef2fb") >= 4.5);
});

test("les protections clavier et mouvement restent présentes", async () => {
  const css = await readFile("src/renderer/src/styles/index.css", "utf8");
  const app = await readFile("src/renderer/src/App.tsx", "utf8");
  const modalHook = await readFile("src/renderer/src/hooks/useModalAccessibility.ts", "utf8");
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /textarea:focus-visible/);
  assert.match(app, /href="#main-content"/);
  assert.match(app, /aria-live="polite"/);
  assert.match(modalHook, /event\.key === "Escape"/);
  assert.match(modalHook, /event\.key !== "Tab"/);
});
