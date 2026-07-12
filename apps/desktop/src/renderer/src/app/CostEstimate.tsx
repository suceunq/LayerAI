import { useAppStore } from "../state/useAppStore.js";
import { Card } from "../components/ui/Card.js";
import { useTranslation } from "../i18n/useTranslation.js";

export function CostEstimate(): React.JSX.Element {
  const comparison = useAppStore((s) => s.comparison);
  const quantity = useAppStore((s) => s.quantity);
  const costSettings = useAppStore((s) => s.costSettings);
  const toggleSettingsDialog = useAppStore((s) => s.toggleSettingsDialog);
  const { t } = useTranslation();

  if (!comparison) return <></>;

  const { currency, filamentPricePerKg, printerPowerW, electricityPricePerKwh } = costSettings;

  if (filamentPricePerKg == null) {
    return (
      <Card className="p-4">
        <h3 className="mb-1 text-xs uppercase tracking-wide text-text-muted">{t("cost.title")}</h3>
        <p className="mb-3 text-xs text-text-secondary">{t("cost.emptyHint")}</p>
        <button onClick={toggleSettingsDialog} className="text-xs text-accent hover:text-accent-glow">
          {t("cost.openSettings")} →
        </button>
      </Card>
    );
  }

  const materialCost = (comparison.aiFilamentG * quantity) / 1000 * filamentPricePerKg;
  const electricityCost =
    printerPowerW != null && electricityPricePerKwh != null
      ? ((comparison.aiEstimatedTimeMin * quantity) / 60) * (printerPowerW / 1000) * electricityPricePerKwh
      : 0;
  const total = materialCost + electricityCost;
  const perUnit = total / Math.max(1, quantity);

  const fmt = (value: number): string => `${value.toFixed(2)} ${currency}`;

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-xs uppercase tracking-wide text-text-muted">{t("cost.title")}</h3>
      <div className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary">{t("cost.material")}</span>
          <span className="text-text-primary">{fmt(materialCost)}</span>
        </div>
        {printerPowerW != null && electricityPricePerKwh != null && (
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">{t("cost.electricity")}</span>
            <span className="text-text-primary">{fmt(electricityCost)}</span>
          </div>
        )}
        <div className="mt-1 flex items-center justify-between border-t border-border-subtle pt-1.5 font-semibold">
          <span className="text-text-primary">{t("cost.total")}</span>
          <span className="text-accent">{fmt(total)}</span>
        </div>
        {quantity > 1 && <p className="text-right text-[11px] text-text-muted">{t("cost.perUnit", { cost: fmt(perUnit) })}</p>}
      </div>
    </Card>
  );
}
