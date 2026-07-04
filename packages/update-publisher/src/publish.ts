import { basename } from "node:path";
import { computeSha256, getFileSizeBytes } from "./hash.js";
import { createRelease, deleteRelease, uploadAsset } from "./github.js";
import { buildManifest, manifestFileName, serializeManifest } from "./manifest.js";
import { isValidSemVer } from "./semver.js";
import type { GitHubConfig, ManifestFileEntry, PublishInput, PublishProgressCallback, PublishResult } from "./types.js";

/**
 * Publishes a new LayerAI release to GitHub Releases: validates the version, hashes every file,
 * creates the release, uploads each asset plus a generated JSON manifest, and rolls back (deletes
 * the release) if any upload fails partway through - a half-published release with missing assets
 * would otherwise look valid to the update client and break every user's download.
 */
export async function publishRelease(config: GitHubConfig, input: PublishInput, onProgress?: PublishProgressCallback): Promise<PublishResult> {
  onProgress?.({ phase: "validating", message: "Validation de la version et des fichiers" });

  if (!isValidSemVer(input.version)) {
    throw new Error(`"${input.version}" n'est pas un numéro de version SemVer valide (attendu : MAJOR.MINOR.PATCH, ex. 1.2.0).`);
  }
  if (!input.title.trim()) {
    throw new Error("Le titre de la version est requis.");
  }
  if (input.files.length === 0) {
    throw new Error("Sélectionnez au moins un fichier à publier.");
  }

  const publishedAt = new Date().toISOString();
  const fileEntries: ManifestFileEntry[] = [];
  for (const file of input.files) {
    onProgress?.({ phase: "hashing", fileName: file.name });
    const sizeBytes = await getFileSizeBytes(file.path);
    const sha256 = await computeSha256(file.path);
    fileEntries.push({ name: file.name, sizeBytes, sha256, downloadUrl: "" });
  }

  const tagName = `v${input.version}`;
  onProgress?.({ phase: "creating-release", message: `Création de la release ${tagName} sur GitHub` });
  const release = await createRelease(config, {
    tagName,
    name: input.title,
    body: input.changelog,
    prerelease: input.prerelease,
  });

  try {
    for (let i = 0; i < input.files.length; i++) {
      const file = input.files[i]!;
      const entry = fileEntries[i]!;
      await uploadAsset(config, {
        releaseUploadUrl: release.uploadUrl,
        filePath: file.path,
        fileName: file.name,
        sizeBytes: entry.sizeBytes,
        onProgress: (transferredBytes) =>
          onProgress?.({ phase: "uploading", fileName: file.name, transferredBytes, totalBytes: entry.sizeBytes }),
      });
      entry.downloadUrl = `https://github.com/${config.owner}/${config.repo}/releases/download/${tagName}/${encodeURIComponent(file.name)}`;
      onProgress?.({ phase: "uploaded", fileName: file.name });
    }

    const manifest = buildManifest({ version: input.version, title: input.title, changelog: input.changelog, publishedAt, files: fileEntries });
    const manifestJson = serializeManifest(manifest);
    const manifestBuffer = Buffer.from(manifestJson, "utf-8");
    const manifestFile = manifestFileName();

    await uploadManifestAsset(config, release.uploadUrl, manifestFile, manifestBuffer);

    onProgress?.({ phase: "done", message: `Version ${input.version} publiée avec succès` });
    return { version: input.version, releaseUrl: release.htmlUrl, manifest };
  } catch (error) {
    await deleteRelease(config, release.id).catch(() => {
      // Best-effort rollback - the primary error is more important to surface than a cleanup failure.
    });
    throw error;
  }
}

async function uploadManifestAsset(config: GitHubConfig, releaseUploadUrl: string, fileName: string, content: Buffer): Promise<void> {
  const { writeFile, unlink } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const tempPath = join(tmpdir(), `${basename(fileName)}-${Date.now()}`);
  await writeFile(tempPath, content);
  try {
    await uploadAsset(config, {
      releaseUploadUrl,
      filePath: tempPath,
      fileName,
      sizeBytes: content.byteLength,
      contentType: "application/json",
    });
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}
