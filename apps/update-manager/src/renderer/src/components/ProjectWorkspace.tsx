import { useEffect, useState } from "react";
import { Button } from "./Button.js";
import { PublishTab } from "./PublishTab.js";
import { HistoryTab } from "./HistoryTab.js";
import type { Project } from "../../../shared/ipc-types.js";

type Tab = "publish" | "history";

export function ProjectWorkspace({
  projectId,
  onEdit,
  onDeleted,
}: {
  projectId: string;
  onEdit: () => void;
  onDeleted: () => void;
}): React.JSX.Element {
  const [project, setProject] = useState<Project | null>(null);
  const [tab, setTab] = useState<Tab>("publish");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    void window.api.projects.get(projectId).then((p) => setProject(p ?? null));
  }, [projectId]);

  if (!project) return <p className="text-xs text-text-muted">Chargement…</p>;

  const handleDelete = async (): Promise<void> => {
    await window.api.projects.delete(project.id);
    onDeleted();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {project.iconDataUrl ? (
            <img src={project.iconDataUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-sm font-semibold text-text-secondary">
              {project.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-sm font-semibold text-text-primary">{project.name}</h2>
            <p className="text-xs text-text-muted">
              {project.repo} · {project.currentVersion ? `v${project.currentVersion}` : "Pas encore publié"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => void window.api.projects.openStagingFolder(project.id)}>
            Ouvrir le dossier de mise en attente
          </Button>
          <Button variant="secondary" onClick={onEdit}>
            Modifier
          </Button>
          {confirmingDelete ? (
            <>
              <span className="text-xs text-confidence-low">Supprimer définitivement ?</span>
              <Button variant="ghost" onClick={() => void handleDelete()}>
                Confirmer
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingDelete(false)}>
                Annuler
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmingDelete(true)}>
              Supprimer
            </Button>
          )}
        </div>
      </div>

      <div className="flex border-b border-border-subtle">
        {(
          [
            { id: "publish", label: "Publier" },
            { id: "history", label: "Historique" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-3 py-2 text-sm ${
              tab === t.id ? "border-prusa-orange text-prusa-orange" : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "publish" && <PublishTab project={project} onPublished={() => setHistoryRefreshKey((k) => k + 1)} />}
      {tab === "history" && <HistoryTab projectId={project.id} refreshKey={historyRefreshKey} />}
    </div>
  );
}
