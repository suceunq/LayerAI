import { useMemo } from "react";
import { useAppStore, computePlateArrangement } from "../state/useAppStore.js";
import { useTranslation } from "../i18n/useTranslation.js";
import { Card } from "../components/ui/Card.js";

export function PlateQuantityControl(): React.JSX.Element | null {
  const quantity = useAppStore((s) => s.quantity);
  const setQuantity = useAppStore((s) => s.setQuantity);
  const analysis = useAppStore((s) => s.analysis);
  const printers = useAppStore((s) => s.printers);
  const selectedPrinterId = useAppStore((s) => s.selectedPrinterId);
  const multiPlateEnabled = useAppStore((s) => s.multiPlateEnabled);
  const setMultiPlateEnabled = useAppStore((s) => s.setMultiPlateEnabled);
  const currentPlateIndex = useAppStore((s) => s.currentPlateIndex);
  const setCurrentPlateIndex = useAppStore((s) => s.setCurrentPlateIndex);
  const { t } = useTranslation();

  const printer = printers.find((p) => p.id === selectedPrinterId);

  const arrangement = useMemo(
    () => computePlateArrangement(analysis, printer, quantity, multiPlateEnabled ? currentPlateIndex : 0),
    [analysis, printer, quantity, multiPlateEnabled, currentPlateIndex]
  );

  if (!analysis) return null;

  const hasOverflow = !!arrangement && arrangement.totalPlates > 1;

  return (
    <Card className="p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-primary">{t("plate.title")}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setQuantity(quantity - 1)}
            disabled={quantity <= 1}
            className="flex h-6 w-6 items-center justify-center rounded border border-border-subtle text-text-secondary hover:border-accent hover:text-accent disabled:opacity-40"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-12 rounded border border-border-subtle bg-surface-2 px-1 py-0.5 text-center text-sm text-text-primary outline-none focus:border-accent"
          />
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="flex h-6 w-6 items-center justify-center rounded border border-border-subtle text-text-secondary hover:border-accent hover:text-accent"
          >
            +
          </button>
        </div>
      </div>

      {quantity > 1 && arrangement && (
        <>
          {hasOverflow && (
            <label className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
              <input
                type="checkbox"
                checked={multiPlateEnabled}
                onChange={(e) => setMultiPlateEnabled(e.target.checked)}
                className="accent-accent"
              />
              {t("plate.multiPlateToggle")}
            </label>
          )}

          {!hasOverflow && <p className="mt-1 text-xs text-text-muted">{t("plate.fits", { count: quantity })}</p>}

          {hasOverflow && !multiPlateEnabled && (
            <p className="mt-1 text-xs text-confidence-low">{t("plate.overflow", { maxFit: arrangement.maxFitPerPlate, count: quantity })}</p>
          )}

          {hasOverflow && multiPlateEnabled && (
            <div className="mt-2 flex flex-col gap-1">
              <p className="text-xs text-text-muted">{t("plate.multiPlateHint")}</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPlateIndex(currentPlateIndex - 1)}
                  disabled={currentPlateIndex <= 0}
                  className="flex h-6 w-6 items-center justify-center rounded border border-border-subtle text-text-secondary hover:border-accent hover:text-accent disabled:opacity-40"
                >
                  ‹
                </button>
                <span className="text-xs font-medium text-text-primary">
                  {t("plate.navigator", { current: currentPlateIndex + 1, total: arrangement.totalPlates })}
                </span>
                <button
                  onClick={() => setCurrentPlateIndex(currentPlateIndex + 1)}
                  disabled={currentPlateIndex >= arrangement.totalPlates - 1}
                  className="flex h-6 w-6 items-center justify-center rounded border border-border-subtle text-text-secondary hover:border-accent hover:text-accent disabled:opacity-40"
                >
                  ›
                </button>
                <span className="text-xs text-text-muted">{t("plate.onThisPlate", { count: arrangement.platePieceCount })}</span>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
