import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";

export async function computeSha256(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve());
    stream.on("error", reject);
  });
  return hash.digest("hex");
}

export async function getFileSizeBytes(filePath: string): Promise<number> {
  const stats = await stat(filePath);
  return stats.size;
}

/** True if the given SHA-256 hex digest matches the file's actual content. Used to verify a download before install. */
export async function verifySha256(filePath: string, expectedSha256: string): Promise<boolean> {
  const actual = await computeSha256(filePath);
  return actual.toLowerCase() === expectedSha256.toLowerCase();
}
