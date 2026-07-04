import { useMemo } from "react";
import { estimateConfigMetrics } from "@layerai/config-generator";
import { useAppStore } from "../state/useAppStore.js";
import { useTranslation } from "../i18n/useTranslation.js";
import { Card } from "../components/ui/Card.js";

const SUPPORT_STYLES = [
  { id: "grid", icon: "▦", labelKey: "supports.styleGrid" },
  { id: "organic", icon: "🌿", labelKey: "supports.styleOrganic" },
  { id: "snug", icon: "▥", labelKey: "supports.styleSnug" },
] as const;

export function SupportsControl(): React.JSX.Element | null {
  const config = useAppStore((s) => s.config);
  const explanations = useAppStore((s) => s.explanations);
  const analysis = useAppStore((s) => s.analysis);
  const filaments = useAppStore((s) => s.filaments);
  const selectedFilamentId = useAppStore((s) => s.selectedFilamentId);
  const updateConfigValue = useAppStore((s) => s.updateConfigValue);
  const { t } = useTranslation();

  const supportEntry = config?.support_material;
  const filament = filaments.find((f) => f.id === selectedFilamentId);

  const impact = useMemo(() => {
    if (!config || !analysis || !filament) return null;
    const without = estimateConfigMetrics({ ...config, support_material: { ...config.support_material!, value: false } }, analysis, filament);
    const with_ = estimateConfigMetrics({ ...config, support_material: { ...config.support_material!, value: true } }, analysis, filament);
    return { extraWeightG: with_.filamentG - without.filamentG, extraTimeMin: with_.timeMin - without.timeMin };
  }, [config, analysis, filament]);

  if (!supportEntry) return null;

  const enabled = supportEntry.value === true;
  const style = typeof config?.support_material_style?.value === "string" ? config.support_material_style.value : "grid";
  const whyText = explanations?.parameters.find((p) => p.parameterKey === "support_material")?.whyText;

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">{t("supports.title")}</span>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => updateConfigValue("support_material", e.target.checked)}
            className="peer sr-only"
          />
          <div className="h-5 w-9 rounded-full bg-surface-3 transition-colors peer-checked:bg-prusa-orange" />
          <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-text-primary transition-transform peer-checked:translate-x-4" />
        </label>
      </div>

      {whyText && <p className="mt-1 text-xs text-text-secondary">{whyText}</p>}

      {impact && (impact.extraWeightG > 0.1 || impact.extraTimeMin > 0.1) && (
        <p className="mt-1 text-xs text-text-muted">
          {t("supports.extraWeight", { weight: impact.extraWeightG.toFixed(1) })} · {t("supports.extraTime", { time: impact.extraTimeMin.toFixed(0) })}
        </p>
      )}

      {enabled && (
        <div className="mt-3 flex gap-2">
          {SUPPORT_STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => updateConfigValue("support_material_style", s.id)}
              title={t(s.labelKey)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs ${
                style === s.id
                  ? "border-prusa-orange bg-prusa-orange/10 text-prusa-orange"
                  : "border-border-subtle text-text-secondary hover:border-prusa-orange hover:text-text-primary"
              }`}
            >
              <span className="text-base leading-none">{s.icon}</span>
              {t(s.labelKey)}
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
