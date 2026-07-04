import { useEffect, useState } from "react";
import { useAppStore } from "../state/useAppStore.js";

export function HelpAboutDialog(): React.JSX.Element | null {
  const helpDialogOpen = useAppStore((s) => s.helpDialogOpen);
  const helpDialogTab = useAppStore((s) => s.helpDialogTab);
  const closeHelpDialog = useAppStore((s) => s.closeHelpDialog);
  const openHelpDialog = useAppStore((s) => s.openHelpDialog);
  const replayOnboarding = useAppStore((s) => s.replayOnboarding);
  const [version, setVersion] = useState("");

  useEffect(() => {
    if (helpDialogOpen) void window.api.getAppVersion().then(setVersion);
  }, [helpDialogOpen]);

  if (!helpDialogOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60" onClick={closeHelpDialog}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80vh] w-[520px] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-0 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
          <h2 className="text-base font-semibold text-text-primary">Aide &amp; À propos</h2>
          <button onClick={closeHelpDialog} className="text-text-muted hover:text-text-primary">
            ✕
          </button>
        </div>

        <div className="flex border-b border-border-subtle px-5">
          <button
            onClick={() => openHelpDialog("aide")}
            className={`border-b-2 px-3 py-2 text-sm ${helpDialogTab === "aide" ? "border-prusa-orange text-prusa-orange" : "border-transparent text-text-muted hover:text-text-primary"}`}
          >
            Aide
          </button>
          <button
            onClick={() => openHelpDialog("apropos")}
            className={`border-b-2 px-3 py-2 text-sm ${helpDialogTab === "apropos" ? "border-prusa-orange text-prusa-orange" : "border-transparent text-text-muted hover:text-text-primary"}`}
          >
            À propos
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {helpDialogTab === "aide" ? (
            <div className="flex flex-col gap-4 text-sm text-text-secondary">
              <section>
                <h3 className="mb-1 font-medium text-text-primary">1. Importer</h3>
                <p>Glissez-déposez un fichier STL, OBJ ou 3MF, ou parcourez vos fichiers. Choisissez ensuite votre imprimante et votre filament.</p>
              </section>
              <section>
                <h3 className="mb-1 font-medium text-text-primary">2. Décrire l'objectif</h3>
                <p>Décrivez ce que vous voulez en langage naturel (« pièce solide », « le plus rapide possible »…). L'IA locale traduit cela en réglages.</p>
              </section>
              <section>
                <h3 className="mb-1 font-medium text-text-primary">3. Vérifier la taille</h3>
                <p>
                  Si le modèle dépasse le volume d'impression, un avertissement s'affiche automatiquement. L'icône ⛶ dans la barre latérale gauche
                  permet de redimensionner à tout moment.
                </p>
              </section>
              <section>
                <h3 className="mb-1 font-medium text-text-primary">4. Réviser et exporter</h3>
                <p>
                  Chaque paramètre est expliqué avec un score de confiance. Ouvrez directement le projet dans PrusaSlicer ou Bambu Studio, ou
                  exportez un .3mf, un rapport PDF ou un profil .ini.
                </p>
              </section>
              <button onClick={replayOnboarding} className="self-start text-xs text-prusa-orange hover:text-prusa-orange-glow">
                ▸ Revoir la visite guidée
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4 text-sm text-text-secondary">
              <div>
                <p className="text-base font-semibold text-text-primary">
                  Layer<span className="text-prusa-orange">AI</span>
                </p>
                <p className="text-xs text-text-muted">Version {version || "…"}</p>
              </div>
              <p>
                LayerAI est un assistant de préparation d'impression 3D. Il analyse votre modèle et génère automatiquement des réglages
                d'impression pour PrusaSlicer et Bambu Studio, à partir d'une description en langage naturel — entièrement en local, sans envoi
                de données à un service externe.
              </p>
              <p>
                Les bases de profils imprimantes/filaments s'appuient sur les données publiques de PrusaSlicer et Bambu Studio (AGPLv3). Voir le
                dossier <span className="font-mono text-text-primary">docs/licensing</span> pour le détail des attributions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
