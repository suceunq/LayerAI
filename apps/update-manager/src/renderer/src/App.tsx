import { useCallback, useEffect, useState } from "react";
import { ProjectSelector } from "./components/ProjectSelector.js";
import { ProjectForm } from "./components/ProjectForm.js";
import { GitHubProfilesPanel } from "./components/GitHubProfilesPanel.js";
import { ProjectWorkspace } from "./components/ProjectWorkspace.js";
import type { Project } from "../../shared/ipc-types.js";

type View =
  | { name: "home" }
  | { name: "profiles" }
  | { name: "newProject" }
  | { name: "editProject"; projectId: string }
  | { name: "project"; projectId: string };

export default function App(): React.JSX.Element {
  const [view, setView] = useState<View>({ name: "home" });
  const [projects, setProjects] = useState<Project[]>([]);
  const [appVersion, setAppVersion] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const reloadProjects = useCallback(async (): Promise<void> => {
    setProjects(await window.api.projects.list());
  }, []);

  useEffect(() => {
    void window.api.getAppVersion().then(setAppVersion);
  }, []);

  useEffect(() => {
    void reloadProjects();
  }, [reloadProjects, refreshKey]);

  const handleProjectSaved = async (project: Project): Promise<void> => {
    await reloadProjects();
    setView({ name: "project", projectId: project.id });
  };

  return (
    <div className="flex h-full flex-col bg-surface-0">
      <header className="flex items-center gap-3 border-b border-border-subtle px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-prusa-orange text-sm font-bold text-surface-0">U</div>
        <h1 className="text-base font-semibold tracking-tight text-text-primary">Update Manager</h1>
        {appVersion && <span className="ml-2 text-xs text-text-muted">v{appVersion}</span>}
        <div className="ml-auto flex items-center gap-2">
          {view.name !== "home" && (
            <button
              onClick={() => setView({ name: "home" })}
              className="text-xs text-text-muted hover:text-text-primary"
            >
              ← Projets
            </button>
          )}
          <button
            onClick={() => setView({ name: "profiles" })}
            className={`text-xs ${view.name === "profiles" ? "text-prusa-orange" : "text-text-muted hover:text-text-primary"}`}
          >
            Comptes GitHub
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-5">
        {view.name === "home" && (
          <ProjectSelector
            projects={projects}
            onSelect={(id) => setView({ name: "project", projectId: id })}
            onCreate={() => setView({ name: "newProject" })}
          />
        )}

        {view.name === "profiles" && <GitHubProfilesPanel />}

        {(view.name === "newProject" || view.name === "editProject") && (
          <ProjectForm
            projectId={view.name === "editProject" ? view.projectId : undefined}
            onSaved={(project) => void handleProjectSaved(project)}
            onCancel={() => setView(view.name === "editProject" ? { name: "project", projectId: view.projectId } : { name: "home" })}
          />
        )}

        {view.name === "project" && (
          <ProjectWorkspace
            projectId={view.projectId}
            onEdit={() => setView({ name: "editProject", projectId: view.projectId })}
            onDeleted={() => {
              setRefreshKey((k) => k + 1);
              setView({ name: "home" });
            }}
          />
        )}
      </main>
    </div>
  );
}
