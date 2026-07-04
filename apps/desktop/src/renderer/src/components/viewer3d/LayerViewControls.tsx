import { useAppStore } from "../../state/useAppStore.js";
import { useTranslation } from "../../i18n/useTranslation.js";

export function LayerViewControls(): React.JSX.Element {
  const { t } = useTranslation();
  const analysis = useAppStore((s) => s.analysis);
  const layerViewEnabled = useAppStore((s) => s.layerViewEnabled);
  const layerViewHeightMm = useAppStore((s) => s.layerViewHeightMm);
  const toggleLayerView = useAppStore((s) => s.toggleLayerView);
  const setLayerViewHeight = useAppStore((s) => s.setLayerViewHeight);

  if (!analysis) return <></>;
  const maxHeight = analysis.dimensionsMm.z;

  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-lg border border-border-subtle bg-surface-1/90 px-3 py-2 backdrop-blur">
      <button
        onClick={toggleLayerView}
        className={`rounded-full px-3 py-1 text-xs ${
          layerViewEnabled ? "bg-prusa-orange text-surface-0" : "border border-border-subtle text-text-secondary hover:text-text-primary"
        }`}
      >
        {t("layerView.toggle")}
      </button>
      {layerViewEnabled && (
        <>
          <input
            type="range"
            min={0}
            max={maxHeight}
            step={maxHeight / 100}
            value={layerViewHeightMm}
            onChange={(e) => setLayerViewHeight(Number(e.target.value))}
            className="w-40 accent-prusa-orange"
          />
          <span className="text-xs tabular-nums text-text-muted">
            {layerViewHeightMm.toFixed(1)} / {maxHeight.toFixed(1)} mm
          </span>
        </>
      )}
    </div>
  );
}
