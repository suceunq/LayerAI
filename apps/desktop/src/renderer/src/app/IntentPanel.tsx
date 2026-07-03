import { estimateWeightG } from "@layerai/mesh-analysis";
import { useAppStore } from "../state/useAppStore.js";
import { Button } from "../components/ui/Button.js";
import { Card } from "../components/ui/Card.js";

const EXAMPLE_PROMPTS = [
  "Je veux une pièce très solide",
  "Le plus rapide possible",
  "Finition parfaite",
  "C'est une figurine",
  "Pièce mécanique",
  "Usage extérieur",
  "Limiter les supports",
];

export function IntentPanel(): React.JSX.Element {
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
        <h2 className="text-lg font-semibold text-text-primary">Décrivez votre objectif</h2>
        <p className="text-sm text-text-secondary">Exprimez ce que vous attendez de cette impression, en une phrase.</p>
      </div>

      <textarea
        value={intentText}
        onChange={(e) => setIntentText(e.target.value)}
        placeholder="Ex : Je veux une pièce très solide pour un usage extérieur…"
        rows={4}
        className="resize-none rounded-lg border border-border-subtle bg-surface-2 p-3 text-sm text-text-primary outline-none focus:border-prusa-orange"
      />

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => setIntentText(intentText ? `${intentText}, ${prompt.toLowerCase()}` : prompt)}
            className="rounded-full border border-border-subtle bg-surface-2 px-3 py-1 text-xs text-text-secondary hover:border-prusa-orange hover:text-text-primary"
          >
            {prompt}
          </button>
        ))}
      </div>

      <Card className="p-4">
        <h3 className="mb-2 text-xs uppercase tracking-wide text-text-muted">Analyse du modèle</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-text-secondary">Dimensions</dt>
          <dd className="text-text-primary">
            {analysis.dimensionsMm.x.toFixed(1)} × {analysis.dimensionsMm.y.toFixed(1)} × {analysis.dimensionsMm.z.toFixed(1)} mm
          </dd>
          <dt className="text-text-secondary">Volume</dt>
          <dd className="text-text-primary">{(analysis.volumeMm3 / 1000).toFixed(1)} cm³</dd>
          <dt className="text-text-secondary">Poids estimé</dt>
          <dd className="text-text-primary">{weightG !== null ? `${weightG.toFixed(1)} g` : "—"}</dd>
          <dt className="text-text-secondary">Triangles</dt>
          <dd className="text-text-primary">{analysis.triangleCount.toLocaleString("fr-FR")}</dd>
          <dt className="text-text-secondary">Supports</dt>
          <dd className="text-text-primary">{analysis.supportsRecommended ? "Recommandés" : "Non nécessaires"}</dd>
        </dl>

        {analysis.riskFlags.length > 0 && (
          <div className="mt-3 flex flex-col gap-1.5 border-t border-border-subtle pt-3">
            {analysis.riskFlags.map((flag) => (
              <div key={flag.id} className="flex items-start gap-2 text-xs">
                <span
                  className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                    flag.severity === "high" ? "bg-confidence-low" : "bg-confidence-medium"
                  }`}
                />
                <span className="text-text-secondary">{flag.description}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {error && <p className="text-sm text-confidence-low">{error}</p>}

      <Button onClick={() => void generateConfiguration()} disabled={step === "generating"} className="mt-auto">
        {step === "generating" ? "Génération…" : "Générer la configuration IA →"}
      </Button>
    </div>
  );
}
