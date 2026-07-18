import { Worker } from "node:worker_threads";
import { join } from "node:path";
import type { AnalyzedMesh, MeshGeometryData } from "@layerai/shared-types";
import { mainT } from "./localization.js";

type JobPayload =
  | { kind: "analyze"; format: "stl" | "obj" | "3mf"; data: Uint8Array }
  | { kind: "rescale"; geometry: MeshGeometryData; scaleFactor: number }
  | { kind: "reorient"; geometry: MeshGeometryData; quaternion: { x: number; y: number; z: number; w: number } };

interface WorkerReply { id: number; result?: AnalyzedMesh; error?: string }
interface Pending { resolve: (value: AnalyzedMesh) => void; reject: (reason: Error) => void }

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

function rejectAll(message: string): void {
  for (const request of pending.values()) request.reject(new Error(message));
  pending.clear();
}

function ensureWorker(): Worker {
  if (worker) return worker;
  const instance = new Worker(join(__dirname, "analysis-worker.js"));
  worker = instance;
  instance.on("message", (reply: WorkerReply) => {
    const request = pending.get(reply.id);
    if (!request) return;
    pending.delete(reply.id);
    if (reply.result) request.resolve(reply.result);
    else request.reject(new Error(reply.error ?? mainT("native.worker.failed")));
  });
  instance.on("error", (error) => {
    rejectAll(mainT("native.worker.stopped", { message: error.message }));
    if (worker === instance) worker = null;
  });
  instance.on("exit", (code) => {
    if (pending.size > 0) rejectAll(mainT("native.worker.exited", { code }));
    if (worker === instance) worker = null;
  });
  return instance;
}

export function runAnalysisJob(payload: JobPayload): Promise<AnalyzedMesh> {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ensureWorker().postMessage({ id, ...payload });
  });
}
