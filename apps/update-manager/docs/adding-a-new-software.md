# Ajouter un nouveau logiciel à Update Manager

Update Manager est générique : ajouter un nouveau logiciel à gérer est une opération de **configuration pure, sans aucune modification de code**. Ce document décrit la procédure, avec l'intégration réelle de TikTok Manager comme exemple travaillé.

## Prérequis côté logiciel géré

1. Le logiciel doit disposer d'un dépôt GitHub (public ou privé) où les releases seront publiées.
   - S'il n'en a pas encore, créez-en un (`gh repo create <owner>/<repo> --private --source=. --remote=origin --push`).
2. Pour que le logiciel se mette à jour lui-même (optionnel mais recommandé), il doit intégrer `electron-updater` côté client — voir la section [Intégration client](#intégration-cliente-electron-updater-optionnelle) plus bas.

## Étapes dans Update Manager

### 1. Ajouter (ou réutiliser) un compte GitHub

Onglet **Comptes GitHub** (en haut à droite) → **+ Ajouter un compte** :

- **Nom du compte** : un libellé de votre choix (ex. « Personnel (suceunq) »).
- **Propriétaire** : l'utilisateur ou l'organisation GitHub.
- **Jeton d'accès personnel (PAT)** : avec la portée `repo`. Chiffré au repos (DPAPI Windows via Electron `safeStorage`) — jamais stocké en clair.
- **Tester la connexion** avant d'enregistrer pour confirmer que le jeton peut bien publier.

Un même compte GitHub peut être réutilisé par plusieurs projets (comme LayerAI et TikTok Manager, publiés tous deux depuis le même compte `suceunq`).

### 2. Créer le projet

Écran d'accueil → **+ Nouveau projet** :

| Champ | Exemple (TikTok Manager) |
|---|---|
| Nom du logiciel | TikTok Manager |
| Description | Application de planification et publication de contenus TikTok |
| Répertoire de travail | `E:\developpement\tiktok-manager` |
| Compte GitHub | (le compte créé à l'étape 1) |
| Dépôt | `TikTokManager` |
| URL de téléchargement | optionnel |

En enregistrant, Update Manager crée automatiquement le dossier **« Updates à publier »** dans le répertoire de travail (nom configurable dans la section « Avancé » du formulaire — utile si le logiciel a déjà une convention de dossier différente, comme `update-a-publier` pour LayerAI).

### 3. Publier une version

Dans l'espace du projet, onglet **Publier** :

1. Construisez l'installateur du logiciel (ex. `npm run dist`).
2. Déposez les fichiers à publier dans le dossier « Updates à publier » du projet (ou utilisez **+ Ajouter des fichiers**).
3. Si un script de build génère un manifeste brut (`{version, title, changelog, files}`) dans ce dossier, réglez son nom exact dans « Avancé » → « Nom du manifeste brut auto-détecté » : le glisser-déposer de ce fichier remplit alors automatiquement version/titre/changelog/fichiers.
4. Renseignez version (SemVer), titre et notes de version.
5. Cliquez **Publier la version**.

Update Manager :
- crée la release GitHub (échoue proprement si le tag existe déjà) ;
- calcule et envoie l'empreinte SHA-256 de chaque fichier ;
- envoie les fichiers et un manifeste JSON généré (`update-manifest.json`) ;
- **vérifie la publication** : re-interroge GitHub pour confirmer que chaque fichier est bien présent avec la bonne taille, et re-télécharge le fichier principal pour recalculer son empreinte SHA-256 (case « Vérification complète » pour le faire sur tous les fichiers) ;
- annule (supprime) la release en cas d'échec à n'importe quelle étape, pour ne jamais laisser une publication à moitié faite.

L'historique (onglet **Historique**) garde une trace de chaque publication, avec un badge « ✓ Vérifié » quand la vérification post-publication a réussi.

### Publication en ligne de commande

Toutes les actions ci-dessus sont aussi disponibles sans interface, une fois le projet configuré dans l'UI :

```bash
electron out/main/index.js -- --project "TikTok Manager" --version 1.0.1 --title "Correctifs" \
  --changelog "Notes de version" --files "chemin\vers\Setup.exe,chemin\vers\Setup.exe.blockmap,chemin\vers\latest.yml"
```

`--project` accepte le nom ou l'identifiant du projet. Une échappatoire `--owner/--repo/--token` (sans passer par un projet enregistré) reste disponible pour un usage ponctuel/CI.

## Intégration cliente `electron-updater` (optionnelle)

Pour que le logiciel géré se mette lui-même à jour depuis les releases publiées par Update Manager, ajoutez à son propre code (voir l'intégration réelle dans TikTok Manager : `electron/updater.ts`, `electron/ipc/updater.ipc.ts`, `shared/types.ts`/`shared/ipc-contract.ts`, `src/context/UpdateContext.tsx`, section « Mises à jour » de la page Paramètres) :

1. Dépendance `electron-updater`.
2. Dans `electron-builder.yml` : `publish: { provider: github, owner: <owner>, repo: <repo> }`.
3. Une classe wrapper autour de `autoUpdater` (electron-updater) exposant vérifier/télécharger/installer et un état diffusé au renderer via IPC.
4. Une section dans les paramètres de l'application pour vérifier/télécharger/installer, avec une bannière globale optionnelle quand une mise à jour est disponible.

Le mécanisme est totalement indépendant d'Update Manager côté exécution : `electron-updater` interroge directement les releases GitHub du dépôt configuré. Update Manager n'est que l'outil qui **publie** ces releases.

## Exemple réel : ajout de TikTok Manager

1. `E:\developpement\tiktok-manager` avait du code source mais aucun dépôt Git → `git init`, commit initial, `gh repo create suceunq/TikTokManager --private --source=. --remote=origin --push`.
2. Compte GitHub `suceunq` réutilisé (déjà configuré pour LayerAI).
3. Projet « TikTok Manager » créé (répertoire `E:\developpement\tiktok-manager`, dépôt `TikTokManager`, dossier de staging par défaut « Updates à publier »).
4. `electron-updater` intégré dans le code de TikTok Manager (voir fichiers listés ci-dessus).
5. `npm run dist` → publication de la v1.0.0 réelle via Update Manager, vérifiée automatiquement.
6. v1.0.1 publiée ensuite pour confirmer que l'application (configurée avec une version antérieure) détecte bien la mise à jour disponible.

Aucune ligne de code d'Update Manager n'a été modifiée pour cet ajout.
