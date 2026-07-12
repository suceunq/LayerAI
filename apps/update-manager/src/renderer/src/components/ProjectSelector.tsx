import { Button } from "./Button.js";
import type { Project } from "../../../shared/ipc-types.js";

export function ProjectSelector({
  projects,
  onSelect,
  onCreate,
}: {
  projects: Project[];
  onSelect: (projectId: string) => void;
  onCreate: () => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Vos logiciels</h2>
          <p className="text-xs text-text-muted">Sélectionnez un projet pour publier une mise à jour ou consulter son historique.</p>
        </div>
        <Button onClick={onCreate}>+ Nouveau projet</Button>
      </div>

      {projects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border-subtle p-6 text-center text-xs text-text-muted">
          Aucun projet configuré. Créez-en un pour commencer à publier des mises à jour.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => onSelect(project.id)}
              className="flex flex-col items-start gap-2 rounded-xl border border-border-subtle bg-surface-1 p-4 text-left transition-colors hover:border-prusa-orange"
            >
              <div className="flex w-full items-center gap-3">
                {project.iconDataUrl ? (
                  <img src={project.iconDataUrl} alt="" className="h-9 w-9 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-sm font-semibold text-text-secondary">
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">{project.name}</p>
                  <p className="truncate text-xs text-text-muted">{project.repo}</p>
                </div>
              </div>
              <p className="text-xs text-text-secondary">{project.currentVersion ? `v${project.currentVersion}` : "Pas encore publié"}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
