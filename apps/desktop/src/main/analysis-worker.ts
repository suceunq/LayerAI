import { parentPort } from "node:worker_threads";
import { analyzeMesh, parseStl, parseObj, parseThreeMf, scaleGeometry, rotateGeometry } from "@layerai/mesh-analysis";
import type { MeshGeometryData } from "@layerai/shared-types";

type WorkerJob =
  | { id: number; kind: "analyze"; format: "stl" | "obj" | "3mf"; data: Uint8Array }
  | { id: number; kind: "rescale"; geometry: MeshGeometryData; scaleFactor: number }
  | { id: number; kind: "reorient"; geometry: MeshGeometryData; quaternion: { x: number; y: number; z: number; w: number } };

function parse(format: "stl" | "obj" | "3mf", data: Uint8Array): MeshGeometryData | Promise<MeshGeometryData> {
  if (format === "stl") return parseStl(data);
  if (format === "obj") return parseObj(new TextDecoder("utf8").decode(data));
  return parseThreeMf(data);
}

parentPort?.on("message", async (job: WorkerJob) => {
  try {
    let result;
    if (job.kind === "analyze") result = analyzeMesh(await parse(job.format, job.data));
    else if (job.kind === "rescale") result = analyzeMesh(scaleGeometry(job.geometry, job.scaleFactor));
    else result = analyzeMesh(rotateGeometry(job.geometry, job.quaternion), { skipOrientationSearch: true });
    parentPort?.postMessage({ id: job.id, result });
  } catch (error) {
    parentPort?.postMessage({ id: job.id, error: error instanceof Error ? error.message : String(error) });
  }
});
