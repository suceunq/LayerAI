import type { MeshGeometryData } from "@layerai/shared-types";

/** Binary STL header is 80 bytes; ASCII STL always starts with the literal "solid" keyword. */
function isLikelyAscii(buffer: Uint8Array): boolean {
  const headerText = new TextDecoder("utf-8", { fatal: false }).decode(buffer.slice(0, 5)).trim().toLowerCase();
  if (headerText !== "solid") return false;
  // Binary STL headers can still start with "solid" as arbitrary comment text; disambiguate by
  // checking whether the byte layout matches the expected binary triangle-count framing.
  if (buffer.byteLength < 84) return true;
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const triangleCount = view.getUint32(80, true);
  const expectedBinaryLength = 84 + triangleCount * 50;
  return expectedBinaryLength !== buffer.byteLength;
}

function parseBinaryStl(buffer: Uint8Array): MeshGeometryData {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const triangleCount = view.getUint32(80, true);
  const positions = new Array<number>(triangleCount * 9);

  let offset = 84;
  for (let t = 0; t < triangleCount; t++) {
    offset += 12; // skip stored normal, recomputed later from winding
    for (let v = 0; v < 3; v++) {
      const base = t * 9 + v * 3;
      positions[base] = view.getFloat32(offset, true);
      positions[base + 1] = view.getFloat32(offset + 4, true);
      positions[base + 2] = view.getFloat32(offset + 8, true);
      offset += 12;
    }
    offset += 2; // attribute byte count
  }

  return { positions };
}

const ASCII_VERTEX = /vertex\s+([-0-9.eE]+)\s+([-0-9.eE]+)\s+([-0-9.eE]+)/g;

function parseAsciiStl(buffer: Uint8Array): MeshGeometryData {
  const text = new TextDecoder("utf-8").decode(buffer);
  const positions: number[] = [];
  for (const match of text.matchAll(ASCII_VERTEX)) {
    positions.push(parseFloat(match[1]!), parseFloat(match[2]!), parseFloat(match[3]!));
  }
  return { positions };
}

export function parseStl(buffer: Uint8Array): MeshGeometryData {
  return isLikelyAscii(buffer) ? parseAsciiStl(buffer) : parseBinaryStl(buffer);
}
