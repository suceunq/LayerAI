import { useState, useEffect } from "react";
import { useAppStore } from "../state/useAppStore.js";
import { Button } from "../components/ui/Button.js";
import { computeSizeFit } from "../lib/size-fit.js";

const PRESET_PERCENTS = [95, 90, 85, 75, 50];

export function ResizePanel(): React.JSX.Element | null {
  const resizePanelOpen = useAppStore((s) => s.resizePanelOpen);
  const toggleResizePanel = useAppStore((s) => s.toggleResizePanel);
  const analysis = useAppStore((s) => s.analysis);
  const printers = useAppStore((s) => s.printers);
  const selectedPrinterId = useAppStore((s) => s.selectedPrinterId);
  const rescaleModel = useAppStore((s) => s.rescaleModel);
  const isRescaling = useAppStore((s) => s.isRescaling);

  const printer = printers.find((p) => p.id === selectedPrinterId);
  const fit = analysis && printer ? computeSizeFit(analysis, printer) : null;

  const [percent, setPercent] = useState(100);

  useEffect(() => {
    if (resizePanelOpen && fit && !fit.fits) setPercent(fit.recommendedScalePercent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resizePanelOpen]);

  if (!resizePanelOpen || !analysis || !printer || !fit) return null;

  const previewX = (analysis.dimensionsMm.x * percent) / 100;
  const previewY = (analysis.dimensionsMm.y * percent) / 100;
  const previewZ = (analysis.dimensionsMm.z * percent) / 100;

  const chips = fit.fits
    ? PRESET_PERCENTS
    : [fit.recommendedScalePercent, ...PRESET_PERCENTS.filter((p) => p < fit.recommendedScalePercent)];

  const exceededAxes = [fit.exceedsX && "X", fit.exceedsY && "Y", fit.exceedsZ && "hauteur"].filter(Boolean).join(", ");

  return (
    <div className="absolute inset-0 z-20 flex justify-start bg-black/50" onClick={toggleResizePanel}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-[400px] flex-col gap-5 overflow-y-auto border-r border-border-subtle bg-surface-0 p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Redimensionner le modèle</h2>
          <button onClick={toggleResizePanel} className="text-text-muted hover:text-text-primary">
            ✕
          </button>
        </div>

        {!fit.fits && (
          <div className="rounded-lg border border-confidence-low/40 bg-confidence-low/10 p-3 text-sm text-confidence-low">
            ⚠ Le modèle ne tient pas sur le plateau de {printer.name} ({exceededAxes} dépassé{exceededAxes.includes(",") ? "s" : ""}).
          </div>
        )}

        <div className="rounded-lg border border-border-subtle bg-surface-1 p-3 text-sm">
          <p className="text-text-secondary">
            Dimensions actuelles :{" "}
            <span className="font-mono text-text-primary">
              {analysis.dimensionsMm.x.toFixed(1)} × {analysis.dimensionsMm.y.toFixed(1)} × {analysis.dimensionsMm.z.toFixed(1)} mm
            </span>
          </p>
          <p className="mt-1 text-text-secondary">
            Volume d'impression {printer.name} :{" "}
            <span className="font-mono text-text-primary">
              {fit.bedWidthMm.toFixed(0)} × {fit.bedDepthMm.toFixed(0)} × {fit.maxHeightMm.toFixed(0)} mm
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-text-muted">Réduction suggérée</span>
          <div className="flex flex-wrap gap-2">
            {chips.map((p) => (
              <button
                key={p}
                onClick={() => setPercent(p)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  percent === p
                    ? "border-prusa-orange bg-prusa-orange/10 text-prusa-orange"
                    : "border-border-subtle text-text-secondary hover:border-prusa-orange hover:text-text-primary"
                }`}
              >
                {p}%{!fit.fits && p === fit.recommendedScalePercent ? " (ajusté)" : ""}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-text-muted">Pourcentage personnalisé</span>
          <input
            type="number"
            min={1}
            max={500}
            value={percent}
            onChange={(e) => setPercent(Math.max(1, Math.min(500, Number(e.target.value) || 0)))}
            className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm text-text-primary"
          />
        </label>

        <div className="rounded-lg border border-border-subtle bg-surface-1 p-3 text-sm">
          <p className="text-text-secondary">
            Nouvelles dimensions :{" "}
            <span className="font-mono text-prusa-orange">
              {previewX.toFixed(1)} × {previewY.toFixed(1)} × {previewZ.toFixed(1)} mm
            </span>
          </p>
        </div>

        <Button onClick={() => void rescaleModel(percent)} disabled={isRescaling || percent === 100}>
          {isRescaling ? "Application…" : `Appliquer ${percent}%`}
        </Button>
      </div>
    </div>
  );
}
