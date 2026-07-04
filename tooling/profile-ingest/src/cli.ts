import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

import { parseIni } from "./ini-parser.js";
import { InheritResolver } from "./inherit-resolver.js";
import { curatePrintersAndPresets, curateFilaments } from "./curator.js";
import { emitJson } from "./emit.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveIniPath(): string {
  const flag = process.argv.find((a) => a.startsWith("--ini="));
  if (flag) return path.resolve(flag.slice("--ini=".length));
  if (process.env.LAYERAI_PRUSA_INI_PATH) return path.resolve(process.env.LAYERAI_PRUSA_INI_PATH);
  return path.resolve(__dirname, "../../../../PrusaSlicer-master/resources/profiles/PrusaResearch.ini");
}

function extractVendorField(text: string, key: string): string | undefined {
  const match = new RegExp(`^${key}\\s*=\\s*(.+)$`, "m").exec(text);
  return match?.[1]?.trim();
}

async function main(): Promise<void> {
  const iniPath = resolveIniPath();
  console.log(`[profile-ingest] reading ${iniPath}`);
  const text = await readFile(iniPath, "utf-8");

  const configVersion = extractVendorField(text, "config_version") ?? "unknown";
  const sourceHash = createHash("sha256").update(text).digest("hex").slice(0, 16);

  const sections = parseIni(text);
  const resolver = new InheritResolver(sections);
  const assetsDir = path.join(path.dirname(iniPath), path.basename(iniPath, ".ini"));

  const { printers, presets } = curatePrintersAndPresets(resolver, sections, assetsDir);
  const filaments = curateFilaments(resolver);

  if (printers.length === 0) throw new Error("No printers curated - check the INI path and parser.");
  if (filaments.length === 0) throw new Error("No filaments curated - check curated source section names.");

  const outDir = path.resolve(__dirname, "../../../packages/prusa-profile-db/data");

  await emitJson(outDir, "printers.json", printers);
  await emitJson(outDir, "filaments.json", filaments);
  await emitJson(outDir, "presets.json", presets);
  await emitJson(outDir, "meta.json", {
    sourceVendor: "Prusa Research",
    sourceFile: "PrusaResearch.ini",
    sourceConfigVersion: configVersion,
    sourceFileSha256_16: sourceHash,
    ingestedAt: new Date().toISOString(),
    license: "AGPL-3.0-or-later",
    attribution:
      "Printer and filament defaults are seeded from Prusa Research's official PrusaSlicer configuration bundle (AGPLv3). See docs/licensing/THIRD_PARTY_PRUSASLICER.md.",
    printerCount: printers.length,
    filamentCount: filaments.length,
  });

  console.log(`[profile-ingest] wrote ${printers.length} printers, ${filaments.length} filaments, ${presets.length} presets to ${outDir}`);
}

main().catch((err) => {
  console.error("[profile-ingest] failed:", err);
  process.exitCode = 1;
});
