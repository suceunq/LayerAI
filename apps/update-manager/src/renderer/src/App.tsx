import { useEffect, useState } from "react";
import { PublishTab } from "./components/PublishTab.js";
import { HistoryTab } from "./components/HistoryTab.js";
import { ConfigTab } from "./components/ConfigTab.js";

type Tab = "publish" | "history" | "config";

export default function App(): React.JSX.Element {
  const [tab, setTab] = useState<Tab>("publish");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [appVersion, setAppVersion] = useState("");

  useEffect(() => {
    void window.api.getAppVersion().then(setAppVersion);
  }, []);

  return (
    <div className="flex h-full flex-col bg-surface-0">
      <header className="flex items-center gap-3 border-b border-border-subtle px-5 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-prusa-orange text-sm font-bold text-surface-0">L</div>
        <h1 className="text-base font-semibold tracking-tight text-text-primary">
          LayerAI <span className="text-prusa-orange">Update Manager</span>
        </h1>
        {appVersion && <span className="ml-2 text-xs text-text-muted">v{appVersion}</span>}
      </header>

      <div className="flex border-b border-border-subtle px-5">
        {(
          [
            { id: "publish", label: "Publier" },
            { id: "history", label: "Historique" },
            { id: "config", label: "Configuration" },
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

      <main className="flex-1 overflow-y-auto p-5">
        {tab === "publish" && <PublishTab onPublished={() => setHistoryRefreshKey((k) => k + 1)} />}
        {tab === "history" && <HistoryTab refreshKey={historyRefreshKey} />}
        {tab === "config" && <ConfigTab />}
      </main>
    </div>
  );
}
