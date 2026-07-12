// Fetches the most recent GitHub Releases for the LayerAI repo and regenerates
// src/generated/changelog.ts from their real title/body/date - no placeholder content.
// Usage: node scripts/update-changelog.mjs
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OWNER = 'suceunq';
const REPO = 'LayerAI';
const ENTRY_COUNT = 5;

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outPath = join(scriptDir, '..', 'src', 'generated', 'changelog.ts');

function escapeTemplateLiteral(text) {
  return text.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

async function main() {
  const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases?per_page=${ENTRY_COUNT}`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Update-Manager' },
  });
  if (!response.ok) {
    throw new Error(`Impossible de récupérer les releases GitHub (${response.status}) : ${await response.text()}`);
  }
  const releases = await response.json();

  const entries = releases
    .filter((r) => !r.draft)
    .map((r) => ({
      version: r.tag_name.replace(/^v/, ''),
      title: r.name || r.tag_name,
      notes: (r.body || '').trim(),
      publishedAt: r.published_at,
    }));

  const content = `// Genere automatiquement par scripts/update-changelog.mjs a partir des releases GitHub reelles.
// Ne pas editer a la main - relancer le script pour rafraichir.
export interface ChangelogEntry {
  version: string;
  title: string;
  notes: string;
  publishedAt: string;
}

export const CHANGELOG: ChangelogEntry[] = [
${entries
  .map(
    (e) =>
      `  { version: ${JSON.stringify(e.version)}, title: ${JSON.stringify(e.title)}, notes: \`${escapeTemplateLiteral(e.notes)}\`, publishedAt: ${JSON.stringify(e.publishedAt)} },`
  )
  .join('\n')}
];
`;

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, content, 'utf-8');
  console.log(`${entries.length} entree(s) ecrite(s) dans ${outPath}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
