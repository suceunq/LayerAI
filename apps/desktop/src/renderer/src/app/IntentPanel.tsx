import { estimateWeightG } from "@layerai/mesh-analysis";
import { useAppStore } from "../state/useAppStore.js";
import { Button } from "../components/ui/Button.js";
import { Card } from "../components/ui/Card.js";
import { useTranslation } from "../i18n/useTranslation.js";

const EXAMPLE_PROMPT_KEYS = [
  "intent.example.strength",
  "intent.example.speed",
  "intent.example.quality",
  "intent.example.figurine",
  "intent.example.mechanical",
  "intent.example.outdoor",
  "intent.example.minimalSupports",
];

/** Risk descriptions are always generated in French by mesh-analysis (pure geometry logic, no i18n there); the dynamic numeric part is extracted here to re-localize the rest via translation keys. */
function extractRiskValue(id: string, description: string): string | undefined {
  if (id === "fragile_thin_wall") return /jusqu'à ([\d.]+) mm/.exec(description)?.[1];
  if (id === "unsupported_overhang") return /^(\d+)%/.exec(description)?.[1];
  return undefined;
}

export function IntentPanel(): React.JSX.Element {
  const { t } = useTranslation();
  const analysis = useAppStore((s) => s.analysis);
  const intentText = useAppStore((s) => s.intentText);
  const setIntentText = useAppStore((s) => s.setIntentText);
  const generateConfiguration = useAppStore((s) => s.generateConfiguration);
  const filaments = useAppStore((s) => s.filaments);
  const selectedFilamentId = useAppStore((s) => s.selectedFilamentId);
  const step = useAppStore((s) => s.step);
  const error = useAppStore((s) => s.error);

  if (!analysis) return <></>;

  const filament = filaments.find((f) => f.id === selectedFilamentId);
  const weightG = filament ? estimateWeightG(analysis.volumeMm3, filament.densityGCm3) : null;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-6">
      <div>
        <h2 className="text-lg font-semibold text-text-primary">{t("intent.title")}</h2>
        <p className="text-sm text-text-secondary">{t("intent.subtitle")}</p>
      </div>

      <textarea
        value={intentText}
        onChange={(e) => setIntentText(e.target.value)}
        placeholder={t("intent.placeholder")}
        rows={4}
        className="resize-none rounded-lg border border-border-subtle bg-surface-2 p-3 text-sm text-text-primary outline-none focus:border-accent"
      />

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PROMPT_KEYS.map((key) => {
          const prompt = t(key);
          return (
            <button
              key={key}
              onClick={() => setIntentText(intentText ? `${intentText}, ${prompt.toLowerCase()}` : prompt)}
              className="rounded-full border border-border-subtle bg-surface-2 px-3 py-1 text-xs text-text-secondary hover:border-accent hover:text-text-primary"
            >
              {prompt}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-text-muted">{t("intent.advancedHint")}</p>

      <Card className="p-4">
        <h3 className="mb-2 text-xs uppercase tracking-wide text-text-muted">{t("intent.analysisTitle")}</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-text-secondary">{t("intent.dimensions")}</dt>
          <dd className="text-text-primary">
            {analysis.dimensionsMm.x.toFixed(1)} × {analysis.dimensionsMm.y.toFixed(1)} × {analysis.dimensionsMm.z.toFixed(1)} mm
          </dd>
          <dt className="text-text-secondary">{t("intent.volume")}</dt>
          <dd className="text-text-primary">{(analysis.volumeMm3 / 1000).toFixed(1)} cm³</dd>
          <dt className="text-text-secondary">{t("intent.weightEstimate")}</dt>
          <dd className="text-text-primary">{weightG !== null ? `${weightG.toFixed(1)} g` : "—"}</dd>
          <dt className="text-text-secondary">{t("intent.triangles")}</dt>
          <dd className="text-text-primary">{analysis.triangleCount.toLocaleString()}</dd>
          <dt className="text-text-secondary">{t("intent.supports")}</dt>
          <dd className="text-text-primary">
            {analysis.supportsRecommended ? t("intent.supportsRecommended") : t("intent.supportsNotNeeded")}
          </dd>
        </dl>

        {analysis.riskFlags.length > 0 && (
          <div className="mt-3 flex flex-col gap-1.5 border-t border-border-subtle pt-3">
            {analysis.riskFlags.map((flag) => {
              const value = extractRiskValue(flag.id, flag.description);
              return (
                <div key={flag.id} className="flex items-start gap-2 text-xs">
                  <span
                    className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      flag.severity === "high" ? "bg-confidence-low" : "bg-confidence-medium"
                    }`}
                  />
                  <span className="text-text-secondary">{t(`risk.${flag.id}`, value !== undefined ? { value } : undefined)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {error && <p className="text-sm text-confidence-low">{error}</p>}

      <Button onClick={() => void generateConfiguration()} disabled={step === "generating"} className="mt-auto">
        {step === "generating" ? t("intent.generating") : t("intent.generate")}
      </Button>
    </div>
  );
}
