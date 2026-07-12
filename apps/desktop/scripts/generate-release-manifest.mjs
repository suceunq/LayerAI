// Runs after electron-builder as part of `pnpm run package:win`. Turns the just-built artifacts
// into a single self-describing release for the Update Manager: copies the installer + latest.yml
// into update-a-publier/, and writes a manifest (layerai-release-manifest.json) listing the
// version/title/changelog/files - so publishing is "drop that one file into Update Manager"
// instead of retyping version/title/notes and re-picking files by hand every time.
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const desktopDir = dirname(dirname(fileURLToPath(import.meta.url)));
const repoRoot = dirname(dirname(desktopDir));
const releaseDir = join(desktopDir, "release");
const updateDir = join(repoRoot, "update-a-publier");

const ARTIFACT_NAMES = ["LayerAI_Setup.exe", "LayerAI_Setup.exe.blockmap", "latest.yml"];
const MANIFEST_FILE_NAME = "layerai-release-manifest.json";

function fail(message) {
  console.error(`\n✗ generate-release-manifest: ${message}\n`);
  process.exit(1);
}

function parsePackageVersion() {
  const packageJson = JSON.parse(readFileSync(join(desktopDir, "package.json"), "utf-8"));
  if (!packageJson.version) fail("package.json a aucun champ \"version\".");
  return packageJson.version;
}

function parseReleaseNotes() {
  const notesPath = join(desktopDir, "RELEASE_NOTES.md");
  if (!existsSync(notesPath)) {
    fail(`RELEASE_NOTES.md introuvable (${notesPath}). Créez-le avec un titre "# ..." suivi des notes de version.`);
  }
  const raw = readFileSync(notesPath, "utf-8");
  const lines = raw.split("\n");
  const titleLineIndex = lines.findIndex((line) => line.startsWith("# "));
  if (titleLineIndex === -1) fail('RELEASE_NOTES.md doit commencer par un titre "# Titre de la version".');
  const title = lines[titleLineIndex].slice(2).trim();
  const changelog = lines
    .slice(titleLineIndex + 1)
    .join("\n")
    .trim();
  return { title, changelog };
}

function verifyLatestYmlVersion(expectedVersion) {
  const latestYmlPath = join(releaseDir, "latest.yml");
  if (!existsSync(latestYmlPath)) {
    fail(`${latestYmlPath} introuvable - lancez electron-builder avant ce script (c'est fait automatiquement par "package:win").`);
  }
  const raw = readFileSync(latestYmlPath, "utf-8");
  const match = /^version:\s*(.+)$/m.exec(raw);
  const builtVersion = match?.[1]?.trim();
  if (builtVersion !== expectedVersion) {
    fail(
      `latest.yml annonce la version "${builtVersion}" mais package.json est en "${expectedVersion}" - le build ne correspond pas ` +
        `à la version actuelle (build obsolète ?). Relancez la compilation avant de générer le manifeste.`
    );
  }
}

function copyArtifacts() {
  mkdirSync(updateDir, { recursive: true });
  for (const name of ARTIFACT_NAMES) {
    const source = join(releaseDir, name);
    if (!existsSync(source)) fail(`Fichier de build manquant : ${source}`);
    copyFileSync(source, join(updateDir, name));
  }
}

function writeManifest(version, title, changelog) {
  const manifest = { version, title, changelog, files: ARTIFACT_NAMES };
  writeFileSync(join(updateDir, MANIFEST_FILE_NAME), JSON.stringify(manifest, null, 2) + "\n", "utf-8");
}

function writeHumanSummary(version, title, changelog) {
  const text = [
    `VERSION : ${version}`,
    `TITRE DE LA VERSION : ${title}`,
    "",
    'NOTES DE VERSION (à coller dans le champ "Notes de version (Markdown)") :',
    "",
    changelog,
    "",
    `Fichier ${MANIFEST_FILE_NAME} généré - importez-le directement dans LayerAI Update Manager pour tout pré-remplir.`,
    "",
  ].join("\n");
  writeFileSync(join(updateDir, "INFOS_VERSION.txt"), text, "utf-8");
}

const version = parsePackageVersion();
verifyLatestYmlVersion(version);
const { title, changelog } = parseReleaseNotes();
copyArtifacts();
writeManifest(version, title, changelog);
writeHumanSummary(version, title, changelog);

console.log(`\n✓ Version ${version} prête dans ${updateDir}`);
console.log(`  - ${ARTIFACT_NAMES.join(", ")}`);
console.log(`  - ${MANIFEST_FILE_NAME} (à importer dans LayerAI Update Manager)`);
console.log(`  - INFOS_VERSION.txt\n`);
