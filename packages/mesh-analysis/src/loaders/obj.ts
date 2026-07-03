import type { MeshGeometryData } from "@layerai/shared-types";

function resolveIndex(raw: number, vertexCount: number): number {
  // OBJ indices are 1-based; negative indices count back from the current end of the vertex list.
  return raw > 0 ? raw - 1 : vertexCount + raw;
}

export function parseObj(text: string): MeshGeometryData {
  const vertices: number[] = [];
  const indices: number[] = [];

  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) continue;

    if (trimmed.startsWith("v ")) {
      const parts = trimmed.slice(2).trim().split(/\s+/).map(Number);
      vertices.push(parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0);
      continue;
    }

    if (trimmed.startsWith("f ")) {
      const vertexCount = vertices.length / 3;
      const tokens = trimmed.slice(2).trim().split(/\s+/);
      const faceIndices = tokens.map((token) => {
        const vertexToken = token.split("/")[0]!;
        return resolveIndex(parseInt(vertexToken, 10), vertexCount);
      });
      // Fan-triangulate polygons with more than 3 vertices.
      for (let i = 1; i < faceIndices.length - 1; i++) {
        indices.push(faceIndices[0]!, faceIndices[i]!, faceIndices[i + 1]!);
      }
    }
  }

  return { positions: vertices, indices };
}
