# LayerAI

LayerAI est un assistant de préparation d'impression 3D pour Windows. Il importe des modèles STL,
OBJ et 3MF, analyse leur géométrie, propose une orientation et des réglages adaptés, puis exporte
un projet prêt à ouvrir dans un slicer compatible.

## Prérequis

- Node.js 20 ou supérieur (Node.js 22 recommandé)
- pnpm 11.9.0
- Windows pour produire l'installateur Electron

## Démarrage

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

Commandes de validation :

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

La création d'un installateur et de son manifeste de mise à jour se fait avec `pnpm package:win`.
Elle n'est pas nécessaire pour le développement courant.

## Organisation

- `apps/desktop` : application Electron principale et interface React.
- `apps/update-manager` : publication et vérification des releases GitHub.
- `apps/website` : site vitrine Vite/React.
- `packages/mesh-analysis` : chargement, analyse et orientation des maillages.
- `packages/intent-engine` : interprétation déterministe des objectifs utilisateur.
- `packages/config-generator` : génération des paramètres d'impression.
- `packages/threemf-writer` : création et validation des projets 3MF.
- `packages/learning-store` : historique local des résultats d'impression.
- `tooling/profile-ingest` : import des profils de slicers.

Les contrats partagés vivent dans `packages/shared-types`. Les échanges entre renderer et processus
principal passent exclusivement par les API exposées par les preloads Electron.

## Données, IA et confidentialité

Les projets, préférences et résultats d'impression sont stockés dans le dossier `userData`
d'Electron. Les clés API ne doivent jamais être ajoutées au dépôt. Le diagnostic photo et
l'interprétation cloud sont facultatifs ; sans configuration valide, l'application conserve son
fonctionnement local. LM Studio est limité à la machine locale et les services distants doivent
utiliser HTTPS.

## Profils d'impression

La commande `pnpm ingest:profiles` régénère la base à partir des sources de profils disponibles.
Les licences et notices des profils tiers sont conservées dans `docs/licensing` et doivent rester
associées à toute redistribution.

## Publication

Le gestionnaire situé dans `apps/update-manager` publie les artefacts et le manifeste sur GitHub.
La procédure détaillée du mécanisme de mise à jour est dans `docs/UPDATE_SYSTEM.md`. Une publication
doit toujours être précédée des quatre commandes de validation ci-dessus.
