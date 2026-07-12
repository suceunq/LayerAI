import { useAppStore } from "../../state/useAppStore.js";
import { useTranslation } from "../../i18n/useTranslation.js";

/** Height slider only - the on/off toggle lives in the app header alongside the other top-bar pills. */
export function LayerViewControls(): React.JSX.Element | null {
  const { t } = useTranslation();
  const analysis = useAppStore((s) => s.analysis);
  const layerViewEnabled = useAppStore((s) => s.layerViewEnabled);
  const layerViewHeightMm = useAppStore((s) => s.layerViewHeightMm);
  const setLayerViewHeight = useAppStore((s) => s.setLayerViewHeight);

  if (!analysis || !layerViewEnabled) return null;
  const maxHeight = analysis.dimensionsMm.z;

  return (
    <div className="flex items-center gap-3 border-b border-border-subtle bg-surface-1 px-5 py-2">
      <span className="text-xs text-text-muted">{t("layerView.heightLabel")}</span>
      <input
        type="range"
        min={0}
        max={maxHeight}
        step={maxHeight / 100}
        value={layerViewHeightMm}
        aria-label={t("layerView.heightLabel")}
        aria-valuetext={`${layerViewHeightMm.toFixed(1)} mm`}
        onChange={(e) => setLayerViewHeight(Number(e.target.value))}
        className="w-full max-w-md accent-accent"
      />
      <span className="text-xs tabular-nums text-text-muted">
        {layerViewHeightMm.toFixed(1)} / {maxHeight.toFixed(1)} mm
      </span>
    </div>
  );
}
