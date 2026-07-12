import test from "node:test";
import assert from "node:assert/strict";
import { Worker } from "node:worker_threads";
import { resolve } from "node:path";

function analyze(data) {
  return new Promise((resolveReply, reject) => {
    const worker = new Worker(resolve("out/main/analysis-worker.js"));
    const timeout = setTimeout(() => { void worker.terminate(); reject(new Error("analysis worker timeout")); }, 15_000);
    worker.once("error", reject);
    worker.once("message", (reply) => {
      clearTimeout(timeout);
      void worker.terminate();
      resolveReply(reply);
    });
    worker.postMessage({ id: 1, kind: "analyze", format: "stl", data });
  });
}

test("le worker analyse un vrai maillage sans bloquer ni corrompre le résultat", async () => {
  const stl = new TextEncoder().encode("solid t\nfacet normal 0 0 1\nouter loop\nvertex 0 0 0\nvertex 10 0 0\nvertex 0 10 0\nendloop\nendfacet\nendsolid t");
  const reply = await analyze(stl);
  assert.equal(reply.error, undefined);
  assert.equal(reply.result.analysis.triangleCount, 1);
  assert.equal(reply.result.geometry.positions.length, 9);
});
