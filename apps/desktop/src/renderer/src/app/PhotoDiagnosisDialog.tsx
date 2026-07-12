import { useRef, useState } from "react";
import { useAppStore } from "../state/useAppStore.js";
import { Button } from "../components/ui/Button.js";
import { ConfidenceBadge } from "../components/ui/ConfidenceBadge.js";
import { useTranslation } from "../i18n/useTranslation.js";

const MAX_DIMENSION = 1024;

/** Downscales large photos before they're base64-encoded and sent to a cloud vision API - keeps
 * request payloads and per-call cost reasonable without materially hurting defect detection. */
async function downscaleImage(file: File): Promise<{ base64: string; mimeType: string; previewUrl: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Read error"));
    reader.readAsDataURL(file);
  });

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Image decode error"));
    img.src = dataUrl;
  });

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(img, 0, 0, width, height);

  const mimeType = "image/jpeg";
  const outputUrl = canvas.toDataURL(mimeType, 0.85);
  const base64 = outputUrl.split(",")[1] ?? "";
  return { base64, mimeType, previewUrl: outputUrl };
}

export function PhotoDiagnosisDialog(): React.JSX.Element | null {
  const open = useAppStore((s) => s.photoDiagnosisDialogOpen);
  const toggleOpen = useAppStore((s) => s.togglePhotoDiagnosisDialog);
  const loading = useAppStore((s) => s.photoDiagnosisLoading);
  const result = useAppStore((s) => s.photoDiagnosisResult);
  const error = useAppStore((s) => s.photoDiagnosisError);
  const appliedCount = useAppStore((s) => s.photoDiagnosisAppliedCount);
  const runPhotoDiagnosis = useAppStore((s) => s.runPhotoDiagnosis);
  const applyDiagnosisCorrections = useAppStore((s) => s.applyDiagnosisCorrections);
  const resetPhotoDiagnosis = useAppStore((s) => s.resetPhotoDiagnosis);
  const config = useAppStore((s) => s.config);
  const { t } = useTranslation();

  const [preview, setPreview] = useState<{ base64: string; mimeType: string; previewUrl: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleFile = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    resetPhotoDiagnosis();
    const decoded = await downscaleImage(file);
    setPreview(decoded);
  };

  const handleNewPhoto = (): void => {
    setPreview(null);
    resetPhotoDiagnosis();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const defectColor = result && result.defectId !== "none" ? "bg-confidence-low" : "bg-confidence-high";

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60" onClick={toggleOpen}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-[480px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-0 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
          <h2 className="text-base font-semibold text-text-primary">{t("diagnosis.title")}</h2>
          <button onClick={toggleOpen} className="text-text-muted hover:text-text-primary">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="mb-4 text-xs text-text-muted">{t("diagnosis.subtitle")}</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />

          {!preview ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-subtle py-10 text-text-muted hover:border-accent hover:text-accent"
            >
              <span className="text-2xl">📷</span>
              <span className="text-sm">{t("diagnosis.choosePhoto")}</span>
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface-2">
                <img src={preview.previewUrl} alt="" className="max-h-64 w-full object-contain" />
              </div>

              <p className="rounded-lg bg-surface-1 px-3 py-2 text-xs text-text-muted">💡 {t("diagnosis.hint")}</p>

              {!result && !loading && (
                <div className="flex gap-2">
                  <Button onClick={() => void runPhotoDiagnosis(preview.base64, preview.mimeType)} className="flex-1">
                    {t("diagnosis.analyze")}
                  </Button>
                  <Button variant="secondary" onClick={handleNewPhoto}>
                    {t("diagnosis.newPhoto")}
                  </Button>
                </div>
              )}

              {loading && <p className="text-center text-sm text-text-secondary">{t("diagnosis.analyzing")}</p>}

              {error && (
                <div className="flex flex-col gap-2 rounded-lg border border-confidence-low/40 bg-confidence-low/10 p-3 text-xs text-confidence-low">
                  <span>{error}</span>
                  <Button variant="secondary" onClick={handleNewPhoto} className="self-start">
                    {t("diagnosis.newPhoto")}
                  </Button>
                </div>
              )}

              {result && (
                <div className="flex flex-col gap-3 border-t border-border-subtle pt-3">
                  <p className="text-[10px] uppercase tracking-wide text-text-muted">{t("diagnosis.resultTitle")}</p>
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${defectColor}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-text-primary">{result.defectLabel}</span>
                        <ConfidenceBadge percent={result.confidencePercent} />
                      </div>
                      <p className="mt-1 text-xs text-text-secondary">{result.explanation}</p>
                    </div>
                  </div>

                  {result.corrections.length > 0 && (
                    <div className="rounded-lg border border-border-subtle bg-surface-1 p-3">
                      <p className="mb-2 text-[10px] uppercase tracking-wide text-text-muted">{t("diagnosis.correctionsTitle")}</p>
                      <ul className="flex flex-col gap-1 font-mono text-xs text-text-primary">
                        {result.corrections.map((c, i) => (
                          <li key={i}>
                            {c.label} → {c.deltaValue > 0 ? "+" : ""}
                            {c.deltaValue}
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={applyDiagnosisCorrections}
                        disabled={!config || appliedCount > 0}
                        className="mt-3 w-full"
                      >
                        {t("diagnosis.useCorrections")}
                      </Button>
                      {!config && <p className="mt-2 text-[11px] text-text-muted">{t("diagnosis.noConfigHint")}</p>}
                      {appliedCount > 0 && <p className="mt-2 text-[11px] text-confidence-high">{t("diagnosis.correctionsApplied", { count: appliedCount })}</p>}
                    </div>
                  )}

                  {result.additionalAdvice && (
                    <p className="rounded-lg bg-surface-1 px-3 py-2 text-xs text-text-secondary">
                      <span className="text-text-muted">{t("diagnosis.additionalAdvice")}</span> {result.additionalAdvice}
                    </p>
                  )}

                  <Button variant="secondary" onClick={handleNewPhoto} className="self-start">
                    {t("diagnosis.newPhoto")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
