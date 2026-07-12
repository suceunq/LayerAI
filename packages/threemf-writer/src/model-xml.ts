import type { MeshGeometryData } from "@layerai/shared-types";

function fmtNum(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Builds 3D/3dmodel.model. The 3MF format requires an indexed vertex/triangle representation;
 * geometry without indices (e.g. STL triangle-soup) is emitted as vertices 0..N-1 taken in
 * order with sequential triangle indices - valid per the format even without deduplication.
 *
 * Multiple `positions` produce multiple `<item>` build entries that all reference the same mesh
 * resource - the standard 3MF way to place several copies of one part without duplicating
 * geometry, exactly how slicers represent "print N copies".
 */
export function buildModelXml(
  geometry: MeshGeometryData,
  objectName: string,
  itemPositions: { x: number; y: number }[] = [{ x: 0, y: 0 }]
): string {
  const { positions: vertexPositions, indices } = geometry;
  const vertexCount = vertexPositions.length / 3;

  const vertexLines: string[] = new Array(vertexCount);
  for (let i = 0; i < vertexCount; i++) {
    const base = i * 3;
    vertexLines[i] = `<vertex x="${fmtNum(vertexPositions[base]!)}" y="${fmtNum(vertexPositions[base + 1]!)}" z="${fmtNum(vertexPositions[base + 2]!)}"/>`;
  }

  const triangleIndices = indices ?? Array.from({ length: vertexCount }, (_, i) => i);
  const triangleCount = Math.floor(triangleIndices.length / 3);
  const triangleLines: string[] = new Array(triangleCount);
  for (let t = 0; t < triangleCount; t++) {
    const base = t * 3;
    triangleLines[t] = `<triangle v1="${triangleIndices[base]}" v2="${triangleIndices[base + 1]}" v3="${triangleIndices[base + 2]}"/>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<model xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" unit="millimeter" xml:lang="en-US">
 <metadata name="slic3rpe:Version3mf">1</metadata>
 <metadata name="Application">LayerAI</metadata>
 <resources>
  <object id="1" type="model" name="${escapeXml(objectName)}">
   <mesh>
    <vertices>
${vertexLines.map((l) => "     " + l).join("\n")}
    </vertices>
    <triangles>
${triangleLines.map((l) => "     " + l).join("\n")}
    </triangles>
   </mesh>
  </object>
 </resources>
 <build>
${itemPositions.map((p) => `  <item objectid="1" transform="1 0 0 0 1 0 0 0 1 ${fmtNum(p.x)} ${fmtNum(p.y)} 0"/>`).join("\n")}
 </build>
</model>`;
}
