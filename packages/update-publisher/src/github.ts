import { createReadStream } from "node:fs";
import { request as httpsRequest } from "node:https";
import type { GitHubConfig } from "./types.js";

const API_BASE = "api.github.com";
const UPLOADS_BASE = "uploads.github.com";

function authHeaders(config: GitHubConfig): Record<string, string> {
  return {
    Authorization: `Bearer ${config.token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "LayerAI-UpdateManager",
  };
}

async function readJsonError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

export interface GitHubReleaseHandle {
  id: number;
  htmlUrl: string;
  uploadUrl: string;
}

/** Creates a new (draft-free) GitHub Release for the given tag. Fails if the tag already has a release, since re-publishing the same version silently would be worse than a clear error. */
export async function createRelease(
  config: GitHubConfig,
  input: { tagName: string; name: string; body: string; prerelease?: boolean }
): Promise<GitHubReleaseHandle> {
  const existing = await findReleaseByTag(config, input.tagName);
  if (existing) {
    throw new Error(`Une release existe déjà pour le tag "${input.tagName}" sur GitHub. Choisissez un autre numéro de version.`);
  }

  const response = await fetch(`https://${API_BASE}/repos/${config.owner}/${config.repo}/releases`, {
    method: "POST",
    headers: { ...authHeaders(config), "Content-Type": "application/json" },
    body: JSON.stringify({
      tag_name: input.tagName,
      name: input.name,
      body: input.body,
      prerelease: Boolean(input.prerelease),
      draft: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Échec de la création de la release GitHub (${response.status}) : ${await readJsonError(response)}`);
  }

  const data = (await response.json()) as { id: number; html_url: string; upload_url: string };
  return { id: data.id, htmlUrl: data.html_url, uploadUrl: data.upload_url.replace(/\{.*\}$/, "") };
}

export async function findReleaseByTag(config: GitHubConfig, tagName: string): Promise<GitHubReleaseHandle | null> {
  const response = await fetch(`https://${API_BASE}/repos/${config.owner}/${config.repo}/releases/tags/${encodeURIComponent(tagName)}`, {
    headers: authHeaders(config),
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Impossible de vérifier les releases existantes (${response.status}) : ${await readJsonError(response)}`);
  }
  const data = (await response.json()) as { id: number; html_url: string; upload_url: string };
  return { id: data.id, htmlUrl: data.html_url, uploadUrl: data.upload_url.replace(/\{.*\}$/, "") };
}

/** Deletes a release - used to roll back a partially-published release if a later asset upload fails. */
export async function deleteRelease(config: GitHubConfig, releaseId: number): Promise<void> {
  await fetch(`https://${API_BASE}/repos/${config.owner}/${config.repo}/releases/${releaseId}`, {
    method: "DELETE",
    headers: authHeaders(config),
  });
}

export interface UploadAssetOptions {
  releaseUploadUrl: string;
  filePath: string;
  fileName: string;
  sizeBytes: number;
  contentType?: string;
  onProgress?: (transferredBytes: number) => void;
}

/**
 * Uploads a release asset via the GitHub uploads API. Uses node:https directly (not fetch) so upload
 * progress can be tracked chunk-by-chunk as the file is streamed - fetch's Node implementation doesn't
 * expose upload progress for streamed request bodies.
 */
export function uploadAsset(config: GitHubConfig, options: UploadAssetOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${options.releaseUploadUrl}?name=${encodeURIComponent(options.fileName)}`);
    if (url.hostname === API_BASE) url.hostname = UPLOADS_BASE;

    const req = httpsRequest(
      {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: "POST",
        headers: {
          ...authHeaders(config),
          "Content-Type": options.contentType ?? "application/octet-stream",
          "Content-Length": options.sizeBytes,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve();
          } else {
            const body = Buffer.concat(chunks).toString("utf-8");
            reject(new Error(`Échec de l'envoi de "${options.fileName}" (${res.statusCode}) : ${body.slice(0, 500)}`));
          }
        });
      }
    );

    req.on("error", (error) => reject(new Error(`Erreur réseau pendant l'envoi de "${options.fileName}" : ${error.message}`)));

    let transferred = 0;
    const fileStream = createReadStream(options.filePath);
    fileStream.on("data", (chunk: string | Buffer) => {
      transferred += chunk.length;
      options.onProgress?.(transferred);
    });
    fileStream.on("error", (error) => reject(new Error(`Lecture du fichier "${options.fileName}" impossible : ${error.message}`)));
    fileStream.pipe(req);
  });
}
