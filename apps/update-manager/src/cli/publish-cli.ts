import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { publishRelease, type GitHubConfig, type PublishProgressEvent } from "@layerai/update-publisher";

interface CliArgs {
  version?: string;
  title?: string;
  changelog?: string;
  changelogFile?: string;
  files?: string;
  owner?: string;
  repo?: string;
  token?: string;
  prerelease: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { prerelease: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
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
    case "done":
      return `✓ ${event.message}`;
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const owner = args.owner ?? process.env["LAYERAI_GH_OWNER"];
  const repo = args.repo ?? process.env["LAYERAI_GH_REPO"];
  const token = args.token ?? process.env["LAYERAI_GH_TOKEN"];

  if (!args.version || !args.title || !args.files) {
    console.error("Usage : --version <x.y.z> --title <titre> --files <a.exe,b.exe> [--changelog <texte> | --changelog-file <path>]");
    console.error("        [--owner <owner>] [--repo <repo>] [--token <PAT>] [--prerelease]");
    console.error("Owner/repo/token peuvent aussi venir des variables d'environnement LAYERAI_GH_OWNER / LAYERAI_GH_REPO / LAYERAI_GH_TOKEN.");
    process.exitCode = 1;
    return;
  }
  if (!owner || !repo || !token) {
    console.error("Dépôt GitHub ou jeton manquant (owner/repo/token).");
    process.exitCode = 1;
    return;
  }

  const changelog = args.changelogFile ? await readFile(args.changelogFile, "utf-8") : (args.changelog ?? "");
  const filePaths = args.files.split(",").map((p) => p.trim());
  const config: GitHubConfig = { owner, repo, token };

  try {
    const result = await publishRelease(
      config,
      {
        version: args.version,
        title: args.title,
        changelog,
        files: filePaths.map((path) => ({ path, name: basename(path) })),
        prerelease: args.prerelease,
      },
      (event) => console.log(describeProgress(event))
    );
    console.log(`Release publiée : ${result.releaseUrl}`);
  } catch (error) {
    console.error(`Échec de la publication : ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

void main();
