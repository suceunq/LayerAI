import { basename, join } from "node:path";
import { tmpdir } from "node:os";
import { writeFile, unlink } from "node:fs/promises";
import { computeSha256, getFileSizeBytes, verifySha256 } from "./hash.js";
import { createRelease, deleteRelease, uploadAsset, getReleaseAssets, downloadAssetContent } from "./github.js";
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

    const verified = await verifyPublishedRelease(
      config,
      release.id,
      [
        ...fileEntries.map((e) => ({ name: e.name, sizeBytes: e.sizeBytes, sha256: e.sha256 })),
        { name: manifestFile, sizeBytes: manifestBuffer.byteLength, sha256: null },
      ],
      input.verifyAll,
      onProgress
    );

    onProgress?.({ phase: "done", message: `Version ${input.version} publiée avec succès` });
    return { version: input.version, releaseUrl: release.htmlUrl, manifest, verified };
  } catch (error) {
    await deleteRelease(config, release.id).catch(() => {
      // Best-effort rollback - the primary error is more important to surface than a cleanup failure.
    });
    throw error;
  }
}

async function uploadManifestAsset(config: GitHubConfig, releaseUploadUrl: string, fileName: string, content: Buffer): Promise<void> {
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

/**
 * Re-fetches the release's asset list from GitHub (the authoritative source, not just "the upload
 * call returned 2xx") and confirms every expected file is present with the right size. The largest
 * hashable file (normally the installer) always gets a full re-download + SHA-256 re-check; pass
 * `verifyAll` to do that for every file instead, at the cost of re-downloading everything.
 */
async function verifyPublishedRelease(
  config: GitHubConfig,
  releaseId: number,
  expected: Array<{ name: string; sizeBytes: number; sha256: string | null }>,
  verifyAll: boolean | undefined,
  onProgress?: PublishProgressCallback
): Promise<boolean> {
  const remoteAssets = await getReleaseAssets(config, releaseId);
  const remoteByName = new Map(remoteAssets.map((a) => [a.name, a]));

  for (const file of expected) {
    const remote = remoteByName.get(file.name);
    if (!remote) {
      throw new Error(`Vérification post-publication échouée : "${file.name}" est absent de la release GitHub.`);
    }
    if (remote.size !== file.sizeBytes) {
      throw new Error(
        `Vérification post-publication échouée : taille incorrecte pour "${file.name}" (attendu ${file.sizeBytes} o, obtenu ${remote.size} o).`
      );
    }
  }

  const hashable = expected.filter((f): f is { name: string; sizeBytes: number; sha256: string } => f.sha256 !== null);
  const primary = hashable.reduce<(typeof hashable)[number] | null>(
    (largest, f) => (!largest || f.sizeBytes > largest.sizeBytes ? f : largest),
    null
  );
  const toHashCheck = verifyAll ? hashable : primary ? [primary] : [];

  for (const file of toHashCheck) {
    onProgress?.({ phase: "verifying", fileName: file.name });
    const remote = remoteByName.get(file.name)!;
    await verifyDownloadedHash(config, remote.id, file.name, file.sha256);
  }

  return true;
}

async function verifyDownloadedHash(config: GitHubConfig, assetId: number, fileName: string, expectedSha256: string): Promise<void> {
  const content = await downloadAssetContent(config, assetId);
  const tempPath = join(tmpdir(), `verify-${basename(fileName)}-${Date.now()}`);
  await writeFile(tempPath, content);
  try {
    const ok = await verifySha256(tempPath, expectedSha256);
    if (!ok) {
      throw new Error(`Vérification post-publication échouée : empreinte SHA-256 incorrecte pour "${fileName}".`);
    }
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}
