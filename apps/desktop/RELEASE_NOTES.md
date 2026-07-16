# LayerAI 1.7.21 — Qualité et sécurité renforcées

## Sécurité
- Le gestionnaire de mises à jour fonctionne désormais dans le bac à sable Electron.
- Son preload est compilé explicitement en CommonJS pour rester compatible avec la sandbox.
- Les navigations intégrées et demandes de permissions sont bloquées.
- Seuls les liens externes HTTPS peuvent être transmis au navigateur du système.
- Des tests automatiques empêchent la régression de ces protections.

## Fiabilité
- Un véritable lint TypeScript/React remplace les anciennes commandes factices.
- Une CI GitHub vérifie automatiquement lint, typage, tests et compilation.
- Les moteurs d'intention et d'analyse de maillage disposent de nouveaux tests de non-régression.
- La suite compte maintenant 35 tests automatisés.
- TypeScript est harmonisé en version 5.9 dans tout le monorepo.

## Maintenance
- Ajout d'une documentation principale pour installer, développer, vérifier et publier LayerAI.
- Nettoyage d'un import inutilisé et d'une expression régulière STL.
- Les artefacts locaux de compilation et les archives du site ne peuvent plus être ajoutés accidentellement au dépôt.
- Audit des dépendances de production : aucune vulnérabilité connue.
