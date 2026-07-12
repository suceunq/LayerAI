import type { RiskFlag } from "@layerai/shared-types";
import { useAppStore } from "../state/useAppStore.js";
import { Card } from "../components/ui/Card.js";
import { useTranslation } from "../i18n/useTranslation.js";

function extractRiskValue(flag: RiskFlag): string | undefined {
  if (flag.id === "fragile_thin_wall") return /jusqu'à ([\d.]+) mm/.exec(flag.description)?.[1];
  if (flag.id === "unsupported_overhang") return /^(\d+)%/.exec(flag.description)?.[1];
  return undefined;
}

const severityRank = { low: 0, medium: 1, high: 2 } as const;

export function RiskOverview(): React.JSX.Element {
  const { t } = useTranslation();
  const analysis = useAppStore((s) => s.analysis);
  const interfaceMode = useAppStore((s) => s.interfaceMode);

  if (!analysis) return <></>;

  const risks = [...analysis.riskFlags].sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
  const confidence = Math.round(analysis.analysisConfidence * 100);

  if (risks.length === 0) {
    return (
      <Card className="border-confidence-high/40 bg-confidence-high/5 p-3">
        <p className="text-sm font-medium text-confidence-high">{t("risk.none")}</p>
        <p className="mt-1 text-xs text-text-muted">{t("risk.analysisConfidence", { value: confidence })}</p>
      </Card>
    );
  }

  return (
    <section aria-labelledby="risk-overview-title" className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h3 id="risk-overview-title" className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {t("risk.title")}
        </h3>
        <span className="text-[11px] text-text-muted">{t("risk.analysisConfidence", { value: confidence })}</span>
      </div>
      {risks.map((flag, index) => {
        const value = extractRiskValue(flag);
        const params = value === undefined ? undefined : { value };
        const high = flag.severity === "high";
        const content = (
          <div className="mt-2 grid gap-2 text-xs">
            <p><span className="font-medium text-text-primary">{t("risk.cause")} </span><span className="text-text-secondary">{t(`risk.${flag.id}`, params)}</span></p>
            <p><span className="font-medium text-text-primary">{t("risk.consequence")} </span><span className="text-text-secondary">{t(`risk.${flag.id}.consequence`)}</span></p>
            <p className="rounded-md bg-accent/10 px-2.5 py-2 text-accent"><span className="font-semibold">{t("risk.recommendation")} </span>{t(`risk.${flag.id}.action`)}</p>
            {flag.id === "unsupported_overhang" && <p className="text-[11px] text-text-muted">{t("risk.viewerHint")}</p>}
          </div>
        );
        return (
          <Card key={flag.id} className={`p-3 ${high ? "border-confidence-low/60" : "border-confidence-medium/60"}`}>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${high ? "bg-confidence-low" : "bg-confidence-medium"}`} />
              <span className="flex-1 text-sm font-medium text-text-primary">{t(`risk.${flag.id}.title`)}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${high ? "bg-confidence-low/15 text-confidence-low" : "bg-confidence-medium/15 text-confidence-medium"}`}>
                {t(`risk.severity.${flag.severity}`)}
              </span>
            </div>
            {interfaceMode === "simple" && index > 0 ? (
              <details className="mt-2 text-xs text-text-muted"><summary className="cursor-pointer hover:text-accent">{t("risk.showDetails")}</summary>{content}</details>
            ) : content}
          </Card>
        );
      })}
    </section>
  );
}
