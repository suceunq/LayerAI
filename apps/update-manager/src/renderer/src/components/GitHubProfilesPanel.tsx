import { useEffect, useState } from "react";
import { Button } from "./Button.js";
import type { GitHubProfile } from "../../../shared/ipc-types.js";

interface FormState {
  id?: string;
  label: string;
  owner: string;
  token: string;
}

const EMPTY_FORM: FormState = { label: "", owner: "", token: "" };

export function GitHubProfilesPanel(): React.JSX.Element {
  const [profiles, setProfiles] = useState<GitHubProfile[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const reload = async (): Promise<void> => setProfiles(await window.api.githubProfiles.list());

  useEffect(() => {
    void reload();
  }, []);

  const startCreate = (): void => {
    setForm({ ...EMPTY_FORM });
    setError(null);
    setTestResult(null);
  };

  const startEdit = (profile: GitHubProfile): void => {
    setForm({ id: profile.id, label: profile.label, owner: profile.owner, token: "" });
    setError(null);
    setTestResult(null);
  };

  const handleTest = async (): Promise<void> => {
    if (!form) return;
    setTesting(true);
    setTestResult(null);
    try {
      // A repo name is required to test push access, but the profile itself has no fixed repo (it's
      // shared across projects) - test against a throwaway name just to validate the token/owner pair.
      const result = await window.api.githubProfiles.testConnection({ owner: form.owner, repo: "*", token: form.token });
      if (result.errorMessage) setTestResult(`✗ ${result.errorMessage}`);
      else setTestResult(result.exists ? "✓ Connexion établie, dépôt trouvé." : "✓ Jeton valide (le dépôt de test n'existe pas, c'est attendu).");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const request = { id: form.id, label: form.label.trim(), owner: form.owner.trim(), token: form.token || undefined };
      if (form.id) await window.api.githubProfiles.update(request);
      else await window.api.githubProfiles.create(request);
      setForm(null);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    try {
      await window.api.githubProfiles.delete(id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Comptes GitHub</h2>
          <p className="text-xs text-text-muted">
            Un compte regroupe un propriétaire (utilisateur/organisation) et un jeton d'accès personnel. Chaque projet choisit ensuite le
            compte et le dépôt à utiliser.
          </p>
        </div>
        {!form && <Button onClick={startCreate}>+ Ajouter un compte</Button>}
      </div>

      {error && <p className="text-xs text-confidence-low">{error}</p>}

      {profiles.length === 0 && !form && (
        <p className="rounded-lg border border-dashed border-border-subtle p-4 text-xs text-text-muted">Aucun compte GitHub configuré.</p>
      )}

      <ul className="flex flex-col gap-2">
        {profiles.map((profile) => (
          <li
            key={profile.id}
            className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium text-text-primary">{profile.label}</p>
              <p className="text-xs text-text-muted">{profile.owner} · {profile.hasToken ? "jeton enregistré" : "aucun jeton"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => startEdit(profile)}>
                Modifier
              </Button>
              <Button variant="ghost" onClick={() => void handleDelete(profile.id)}>
                Supprimer
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {form && (
        <div className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface-1 p-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-text-muted">Nom du compte</span>
            <input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Personnel (suceunq)"
              className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-prusa-orange"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-text-muted">Propriétaire (utilisateur ou organisation)</span>
            <input
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
              placeholder="suceunq"
              className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-prusa-orange"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-text-muted">Jeton d'accès personnel (PAT)</span>
            <input
              type="password"
              value={form.token}
              onChange={(e) => setForm({ ...form, token: e.target.value })}
              placeholder={form.id ? "•••••••••••••••••••• (laisser vide pour conserver)" : "ghp_..."}
              className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-prusa-orange"
            />
            <span className="text-xs text-text-muted">
              Portée "repo" requise. Chiffré au repos (DPAPI Windows via Electron safeStorage), jamais écrit en clair.
            </span>
          </label>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => void handleTest()} disabled={testing || !form.owner || !form.token}>
              {testing ? "Test…" : "Tester la connexion"}
            </Button>
            {testResult && <span className="text-xs text-text-secondary">{testResult}</span>}
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={() => void handleSave()} disabled={saving || !form.label.trim() || !form.owner.trim() || (!form.id && !form.token)}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
            <Button variant="ghost" onClick={() => setForm(null)}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
