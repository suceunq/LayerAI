import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { appendHistoryEntry, readHistory } from "./history.js";
import type { PublishHistoryEntry } from "./types.js";

function entry(version: string, status: "success" | "failed" = "success"): PublishHistoryEntry {
  return { version, title: `v${version}`, publishedAt: "2026-01-01T00:00:00.000Z", status, fileNames: ["LayerAI-Setup.exe"] };
}

test("readHistory returns an empty list when no history file exists yet", async () => {
  const dir = await mkdtemp(join(tmpdir(), "layerai-history-test-"));
  try {
    const history = await readHistory(join(dir, "missing", "history.json"));
    assert.deepEqual(history, []);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("appendHistoryEntry creates parent directories and prepends newest first", async () => {
  const dir = await mkdtemp(join(tmpdir(), "layerai-history-test-"));
  try {
    const historyFile = join(dir, "nested", "history.json");
    await appendHistoryEntry(historyFile, entry("1.0.0"));
    await appendHistoryEntry(historyFile, entry("1.1.0"));

    const history = await readHistory(historyFile);
    assert.equal(history.length, 2);
    assert.equal(history[0]?.version, "1.1.0");
    assert.equal(history[1]?.version, "1.0.0");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
