import { useAppStore } from "../state/useAppStore.js";
import { useTranslation } from "../i18n/useTranslation.js";

function formatRelativeDate(iso: string, locale: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (diffMin < 60) return rtf.format(-diffMin, "minute");
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return rtf.format(-diffH, "hour");
  return rtf.format(-Math.round(diffH / 24), "day");
}

export function RecentProjectsList(): React.JSX.Element | null {
  const recentProjects = useAppStore((s) => s.recentProjects);
  const printers = useAppStore((s) => s.printers);
  const reopenRecentProject = useAppStore((s) => s.reopenRecentProject);
  const removeRecentProject = useAppStore((s) => s.removeRecentProject);
  const { t, language } = useTranslation();

  if (recentProjects.length === 0) return null;

  return (
    <div className="flex w-full flex-col gap-2">
      <span className="text-xs uppercase tracking-wide text-text-muted">{t("recent.title")}</span>
      <div className="flex flex-col gap-1">
        {recentProjects.map((project) => {
          const printerName = printers.find((p) => p.id === project.printerId)?.name ?? project.printerId;
          return (
            <div
              key={project.id}
              className="group flex items-center justify-between gap-2 rounded-lg border border-border-subtle bg-surface-1/50 px-3 py-2 text-left hover:border-accent"
            >
              <button onClick={() => void reopenRecentProject(project)} className="flex min-w-0 flex-1 flex-col items-start text-left">
                <span className="w-full truncate text-sm text-text-primary">{project.fileName}</span>
                <span className="text-xs text-text-muted">
                  {printerName} · {formatRelativeDate(project.lastOpenedAt, language)}
                </span>
              </button>
              <button
                onClick={() => void removeRecentProject(project.id)}
                title={t("recent.remove")}
                className="text-text-muted opacity-0 hover:text-confidence-low group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
