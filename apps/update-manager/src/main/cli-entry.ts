import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { publishRelease, appendHistoryEntry, type GitHubConfig, type PublishProgressEvent } from "@layerai/update-publisher";
import * as projectStore from "./project-store.js";

interface CliArgs {
  project?: string;
  version?: string;
  title?: string;
  changelog?: string;
  changelogFile?: string;
  files?: string;
  owner?: string;
  repo?: string;
  token?: string;
  prerelease: boolean;
  verifyAll: boolean;
}

/** True if argv carries either a saved-project reference or the raw owner/repo/token escape hatch -
 * the signal `main/index.ts` uses to route into `runCli()` instead of opening a window. */
export function hasCliFlags(argv: string[]): boolean {
  return argv.includes("--project") || (argv.includes("--owner") && argv.includes("--repo") && argv.includes("--token"));
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { prerelease: false, verifyAll: false };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--project":
        args.project = argv[++i];
        break;
      case "--version":
        args.version = argv[++i];
        break;
      case "--title":
        args.title = argv[++i];
        break;
      case "--changelog":
        args.changelog = argv[++i];
        break;
      case "--changelog-file":
        args.changelogFile = argv[++i];
        break;
      case "--files":
        args.files = argv[++i];
        break;
      case "--owner":
        args.owner = argv[++i];
        break;
      case "--repo":
        args.repo = argv[++i];
        break;
      case "--token":
        args.token = argv[++i];
        break;
      case "--prerelease":
        args.prerelease = true;
        break;
      case "--verify-all":
        args.verifyAll = true;
        break;
      default:
        break;
    }
  }
  return args;
}

function describeProgress(event: PublishProgressEvent): string {
  switch (event.phase) {
    case "validating":
      return event.message;
    case "hashing":
      return `Empreinte SHA-256 : ${event.fileName}`;
    case "creating-release":
      return event.message;
    case "uploading": {
      const percent = event.totalBytes > 0 ? Math.round((event.transferredBytes / event.totalBytes) * 100) : 0;
      return `Envoi ${event.fileName} : ${percent}%`;
    }
    case "uploaded":
      return `✓ ${event.fileName} envoyé`;
    case "verifying":
      return `Vérification : ${event.fileName}`;
    case "done":
      return `✓ ${event.message}`;
  }
}

/**
 * Headless CLI publish entry point. Runs inside a real Electron process (not plain Node/tsx) because
 * resolving a saved project's encrypted token requires Electron's safeStorage (DPAPI), which only
 * exists inside Electron. Returns a process exit code; `main/index.ts` calls `app.exit()` with it.
 */
export async function runCli(argv: string[]): Promise<number> {
  const args = parseArgs(argv);

  let config: GitHubConfig | undefined;
  let projectId: string | undefined;

  if (args.project) {
    const projects = await projectStore.listProjects();
    const project = projects.find((p) => p.id === args.project || p.name === args.project);
    if (!project) {
      console.error(`Projet "${args.project}" introuvable. Projets disponibles : ${projects.map((p) => p.name).join(", ") || "(aucun)"}`);
      return 1;
    }
    projectId = project.id;
    const resolved = await projectStore.resolveGitHubConfig(project.id);
    if (!resolved) {
      console.error(`Le projet "${project.name}" n'a pas de compte GitHub configuré.`);
      return 1;
    }
    config = resolved;
  } else if (args.owner && args.repo && args.token) {
    config = { owner: args.owner, repo: args.repo, token: args.token };
  }

  if (!args.version || !args.title || !args.files || !config) {
    console.error(
      "Usage : --project <nom|id> --version <x.y.z> --title <titre> --files <a.exe,b.exe> " +
        "[--changelog <texte> | --changelog-file <path>] [--prerelease] [--verify-all]"
    );
    console.error("   ou : --owner <owner> --repo <repo> --token <PAT> --version ... --title ... --files ...");
    return 1;
  }

  const changelog = args.changelogFile ? await readFile(args.changelogFile, "utf-8") : (args.changelog ?? "");
  const filePaths = args.files.split(",").map((p) => p.trim());
  const fileNames = filePaths.map((p) => basename(p));

  try {
    const result = await publishRelease(
      config,
      {
        version: args.version,
        title: args.title,
        changelog,
        files: filePaths.map((path) => ({ path, name: basename(path) })),
        prerelease: args.prerelease,
        verifyAll: args.verifyAll,
      },
      (event) => console.log(describeProgress(event))
    );
    console.log(`Release publiée${result.verified ? " et vérifiée" : ""} : ${result.releaseUrl}`);

    if (projectId) {
      await appendHistoryEntry(projectStore.historyFilePath(projectId), {
        version: args.version,
        title: args.title,
        publishedAt: new Date().toISOString(),
        status: "success",
        releaseUrl: result.releaseUrl,
        fileNames,
        verified: result.verified,
      });
      if (!args.prerelease) await projectStore.setProjectVersion(projectId, args.version);
    }
    return 0;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Échec de la publication : ${errorMessage}`);
    if (projectId) {
      await appendHistoryEntry(projectStore.historyFilePath(projectId), {
        version: args.version,
        title: args.title,
        publishedAt: new Date().toISOString(),
        status: "failed",
        errorMessage,
        fileNames,
      });
    }
    return 1;
  }
}
