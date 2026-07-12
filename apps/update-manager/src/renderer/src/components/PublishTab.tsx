import { useEffect, useMemo, useState, type DragEvent } from "react";
import { Button } from "./Button.js";
import { renderMarkdownPreview } from "../lib/markdown.js";
import type { PickedFile, Project, PublishProgressEvent } from "../../../shared/ipc-types.js";

const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?$/;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function describeProgress(event: PublishProgressEvent): string {
  switch (event.phase) {
    case "validating":
      return event.message;
    case "hashing":
      return `Calcul de l'empreinte SHA-256 : ${event.fileName}`;
    case "creating-release":
      return event.message;
    case "uploading": {
      const percent = event.totalBytes > 0 ? Math.round((event.transferredBytes / event.totalBytes) * 100) : 0;
      return `Envoi de ${event.fileName} : ${percent}% (${formatBytes(event.transferredBytes)} / ${formatBytes(event.totalBytes)})`;
    }
    case "uploaded":
      return `✓ ${event.fileName} envoyé`;
    case "verifying":
      return `Vérification post-publication : ${event.fileName}`;
    case "done":
      return `✓ ${event.message}`;
  }
}

export function PublishTab({ project, onPublished }: { project: Project; onPublished: () => void }): React.JSX.Element {
  const [version, setVersion] = useState("");
  const [title, setTitle] = useState("");
  const [changelog, setChangelog] = useState("");
  const [prerelease, setPrerelease] = useState(false);
  const [verifyAll, setVerifyAll] = useState(false);
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [importingManifest, setImportingManifest] = useState(false);

  useEffect(() => window.api.onPublishProgress((event) => setLog((prev) => [...prev, describeProgress(event)])), []);

  // Reset the form when switching to a different project - stale files/version from the previous
  // project's form must never be publishable against this one.
  useEffect(() => {
    setVersion("");
    setTitle("");
    setChangelog("");
    setFiles([]);
    setResult(null);
    setLog([]);
  }, [project.id]);

  const versionValid = version.length === 0 || SEMVER_RE.test(version);
  const canPublish = SEMVER_RE.test(version) && title.trim().length > 0 && files.length > 0 && !publishing;

  const previewHtml = useMemo(() => renderMarkdownPreview(changelog), [changelog]);

  const addFiles = (picked: PickedFile[]): void => {
    setFiles((prev) => {
      const existingPaths = new Set(prev.map((f) => f.path));
      return [...prev, ...picked.filter((f) => !existingPaths.has(f.path))];
    });
  };

  const handlePickFiles = async (): Promise<void> => {
    addFiles(await window.api.pickFiles());
  };

  const removeFile = (path: string): void => setFiles((prev) => prev.filter((f) => f.path !== path));

  const importManifestFromPath = async (manifestPath: string): Promise<void> => {
    setManifestError(null);
    setImportingManifest(true);
    try {
      const manifest = await window.api.importManifest(manifestPath);
      setVersion(manifest.version);
      setTitle(manifest.title);
      setChangelog(manifest.changelog);
      addFiles(manifest.files);
    } catch (err) {
      setManifestError(err instanceof Error ? err.message : String(err));
    } finally {
      setImportingManifest(false);
    }
  };

  const handleImportManifestDialog = async (): Promise<void> => {
    const manifestPath = await window.api.pickManifest();
    if (manifestPath) await importManifestFromPath(manifestPath);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(event.dataTransfer.files) as (File & { path?: string })[];

    if (project.rawManifestFileName) {
      const manifestFile = droppedFiles.find((f) => f.name === project.rawManifestFileName);
      if (manifestFile?.path) {
        void importManifestFromPath(manifestFile.path);
        return;
      }
    }

    const picked: PickedFile[] = droppedFiles.filter((f) => f.path).map((f) => ({ path: f.path!, name: f.name, sizeBytes: f.size }));
    addFiles(picked);
  };

  const handlePublish = async (): Promise<void> => {
    setPublishing(true);
    setLog([]);
    setResult(null);
    try {
      const response = await window.api.publish({
        projectId: project.id,
        version,
        title,
        changelog,
        filePaths: files.map((f) => f.path),
        prerelease,
        verifyAll,
      });
      if (response.success) {
        setResult({
          success: true,
          message: `Version ${version} publiée${response.verified ? " et vérifiée" : ""} : ${response.releaseUrl}`,
        });
        onPublished();
      } else {
        setResult({ success: false, message: response.errorMessage });
      }
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`flex flex-col gap-4 rounded-xl border-2 border-dashed p-3 transition-colors ${
          isDragOver ? "border-prusa-orange bg-surface-1/50" : "border-transparent"
        }`}
      >
        {project.rawManifestFileName && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface-1/50 px-3 py-2">
            <span className="text-xs text-text-secondary">
              Glissez-déposez le fichier <span className="font-mono text-text-primary">{project.rawManifestFileName}</span> (généré à
              la compilation) pour tout remplir automatiquement.
            </span>
            <Button variant="secondary" onClick={() => void handleImportManifestDialog()} disabled={importingManifest}>
              {importingManifest ? "Import…" : "Importer version"}
            </Button>
          </div>
        )}
        {manifestError && <p className="text-xs text-confidence-low">{manifestError}</p>}

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-text-muted">Version (SemVer)</span>
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.1.0"
              className={`rounded-lg border bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-prusa-orange ${
                versionValid ? "border-border-subtle" : "border-confidence-low"
              }`}
            />
            {!versionValid && <span className="text-xs text-confidence-low">Format attendu : MAJEUR.MINEUR.CORRECTIF (ex. 1.2.0)</span>}
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-text-muted">Titre de la version</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Corrections diverses et améliorations"
              className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-prusa-orange"
            />
          </label>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input type="checkbox" checked={prerelease} onChange={(e) => setPrerelease(e.target.checked)} className="accent-prusa-orange" />
            Version préliminaire (pre-release)
          </label>
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input type="checkbox" checked={verifyAll} onChange={(e) => setVerifyAll(e.target.checked)} className="accent-prusa-orange" />
            Vérification complète (tous les fichiers)
          </label>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-text-muted">Notes de version (Markdown)</span>
            <button onClick={() => setShowPreview((v) => !v)} className="text-xs text-prusa-orange hover:text-prusa-orange-glow">
              {showPreview ? "Éditer" : "Aperçu"}
            </button>
          </div>
          {showPreview ? (
            <div
              className="h-40 overflow-y-auto rounded-lg border border-border-subtle bg-surface-2 p-3 text-sm text-text-secondary"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <textarea
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder={"## Nouveautés\n- Amélioration de l'orientation automatique\n- Correction du menu Affichage"}
              className="h-40 w-full resize-none rounded-lg border border-border-subtle bg-surface-2 p-3 text-sm text-text-primary outline-none focus:border-prusa-orange"
            />
          )}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wide text-text-muted">Fichiers à publier</span>
            <Button variant="secondary" onClick={() => void handlePickFiles()}>
              + Ajouter des fichiers
            </Button>
          </div>
          {files.length === 0 ? (
            <p className="text-xs text-text-muted">Aucun fichier sélectionné. Glissez-déposez des fichiers ici, ou utilisez le bouton ci-dessus.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {files.map((f) => (
                <li key={f.path} className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-xs">
                  <span className="text-text-secondary">{f.name}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-text-muted">{formatBytes(f.sizeBytes)}</span>
                    <button onClick={() => removeFile(f.path)} className="text-text-muted hover:text-confidence-low">
                      ✕
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button onClick={() => void handlePublish()} disabled={!canPublish}>
          {publishing ? "Publication en cours…" : "Publier la version"}
        </Button>

        {result && (
          <p className={`text-xs ${result.success ? "text-confidence-high" : "text-confidence-low"}`}>{result.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide text-text-muted">Journal des opérations</span>
        <div className="h-[420px] overflow-y-auto rounded-lg border border-border-subtle bg-surface-1 p-3 font-mono text-xs text-text-secondary">
          {log.length === 0 ? <p className="text-text-muted">En attente de publication…</p> : log.map((line, i) => <p key={i}>{line}</p>)}
        </div>
      </div>
    </div>
  );
}
