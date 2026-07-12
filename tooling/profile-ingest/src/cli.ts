import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";

import { parseIni } from "./ini-parser.js";
import { InheritResolver } from "./inherit-resolver.js";
import { curatePrintersAndPresets, curateFilaments } from "./curator.js";
import { loadBambuProfiles } from "./bambu/loader.js";
import { curateBambuPrintersAndPresets, curateBambuFilaments } from "./bambu/curator.js";
import { loadCrealityProfiles } from "./creality/loader.js";
import { curateCrealityPrintersAndPresets, curateCrealityFilaments } from "./creality/curator.js";
import { emitJson } from "./emit.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveIniPath(): string {
  const flag = process.argv.find((a) => a.startsWith("--ini="));
  if (flag) return path.resolve(flag.slice("--ini=".length));
  if (process.env.LAYERAI_PRUSA_INI_PATH) return path.resolve(process.env.LAYERAI_PRUSA_INI_PATH);
  return path.resolve(__dirname, "../../../../PrusaSlicer-master/resources/profiles/PrusaResearch.ini");
}

function resolveBambuRoot(): string | undefined {
  const flag = process.argv.find((a) => a.startsWith("--bambu="));
  if (flag) return path.resolve(flag.slice("--bambu=".length));
  if (process.env.LAYERAI_BAMBU_ROOT) return path.resolve(process.env.LAYERAI_BAMBU_ROOT);
  const defaultPath = path.resolve(__dirname, "../../../../BambuStudio-master/resources/profiles/BBL");
  return existsSync(defaultPath) ? defaultPath : undefined;
}

function resolveCrealityRoot(): string | undefined {
  const flag = process.argv.find((a) => a.startsWith("--creality="));
  if (flag) return path.resolve(flag.slice("--creality=".length));
  if (process.env.LAYERAI_CREALITY_ROOT) return path.resolve(process.env.LAYERAI_CREALITY_ROOT);
  const defaultPath = path.resolve(__dirname, "../../../../CrealityPrint-master/resources/profiles/Creality");
  return existsSync(defaultPath) ? defaultPath : undefined;
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

  const prusaResult = curatePrintersAndPresets(resolver, sections, assetsDir);
  const printers = [...prusaResult.printers];
  const presets = [...prusaResult.presets];
  const filaments = [...curateFilaments(resolver)];

  const bambuRoot = resolveBambuRoot();
  let bambuPrinterCount = 0;
  let bambuFilamentCount = 0;
  if (bambuRoot) {
    console.log(`[profile-ingest] reading Bambu profiles from ${bambuRoot}`);
    const bambuProfiles = loadBambuProfiles(bambuRoot);
    const bambuCurated = curateBambuPrintersAndPresets(bambuProfiles, bambuRoot);
    const bambuFilaments = curateBambuFilaments(bambuProfiles);
    printers.push(...bambuCurated.printers);
    presets.push(...bambuCurated.presets);
    filaments.push(...bambuFilaments);
    bambuPrinterCount = bambuCurated.printers.length;
    bambuFilamentCount = bambuFilaments.length;
  } else {
    console.log("[profile-ingest] no Bambu Studio checkout found - skipping Bambu Lab profiles (Prusa-only build)");
  }

  const crealityRoot = resolveCrealityRoot();
  let crealityPrinterCount = 0;
  let crealityFilamentCount = 0;
  if (crealityRoot) {
    console.log(`[profile-ingest] reading Creality profiles from ${crealityRoot}`);
    const crealityProfiles = loadCrealityProfiles(crealityRoot);
    const crealityCurated = curateCrealityPrintersAndPresets(crealityProfiles);
    const crealityFilaments = curateCrealityFilaments(crealityProfiles);
    printers.push(...crealityCurated.printers);
    presets.push(...crealityCurated.presets);
    filaments.push(...crealityFilaments);
    crealityPrinterCount = crealityCurated.printers.length;
    crealityFilamentCount = crealityFilaments.length;
  } else {
    console.log("[profile-ingest] no CrealityPrint checkout found - skipping Creality profiles");
  }

  if (printers.length === 0) throw new Error("No printers curated - check the INI path and parser.");
  if (filaments.length === 0) throw new Error("No filaments curated - check curated source section names.");

  const outDir = path.resolve(__dirname, "../../../packages/prusa-profile-db/data");

  await emitJson(outDir, "printers.json", printers);
  await emitJson(outDir, "filaments.json", filaments);
  await emitJson(outDir, "presets.json", presets);
  await emitJson(outDir, "meta.json", {
    sourceVendor: "Prusa Research + Bambu Lab + Creality",
    sourceFile: "PrusaResearch.ini, BambuStudio BBL profiles, CrealityPrint Creality profiles",
    sourceConfigVersion: configVersion,
    sourceFileSha256_16: sourceHash,
    ingestedAt: new Date().toISOString(),
    license: "AGPL-3.0-or-later",
    attribution:
      "Printer and filament defaults are seeded from Prusa Research's official PrusaSlicer configuration bundle, Bambu Lab's official BambuStudio configuration bundle, and Creality's official CrealityPrint configuration bundle (all AGPLv3). See docs/licensing/THIRD_PARTY_PRUSASLICER.md, docs/licensing/THIRD_PARTY_BAMBUSTUDIO.md, and docs/licensing/THIRD_PARTY_CREALITYPRINT.md.",
    printerCount: printers.length,
    filamentCount: filaments.length,
    bambuPrinterCount,
    bambuFilamentCount,
    crealityPrinterCount,
    crealityFilamentCount,
  });

  console.log(`[profile-ingest] wrote ${printers.length} printers, ${filaments.length} filaments, ${presets.length} presets to ${outDir}`);
}

main().catch((err) => {
  console.error("[profile-ingest] failed:", err);
  process.exitCode = 1;
});
