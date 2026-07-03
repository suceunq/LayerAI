import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function emitJson(outDir: string, fileName: string, data: unknown): Promise<void> {
  await mkdir(outDir, { recursive: true });
  const target = path.join(outDir, fileName);
  await writeFile(target, JSON.stringify(data, null, 2) + "\n", "utf-8");
}
