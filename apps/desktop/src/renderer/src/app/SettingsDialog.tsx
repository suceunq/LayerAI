import { useEffect, useState } from "react";
import { useAppStore } from "../state/useAppStore.js";
import { useTranslation } from "../i18n/useTranslation.js";
import { Button } from "../components/ui/Button.js";
import { AI_PROVIDERS, providerMeta, type AiProviderId } from "../../../shared/ai-providers.js";
import type { AiSettingsPublic } from "../../../shared/ipc-types.js";

type TestState = "idle" | "testing" | "success" | { error: string };

interface EditableProvider {
  id: AiProviderId;
  hasApiKey: boolean;
  apiKeyInput: string;
  model: string;
  baseUrl: string;
  testState: TestState;
}

function toEditable(p: AiSettingsPublic["providers"][number]): EditableProvider {
  return { id: p.id, hasApiKey: p.hasApiKey, apiKeyInput: "", model: p.model ?? "", baseUrl: p.baseUrl ?? "", testState: "idle" };
}

export function SettingsDialog(): React.JSX.Element | null {
  const open = useAppStore((s) => s.settingsDialogOpen);
  const toggleOpen = useAppStore((s) => s.toggleSettingsDialog);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const { t } = useTranslation();

  const [tab, setTab] = useState<"apiKeys" | "language">("apiKeys");
  const [providers, setProviders] = useState<EditableProvider[]>([]);
  const [defaultProviderId, setDefaultProviderId] = useState<AiProviderId | null>(null);
  const [cloudIntentEnabled, setCloudIntentEnabledState] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    void window.api.getAiSettings().then((settings) => {
      setProviders(settings.providers.map(toEditable));
      setDefaultProviderId(settings.defaultProviderId);
      setCloudIntentEnabledState(settings.cloudIntentEnabled);
    });
  }, [open]);

  if (!open) return null;

  const configuredIds = new Set(providers.map((p) => p.id));
  const availableToAdd = AI_PROVIDERS.filter((p) => !configuredIds.has(p.id));

  const updateProvider = (id: AiProviderId, patch: Partial<EditableProvider>): void => {
    setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const addProvider = (id: AiProviderId): void => {
    setProviders((prev) => [...prev, { id, hasApiKey: false, apiKeyInput: "", model: "", baseUrl: "", testState: "idle" }]);
    if (!defaultProviderId) setDefaultProviderId(id);
  };

  const removeProvider = async (id: AiProviderId): Promise<void> => {
    await window.api.deleteAiProvider(id);
    setProviders((prev) => prev.filter((p) => p.id !== id));
    if (defaultProviderId === id) setDefaultProviderId(null);
  };

  const testProvider = async (provider: EditableProvider): Promise<void> => {
    updateProvider(provider.id, { testState: "testing" });
    const result = await window.api.testAiProvider({
      id: provider.id,
      apiKey: provider.apiKeyInput || undefined,
      model: provider.model || undefined,
      baseUrl: provider.baseUrl || undefined,
    });
    updateProvider(provider.id, { testState: result.success ? "success" : { error: result.message } });
  };

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    try {
      for (const p of providers) {
        await window.api.saveAiProvider({
          id: p.id,
          apiKey: p.apiKeyInput || undefined,
          model: p.model || undefined,
          baseUrl: p.baseUrl || undefined,
        });
      }
      await window.api.setDefaultAiProvider(defaultProviderId);
      await window.api.setCloudIntentEnabled(cloudIntentEnabled);
      toggleOpen();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60" onClick={toggleOpen}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-[560px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-0 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
          <h2 className="text-base font-semibold text-text-primary">{t("settings.title")}</h2>
          <button onClick={toggleOpen} className="text-text-muted hover:text-text-primary">
            ✕
          </button>
        </div>

        <div className="flex border-b border-border-subtle px-5">
          <button
            onClick={() => setTab("apiKeys")}
            className={`border-b-2 px-3 py-2 text-sm ${tab === "apiKeys" ? "border-prusa-orange text-prusa-orange" : "border-transparent text-text-muted hover:text-text-primary"}`}
          >
            {t("settings.tabApiKeys")}
          </button>
          <button
            onClick={() => setTab("language")}
            className={`border-b-2 px-3 py-2 text-sm ${tab === "language" ? "border-prusa-orange text-prusa-orange" : "border-transparent text-text-muted hover:text-text-primary"}`}
          >
            {t("settings.tabLanguage")}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === "language" ? (
            <div className="flex flex-col gap-2">
              {(["fr", "en"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => void setLanguage(lang)}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
                    language === lang ? "border-prusa-orange bg-prusa-orange/10 text-prusa-orange" : "border-border-subtle text-text-secondary hover:border-prusa-orange hover:text-text-primary"
                  }`}
                >
                  {t(lang === "fr" ? "settings.language.french" : "settings.language.english")}
                  {language === lang && <span>✓</span>}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {providers.map((provider) => {
                const meta = providerMeta(provider.id);
                return (
                  <div key={provider.id} className="rounded-lg border border-border-subtle bg-surface-1 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{meta.displayName}</p>
                        <p className="text-xs text-text-muted">{t("settings.apiKeys.estimatedCost", { cost: meta.costHint })}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setDefaultProviderId(provider.id)}
                          title={t("settings.apiKeys.defaultProvider")}
                          className={`h-4 w-4 rounded-full border ${defaultProviderId === provider.id ? "border-prusa-orange bg-prusa-orange" : "border-border-subtle"}`}
                        />
                        <button onClick={() => void removeProvider(provider.id)} className="text-text-muted hover:text-confidence-low">
                          🗑
                        </button>
                      </div>
                    </div>

                    {meta.requiresApiKey && (
                      <label className="mt-3 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.apiKeys.apiKey")}</span>
                          <a href={meta.docsUrl} target="_blank" rel="noreferrer" className="text-xs text-prusa-orange hover:text-prusa-orange-glow">
                            {t("settings.apiKeys.getKey")} ↗
                          </a>
                        </div>
                        <input
                          type="password"
                          value={provider.apiKeyInput}
                          onChange={(e) => updateProvider(provider.id, { apiKeyInput: e.target.value })}
                          placeholder={provider.hasApiKey ? "••••••••••••" : "sk-..."}
                          className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-prusa-orange"
                        />
                      </label>
                    )}

                    {provider.id === "lmstudio" && (
                      <label className="mt-3 flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.apiKeys.baseUrl")}</span>
                        <input
                          value={provider.baseUrl}
                          onChange={(e) => updateProvider(provider.id, { baseUrl: e.target.value })}
                          placeholder={meta.defaultBaseUrl}
                          className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-prusa-orange"
                        />
                      </label>
                    )}

                    {provider.id !== "lmstudio" && (
                      <label className="mt-3 flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.apiKeys.model")}</span>
                        <input
                          value={provider.model}
                          onChange={(e) => updateProvider(provider.id, { model: e.target.value })}
                          placeholder={meta.defaultModel ? t("settings.apiKeys.modelDefault", { model: meta.defaultModel }) : undefined}
                          className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-prusa-orange"
                        />
                      </label>
                    )}

                    <div className="mt-3 flex items-center gap-3">
                      <Button variant="secondary" onClick={() => void testProvider(provider)} disabled={provider.testState === "testing"}>
                        {provider.testState === "testing" ? t("settings.apiKeys.testing") : t("settings.apiKeys.test")}
                      </Button>
                      {provider.testState === "success" && <span className="text-xs text-confidence-high">{t("settings.apiKeys.testSuccess")}</span>}
                      {typeof provider.testState === "object" && (
                        <span className="text-xs text-confidence-low">
                          {t("settings.apiKeys.testFailure", { message: provider.testState.error })}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              <div>
                <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">{t("settings.apiKeys.addProvider")}</p>
                <div className="flex flex-wrap gap-2">
                  {availableToAdd.map((meta) => (
                    <button
                      key={meta.id}
                      onClick={() => addProvider(meta.id)}
                      className="rounded-full border border-border-subtle bg-surface-2 px-3 py-1.5 text-sm text-text-secondary hover:border-prusa-orange hover:text-text-primary"
                    >
                      + {meta.displayName}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2 rounded-lg border border-border-subtle bg-surface-1 p-3 text-xs text-text-muted">
                <input
                  type="checkbox"
                  checked={cloudIntentEnabled}
                  onChange={(e) => setCloudIntentEnabledState(e.target.checked)}
                  disabled={providers.length === 0}
                  className="mt-0.5 accent-prusa-orange"
                />
                <span>
                  <span className="block text-text-secondary">{t("settings.apiKeys.cloudModeToggle")}</span>
                  {providers.length === 0 ? t("settings.apiKeys.noProviders") : t("settings.apiKeys.cloudModeHint")}
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-3">
          <Button variant="secondary" onClick={toggleOpen}>
            {t("settings.cancel")}
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {t("settings.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
