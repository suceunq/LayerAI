import { useEffect, useState } from "react";
import { useAppStore } from "../state/useAppStore.js";
import { useTranslation } from "../i18n/useTranslation.js";
import { Button } from "../components/ui/Button.js";
import { AI_PROVIDERS, providerMeta, type AiProviderId } from "../../../shared/ai-providers.js";
import type { AiSettingsPublic, CompanyLegalStatus, CompanySettings } from "../../../shared/ipc-types.js";
import { useModalAccessibility } from "../hooks/useModalAccessibility.js";
import { SUPPORTED_LANGUAGES, type LanguagePreference } from "../../../shared/languages.js";

type TestState = "idle" | "testing" | "success" | { error: string };

const LANGUAGE_LABEL_KEYS: Record<LanguagePreference, string> = {
  system: "settings.language.system",
  fr: "settings.language.french",
  en: "settings.language.english",
  de: "settings.language.german",
  es: "settings.language.spanish",
  it: "settings.language.italian",
};

const DEFAULT_COMPANY: CompanySettings = {
  legalStatus: "auto-entrepreneur",
  name: "",
  addressLine1: "",
  addressLine2: "",
  postalCode: "",
  city: "",
  siret: "",
  rcsCity: "",
  capitalSocial: "",
  vatApplicable: false,
  vatNumber: "",
  vatRatePercent: 20,
  email: "",
  phone: "",
  iban: "",
  paymentTermsDays: 30,
  invoicePrefix: "FACT-",
};

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
  const languagePreference = useAppStore((s) => s.languagePreference);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const checkUpdatesOnStartup = useAppStore((s) => s.checkUpdatesOnStartup);
  const setCheckUpdatesOnStartup = useAppStore((s) => s.setCheckUpdatesOnStartup);
  const openUpdateDialogAndCheck = useAppStore((s) => s.openUpdateDialogAndCheck);
  const costSettings = useAppStore((s) => s.costSettings);
  const setCostSettings = useAppStore((s) => s.setCostSettings);
  const companySettings = useAppStore((s) => s.companySettings);
  const setCompanySettings = useAppStore((s) => s.setCompanySettings);
  const tab = useAppStore((s) => s.settingsDialogTab);
  const setTab = useAppStore((s) => s.setSettingsDialogTab);
  const showWelcomeOnStartup = useAppStore((s) => s.showWelcomeOnStartup);
  const setDonationSettings = useAppStore((s) => s.setDonationSettings);
  const { t } = useTranslation();
  const dialogRef = useModalAccessibility(open, toggleOpen);

  const [costsForm, setCostsForm] = useState(costSettings);
  const [companyForm, setCompanyForm] = useState<CompanySettings>(companySettings ?? DEFAULT_COMPANY);
  const [showWelcomeForm, setShowWelcomeForm] = useState(showWelcomeOnStartup);

  useEffect(() => {
    if (open) {
      setCostsForm(costSettings);
      setCompanyForm(companySettings ?? DEFAULT_COMPANY);
      setShowWelcomeForm(showWelcomeOnStartup);
    }
  }, [open, costSettings, companySettings, showWelcomeOnStartup]);
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
      await setCostSettings(costsForm);
      await setCompanySettings(companyForm);
      await setDonationSettings(showWelcomeForm);
      toggleOpen();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60" onClick={toggleOpen}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="settings-dialog-title" tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-[620px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-0 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
          <h2 id="settings-dialog-title" className="text-base font-semibold text-text-primary">{t("settings.title")}</h2>
          <button onClick={toggleOpen} aria-label={t("accessibility.closeDialog")} className="text-text-muted hover:text-text-primary">
            ✕
          </button>
        </div>

        <div className="flex overflow-x-auto border-b border-border-subtle px-5" role="tablist" aria-label={t("settings.title")}>
          <button
            role="tab" aria-selected={tab === "apiKeys"} aria-controls="settings-tabpanel"
            onClick={() => setTab("apiKeys")}
            className={`border-b-2 px-3 py-2 text-sm ${tab === "apiKeys" ? "border-accent text-accent" : "border-transparent text-text-muted hover:text-text-primary"}`}
          >
            {t("settings.tabApiKeys")}
          </button>
          <button
            role="tab" aria-selected={tab === "language"} aria-controls="settings-tabpanel"
            onClick={() => setTab("language")}
            className={`border-b-2 px-3 py-2 text-sm ${tab === "language" ? "border-accent text-accent" : "border-transparent text-text-muted hover:text-text-primary"}`}
          >
            {t("settings.tabLanguage")}
          </button>
          <button
            role="tab" aria-selected={tab === "updates"} aria-controls="settings-tabpanel"
            onClick={() => setTab("updates")}
            className={`border-b-2 px-3 py-2 text-sm ${tab === "updates" ? "border-accent text-accent" : "border-transparent text-text-muted hover:text-text-primary"}`}
          >
            {t("settings.tabUpdates")}
          </button>
          <button
            role="tab" aria-selected={tab === "support"} aria-controls="settings-tabpanel"
            onClick={() => setTab("support")}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm ${tab === "support" ? "border-accent text-accent" : "border-transparent text-text-muted hover:text-text-primary"}`}
          >
            {t("settings.tabSupport")}
          </button>
          <button
            role="tab" aria-selected={tab === "costs"} aria-controls="settings-tabpanel"
            onClick={() => setTab("costs")}
            className={`border-b-2 px-3 py-2 text-sm ${tab === "costs" ? "border-accent text-accent" : "border-transparent text-text-muted hover:text-text-primary"}`}
          >
            {t("settings.tabCosts")}
          </button>
          <button
            role="tab" aria-selected={tab === "company"} aria-controls="settings-tabpanel"
            onClick={() => setTab("company")}
            className={`border-b-2 px-3 py-2 text-sm ${tab === "company" ? "border-accent text-accent" : "border-transparent text-text-muted hover:text-text-primary"}`}
          >
            {t("settings.tabCompany")}
          </button>
        </div>

        <div id="settings-tabpanel" role="tabpanel" className="flex-1 overflow-y-auto p-5">
          {tab === "support" ? (
            <div className="flex flex-col gap-5">
              <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
                <p className="font-medium text-text-primary">{t("settings.support.title")}</p>
                <p className="mt-1 text-xs leading-5 text-text-muted">{t("settings.support.intro")}</p>
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-border-subtle bg-surface-1 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={showWelcomeForm}
                  onChange={(event) => setShowWelcomeForm(event.target.checked)}
                  className="mt-0.5 accent-accent"
                />
                <span>
                  <span className="block text-text-secondary">{t("settings.support.showWelcome")}</span>
                  <span className="mt-0.5 block text-xs text-text-muted">{t("settings.support.showWelcomeHint")}</span>
                </span>
              </label>

            </div>
          ) : tab === "company" ? (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-text-muted">{t("settings.company.intro")}</p>

              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.company.legalStatus")}</span>
                <select
                  value={companyForm.legalStatus}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, legalStatus: e.target.value as CompanyLegalStatus }))}
                  className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                >
                  <option value="auto-entrepreneur">{t("settings.company.statusAutoEntrepreneur")}</option>
                  <option value="entreprise-individuelle">{t("settings.company.statusEi")}</option>
                  <option value="societe">{t("settings.company.statusSociete")}</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.company.name")}</span>
                <input
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, name: e.target.value }))}
                  className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.company.addressLine1")}</span>
                <input
                  value={companyForm.addressLine1}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, addressLine1: e.target.value }))}
                  className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.company.addressLine2")}</span>
                <input
                  value={companyForm.addressLine2 ?? ""}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, addressLine2: e.target.value }))}
                  className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                />
              </label>

              <div className="flex gap-3">
                <label className="flex w-28 flex-col gap-1">
                  <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.company.postalCode")}</span>
                  <input
                    value={companyForm.postalCode}
                    onChange={(e) => setCompanyForm((f) => ({ ...f, postalCode: e.target.value }))}
                    className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.company.city")}</span>
                  <input
                    value={companyForm.city}
                    onChange={(e) => setCompanyForm((f) => ({ ...f, city: e.target.value }))}
                    className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.company.siret")}</span>
                <input
                  value={companyForm.siret}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, siret: e.target.value }))}
                  placeholder="123 456 789 00012"
                  className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                />
              </label>

              {companyForm.legalStatus === "societe" && (
                <>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.company.rcsCity")}</span>
                    <input
                      value={companyForm.rcsCity ?? ""}
                      onChange={(e) => setCompanyForm((f) => ({ ...f, rcsCity: e.target.value }))}
                      className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.company.capitalSocial")}</span>
                    <input
                      value={companyForm.capitalSocial ?? ""}
                      onChange={(e) => setCompanyForm((f) => ({ ...f, capitalSocial: e.target.value }))}
                      placeholder="1 000 €"
                      className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                    />
                  </label>
                </>
              )}

              <label className="flex items-start gap-2 rounded-lg border border-border-subtle bg-surface-1 p-3 text-xs text-text-muted">
                <input
                  type="checkbox"
                  checked={companyForm.vatApplicable}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, vatApplicable: e.target.checked }))}
                  className="mt-0.5 accent-accent"
                />
                <span className="text-text-secondary">{t("settings.company.vatApplicable")}</span>
              </label>

              {companyForm.vatApplicable && (
                <div className="flex gap-3">
                  <label className="flex flex-1 flex-col gap-1">
                    <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.company.vatNumber")}</span>
                    <input
                      value={companyForm.vatNumber ?? ""}
                      onChange={(e) => setCompanyForm((f) => ({ ...f, vatNumber: e.target.value }))}
                      placeholder="FR00123456789"
                      className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                    />
                  </label>
                  <label className="flex w-28 flex-col gap-1">
                    <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.company.vatRate")}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      value={companyForm.vatRatePercent}
                      onChange={(e) => setCompanyForm((f) => ({ ...f, vatRatePercent: Number(e.target.value) }))}
                      className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                    />
                  </label>
                </div>
              )}

              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.company.email")}</span>
                  <input
                    value={companyForm.email ?? ""}
                    onChange={(e) => setCompanyForm((f) => ({ ...f, email: e.target.value }))}
                    className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.company.phone")}</span>
                  <input
                    value={companyForm.phone ?? ""}
                    onChange={(e) => setCompanyForm((f) => ({ ...f, phone: e.target.value }))}
                    className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.company.iban")}</span>
                <input
                  value={companyForm.iban ?? ""}
                  onChange={(e) => setCompanyForm((f) => ({ ...f, iban: e.target.value }))}
                  className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                />
              </label>

              <div className="flex gap-3">
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.company.paymentTermsDays")}</span>
                  <input
                    type="number"
                    min={0}
                    step="1"
                    value={companyForm.paymentTermsDays}
                    onChange={(e) => setCompanyForm((f) => ({ ...f, paymentTermsDays: Number(e.target.value) }))}
                    className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.company.invoicePrefix")}</span>
                  <input
                    value={companyForm.invoicePrefix}
                    onChange={(e) => setCompanyForm((f) => ({ ...f, invoicePrefix: e.target.value }))}
                    className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                  />
                </label>
              </div>
            </div>
          ) : tab === "costs" ? (
            <div className="flex flex-col gap-4">
              <p className="text-xs text-text-muted">{t("settings.costs.intro")}</p>
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.costs.currency")}</span>
                <input
                  value={costsForm.currency}
                  onChange={(e) => setCostsForm((f) => ({ ...f, currency: e.target.value }))}
                  placeholder="€"
                  maxLength={4}
                  className="w-20 rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.costs.filamentPricePerKg")}</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={costsForm.filamentPricePerKg ?? ""}
                  onChange={(e) => setCostsForm((f) => ({ ...f, filamentPricePerKg: e.target.value === "" ? null : Number(e.target.value) }))}
                  placeholder="25.00"
                  className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.costs.printerPowerW")}</span>
                <input
                  type="number"
                  min={0}
                  step="1"
                  value={costsForm.printerPowerW ?? ""}
                  onChange={(e) => setCostsForm((f) => ({ ...f, printerPowerW: e.target.value === "" ? null : Number(e.target.value) }))}
                  placeholder="120"
                  className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.costs.electricityPricePerKwh")}</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={costsForm.electricityPricePerKwh ?? ""}
                  onChange={(e) => setCostsForm((f) => ({ ...f, electricityPricePerKwh: e.target.value === "" ? null : Number(e.target.value) }))}
                  placeholder="0.20"
                  className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
                />
              </label>
            </div>
          ) : tab === "language" ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.language.title")}</span>
                {(["system", ...SUPPORTED_LANGUAGES] as const).map((preference) => (
                  <button
                    key={preference}
                    onClick={() => void setLanguage(preference)}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
                      languagePreference === preference ? "border-accent bg-accent/10 text-accent" : "border-border-subtle text-text-secondary hover:border-accent hover:text-text-primary"
                    }`}
                  >
                    <span>{t(LANGUAGE_LABEL_KEYS[preference])}{preference === "system" ? ` · ${language.toUpperCase()}` : ""}</span>
                    {languagePreference === preference && <span aria-hidden="true">✓</span>}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wide text-text-muted">{t("settings.theme.title")}</span>
                <div className="flex gap-2">
                  {(["dark", "light"] as const).map((themeOption) => (
                    <button
                      key={themeOption}
                      onClick={() => void setTheme(themeOption)}
                      className={`flex-1 rounded-lg border px-4 py-3 text-sm ${
                        theme === themeOption
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border-subtle text-text-secondary hover:border-accent hover:text-text-primary"
                      }`}
                    >
                      {t(themeOption === "dark" ? "settings.theme.dark" : "settings.theme.light")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : tab === "updates" ? (
            <div className="flex flex-col gap-4">
              <label className="flex items-start gap-2 rounded-lg border border-border-subtle bg-surface-1 p-3 text-xs text-text-muted">
                <input
                  type="checkbox"
                  checked={checkUpdatesOnStartup}
                  onChange={(e) => void setCheckUpdatesOnStartup(e.target.checked)}
                  className="mt-0.5 accent-accent"
                />
                <span className="text-text-secondary">{t("settings.updates.checkOnStartup")}</span>
              </label>
              <Button variant="secondary" onClick={() => { toggleOpen(); openUpdateDialogAndCheck(); }}>
                {t("settings.updates.checkNow")}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-xs text-text-secondary">
                {t("settings.apiKeys.privacyNotice")}
              </p>
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
                          className={`h-4 w-4 rounded-full border ${defaultProviderId === provider.id ? "border-accent bg-accent" : "border-border-subtle"}`}
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
                          <a href={meta.docsUrl} target="_blank" rel="noreferrer" className="text-xs text-accent hover:text-accent-glow">
                            {t("settings.apiKeys.getKey")} ↗
                          </a>
                        </div>
                        <input
                          type="password"
                          value={provider.apiKeyInput}
                          onChange={(e) => updateProvider(provider.id, { apiKeyInput: e.target.value })}
                          placeholder={provider.hasApiKey ? "••••••••••••" : "sk-..."}
                          className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
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
                          className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
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
                          className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-accent"
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
                      className="rounded-full border border-border-subtle bg-surface-2 px-3 py-1.5 text-sm text-text-secondary hover:border-accent hover:text-text-primary"
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
                  className="mt-0.5 accent-accent"
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
