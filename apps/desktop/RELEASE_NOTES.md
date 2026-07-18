# LayerAI 1.7.26 — Mises à jour entièrement automatiques

## Améliorations

- Les mises à jour sont désormais recherchées, téléchargées et installées automatiquement en arrière-plan, sans aucune confirmation à donner.
- Une fenêtre affiche une seule fois les nouveautés après un redémarrage automatique pour installer une mise à jour.
- Filet de sécurité : la version précédente est téléchargée et vérifiée (SHA-512) avant toute installation, puis restaurée automatiquement si la nouvelle version ne démarre pas correctement dans les minutes qui suivent.
- Journalisation détaillée de chaque étape (recherche, téléchargement, installation, éventuel retour arrière) dans un fichier local avec rotation automatique.
- Une version dont l'installation a échoué n'est plus proposée à nouveau au prochain lancement.

## Configuration

- Le réglage existant « Rechercher les mises à jour au démarrage » reste disponible dans les Paramètres et continue de gouverner l'activation des vérifications automatiques.
