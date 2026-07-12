import { useEffect, useState } from "react";
import { Button } from "./Button.js";
import type { GitHubProfile, Project } from "../../../shared/ipc-types.js";

interface FormState {
  name: string;
  description: string;
  iconPath: string | null;
  iconDataUrl: string | null;
  workingDirectory: string;
  stagingFolderName: string;
  rawManifestFileName: string;
  githubProfileId: string;
  repo: string;
  downloadUrl: string;
}

const DEFAULT_STAGING_FOLDER = "Updates à publier";

function emptyForm(profiles: GitHubProfile[]): FormState {
  return {
    name: "",
    description: "",
    iconPath: null,
    iconDataUrl: null,
    workingDirectory: "",
    stagingFolderName: DEFAULT_STAGING_FOLDER,
    rawManifestFileName: "",
    githubProfileId: profiles[0]?.id ?? "",
    repo: "",
    downloadUrl: "",
  };
}

function fromProject(project: Project): FormState {
  return {
    name: project.name,
    description: project.description,
    iconPath: project.iconPath,
    iconDataUrl: project.iconDataUrl,
    workingDirectory: project.workingDirectory,
    stagingFolderName: project.stagingFolderName,
    rawManifestFileName: project.rawManifestFileName ?? "",
    githubProfileId: project.githubProfileId,
    repo: project.repo,
    downloadUrl: project.downloadUrl ?? "",
  };
}

export function ProjectForm({
  projectId,
  onSaved,
  onCancel,
}: {
  projectId?: string;
  onSaved: (project: Project) => void;
  onCancel: () => void;
}): React.JSX.Element {
  const [profiles, setProfiles] = useState<GitHubProfile[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const list = await window.api.githubProfiles.list();
      setProfiles(list);
      if (projectId) {
        const project = await window.api.projects.get(projectId);
        if (project) {
          setForm(fromProject(project));
          setShowAdvanced(project.stagingFolderName !== DEFAULT_STAGING_FOLDER || Boolean(project.rawManifestFileName));
          return;
        }
      }
      setForm(emptyForm(list));
    })();
  }, [projectId]);

  if (!form) return <p className="text-xs text-text-muted">Chargement…</p>;

  const canSave = form.name.trim().length > 0 && form.workingDirectory.trim().length > 0 && form.repo.trim().length > 0 && form.githubProfileId;

  const pickDirectory = async (): Promise<void> => {
    const dir = await window.api.dialogs.pickDirectory();
    if (dir) setForm({ ...form, workingDirectory: dir });
  };

  const pickIcon = async (): Promise<void> => {
    const iconPath = await window.api.dialogs.pickIcon();
    if (iconPath) setForm({ ...form, iconPath });
  };

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    try {
      const request = {
        id: projectId,
        name: form.name.trim(),
        description: form.description.trim(),
        iconPath: form.iconPath,
        workingDirectory: form.workingDirectory.trim(),
        stagingFolderName: form.stagingFolderName.trim() || DEFAULT_STAGING_FOLDER,
        rawManifestFileName: form.rawManifestFileName.trim() || null,
        githubProfileId: form.githubProfileId,
        repo: form.repo.trim(),
        downloadUrl: form.downloadUrl.trim() || null,
      };
      const project = projectId ? await window.api.projects.update(request) : await window.api.projects.create(request);
      onSaved(project);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <h2 className="text-sm font-semibold text-text-primary">{projectId ? "Modifier le projet" : "Nouveau projet"}</h2>

      {profiles.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-subtle p-4 text-xs text-text-muted">
          Ajoutez d'abord un compte GitHub (onglet "Comptes GitHub") avant de créer un projet.
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3">
            {form.iconDataUrl ? (
              <img src={form.iconDataUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2 text-xs text-text-muted">Icône</div>
            )}
            <Button variant="secondary" onClick={() => void pickIcon()}>
              Choisir une icône
            </Button>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-text-muted">Nom du logiciel</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="TikTok Manager"
              className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-prusa-orange"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-text-muted">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="h-20 resize-none rounded-lg border border-border-subtle bg-surface-2 p-3 text-sm text-text-primary outline-none focus:border-prusa-orange"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-text-muted">Répertoire de travail</span>
            <div className="flex gap-2">
              <input
                value={form.workingDirectory}
                onChange={(e) => setForm({ ...form, workingDirectory: e.target.value })}
                placeholder="E:\developpement\tiktok-manager"
                className="flex-1 rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-prusa-orange"
              />
              <Button variant="secondary" onClick={() => void pickDirectory()}>
                Parcourir
              </Button>
            </div>
          </label>

          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-text-muted">Compte GitHub</span>
              <select
                value={form.githubProfileId}
                onChange={(e) => setForm({ ...form, githubProfileId: e.target.value })}
                className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-prusa-orange"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} ({p.owner})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-xs uppercase tracking-wide text-text-muted">Dépôt</span>
              <input
                value={form.repo}
                onChange={(e) => setForm({ ...form, repo: e.target.value })}
                placeholder="TikTokManager"
                className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-prusa-orange"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-text-muted">URL de téléchargement (optionnel)</span>
            <input
              value={form.downloadUrl}
              onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })}
              placeholder="https://github.com/owner/repo/releases/latest/download/Setup.exe"
              className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-prusa-orange"
            />
          </label>

          <button onClick={() => setShowAdvanced((v) => !v)} className="text-left text-xs text-prusa-orange hover:text-prusa-orange-glow">
            {showAdvanced ? "▾" : "▸"} Avancé
          </button>

          {showAdvanced && (
            <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface-1 p-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-text-muted">Nom du dossier de mise en attente</span>
                <input
                  value={form.stagingFolderName}
                  onChange={(e) => setForm({ ...form, stagingFolderName: e.target.value })}
                  className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-prusa-orange"
                />
                <span className="text-xs text-text-muted">Créé automatiquement dans le répertoire de travail au format « &lt;répertoire&gt;\&lt;nom&gt; ».</span>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-text-muted">Nom du manifeste brut auto-détecté (optionnel)</span>
                <input
                  value={form.rawManifestFileName}
                  onChange={(e) => setForm({ ...form, rawManifestFileName: e.target.value })}
                  placeholder="release-manifest.json"
                  className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-prusa-orange"
                />
                <span className="text-xs text-text-muted">
                  Si un script de build génère un manifeste de ce nom dans le dossier de mise en attente, il sera auto-importé au
                  glisser-déposer.
                </span>
              </label>
            </div>
          )}
        </>
      )}

      {error && <p className="text-xs text-confidence-low">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={() => void handleSave()} disabled={saving || !canSave}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
