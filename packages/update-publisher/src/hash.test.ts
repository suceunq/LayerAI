import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { computeSha256, getFileSizeBytes, verifySha256 } from "./hash.js";

test("computes the known SHA-256 digest of a file's content", async () => {
  const dir = await mkdtemp(join(tmpdir(), "layerai-hash-test-"));
  try {
    const filePath = join(dir, "sample.txt");
    await writeFile(filePath, "hello world");
    const digest = await computeSha256(filePath);
    // sha256("hello world") - independently known constant.
    assert.equal(digest, "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("reports the exact byte size of a file", async () => {
  const dir = await mkdtemp(join(tmpdir(), "layerai-hash-test-"));
  try {
    const filePath = join(dir, "sample.bin");
    await writeFile(filePath, Buffer.alloc(1234));
    assert.equal(await getFileSizeBytes(filePath), 1234);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("verifySha256 detects a corrupted/tampered file", async () => {
  const dir = await mkdtemp(join(tmpdir(), "layerai-hash-test-"));
  try {
    const filePath = join(dir, "sample.txt");
    await writeFile(filePath, "original content");
    const goodDigest = await computeSha256(filePath);
    assert.equal(await verifySha256(filePath, goodDigest), true);

    await writeFile(filePath, "corrupted content");
    assert.equal(await verifySha256(filePath, goodDigest), false);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
