import { useEffect, useState } from "react";
import { Button } from "./Button.js";
import type { PublisherConfig } from "../../../shared/ipc-types.js";

export function ConfigTab(): React.JSX.Element {
  const [config, setConfig] = useState<PublisherConfig | null>(null);
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void window.api.getConfig().then((c) => {
      setConfig(c);
      setOwner(c.owner);
      setRepo(c.repo);
    });
  }, []);

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    setSaved(false);
    try {
      await window.api.saveConfig({ owner: owner.trim(), repo: repo.trim(), token: tokenInput || undefined });
      const updated = await window.api.getConfig();
      setConfig(updated);
      setTokenInput("");
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <div>
        <p className="mb-1 text-xs uppercase tracking-wide text-text-muted">Dépôt GitHub</p>
        <div className="flex gap-2">
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="propriétaire (ex : suceunq)"
            className="flex-1 rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-prusa-orange"
          />
          <input
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder="dépôt (ex : LayerAI)"
            className="flex-1 rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-prusa-orange"
          />
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-text-muted">Jeton d'accès personnel (PAT) GitHub</span>
        <input
          type="password"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder={config?.hasToken ? "•••••••••••••••••••• (déjà enregistré)" : "ghp_..."}
          className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-prusa-orange"
        />
        <span className="text-xs text-text-muted">
          Le jeton doit avoir la portée "repo" (releases). Il est chiffré au repos (DPAPI Windows via Electron safeStorage) et n'est
          jamais écrit en clair. Créez-en un sur github.com → Settings → Developer settings → Personal access tokens.
        </span>
      </label>

      <div className="flex items-center gap-3">
        <Button onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
        {saved && <span className="text-xs text-confidence-high">✓ Configuration enregistrée</span>}
      </div>
    </div>
  );
}
