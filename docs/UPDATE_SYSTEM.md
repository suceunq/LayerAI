# Système d'auto-mise à jour LayerAI

Ce document décrit l'architecture du système de mise à jour de LayerAI : le client intégré à
l'application principale, et le gestionnaire de publication (Update Manager) utilisé par
l'administrateur pour publier de nouvelles versions.

## Vue d'ensemble

Deux composants distincts, découplés, qui communiquent uniquement via GitHub Releases :

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│  LayerAI Update Manager      │         │  LayerAI (apps/desktop)      │
│  (apps/update-manager)       │  push   │                              │
│  - Formulaire de publication │ ──────► │  autoUpdater.ts              │
│  - packages/update-publisher │ GitHub  │  (electron-updater)          │
│    (SHA-256, manifeste, PAT) │Releases │  UpdateDialog.tsx            │
│  - CLI (publish-cli.ts)      │ ◄────── │  Paramètres > Mises à jour   │
└─────────────────────────────┘  check   └──────────────────────────────┘
```

Le dépôt utilisé est `suceunq/LayerAI` sur GitHub (`apps/desktop/electron-builder.yml`, bloc
`publish`).

## Deux mécanismes d'intégrité, volontairement distincts

Il y a deux systèmes de vérification qui coexistent et qu'il ne faut pas confondre :

1. **electron-updater / electron-builder** génère automatiquement, à l'empaquetage
   (`electron-builder --publish always`), un fichier `latest.yml` contenant une empreinte SHA512
   de l'installeur NSIS. C'est CE fichier que le client (`autoUpdater.ts`) utilise réellement pour
   vérifier l'intégrité avant d'installer (`autoUpdater.downloadUpdate()` /
   `quitAndInstall()`). Cette vérification est intégrée à la librairie, sans code custom.
2. **`packages/update-publisher`** calcule en plus une empreinte **SHA-256** par fichier et génère
   un `layerai-update-manifest.json` (version, changelog, taille, SHA-256, date de publication),
   uploadé comme asset supplémentaire de la release. Ce manifeste répond à l'exigence explicite
   d'un "fichier de métadonnées" pour l'Update Manager (audit, CLI, historique local, et
   portabilité future vers un autre hébergeur que GitHub Releases où `electron-updater`
   n'offrirait pas de vérification native). Le client de mise à jour ne le lit pas aujourd'hui.

## Client intégré (`apps/desktop`)

### Fichiers clés

- [`src/main/autoUpdater.ts`](../apps/desktop/src/main/autoUpdater.ts) — encapsule
  `electron-updater`. Maintient un `UpdateState` (`idle | checking | not-available | available |
  downloading | downloaded | error | dev-unavailable`) et le diffuse à toutes les fenêtres via
  `IpcChannels.updateStateChanged`. `autoDownload = false` : le téléchargement ne démarre que sur
  action explicite de l'utilisateur, ce qui permet une vraie annulation via `CancellationToken`.
- [`src/main/ipc/update.handlers.ts`](../apps/desktop/src/main/ipc/update.handlers.ts) — expose
  `checkForUpdates`, `downloadUpdate`, `cancelDownload`, `installUpdate`, `postponeUpdate`,
  `getUpdateState` au renderer.
- [`src/renderer/src/app/UpdateDialog.tsx`](../apps/desktop/src/renderer/src/app/UpdateDialog.tsx)
  — affiche version installée/disponible, changelog (`releaseNotes` fourni par GitHub Releases via
  electron-updater), barre de progression (%, vitesse, temps restant estimé), et les actions
  Télécharger / Installer et redémarrer / Reporter / Annuler.
- [`src/renderer/src/state/useAppStore.ts`](../apps/desktop/src/renderer/src/state/useAppStore.ts)
  — `setUpdateState` ouvre automatiquement la boîte de dialogue quand une version disponible n'a
  pas déjà été reportée (`postponedUpdateVersion`, persisté dans `AppSettings`).
- Réglage "Vérifier les mises à jour au démarrage" dans Paramètres > Mises à jour
  (`AppSettings.checkUpdatesOnStartup`, activé par défaut).

### Cycle de vie d'une mise à jour côté client

1. Au démarrage (build packagé uniquement), si `checkUpdatesOnStartup !== false`,
   `checkForUpdates()` est appelé silencieusement.
2. L'utilisateur peut aussi lancer une vérification via Aide > Rechercher les mises à jour, ou
   Paramètres > Mises à jour > Vérifier maintenant.
3. Si une version plus récente existe et n'a pas été reportée, la boîte de dialogue s'ouvre
   automatiquement avec le changelog.
4. Téléchargement : barre de progression alimentée par l'événement `download-progress`
   d'electron-updater (pourcentage, vitesse, octets transférés/totaux).
5. `update-downloaded` : le SHA512 a déjà été vérifié en interne par electron-updater. Le bouton
   "Installer et redémarrer" appelle `quitAndInstall()`.
6. Les paramètres utilisateur (`settings.json`, profils, clés API chiffrées) sont conservés car
   NSIS (`deleteAppDataOnUninstall: false`) ne touche jamais au dossier `userData`.

### Scénarios d'erreur gérés

| Scénario | Comportement |
|---|---|
| Pas de connexion réseau | `checkForUpdates`/`downloadUpdate` catch l'exception, état `error` avec `errorMessage`, l'utilisateur peut réessayer via "Vérifier à nouveau". |
| Build de développement (non empaqueté) | Court-circuité en état `dev-unavailable` avant tout appel réseau — message explicite, jamais une fausse "à jour". |
| Téléchargement interrompu par l'utilisateur | `cancelDownload()` appelle `CancellationToken.cancel()`, état repasse à `available` (le fichier partiel est nettoyé par electron-updater). |
| Fichier téléchargé corrompu | electron-updater rejette avant `update-downloaded` (vérification SHA512 interne) ; l'événement `error` est capté et affiché, l'installation n'a jamais lieu — l'utilisateur reste sur la version en cours (rollback implicite : rien n'est remplacé tant que l'intégrité n'est pas confirmée). |
| Version déjà reportée | `postponedUpdateVersion` empêche la réouverture automatique de la boîte de dialogue pour cette version précise ; une vérification manuelle reste possible. |

## Gestionnaire de publication (`apps/update-manager`)

Application Electron autonome, empaquetée séparément
(`LayerAI-UpdateManager-Setup-<version>.exe`, `appId: com.layerai.updatemanager`), réservée à
l'administrateur du projet.

### Fichiers clés

- [`packages/update-publisher`](../packages/update-publisher/src/index.ts) — logique de
  publication partagée entre l'interface graphique et le CLI :
  - `semver.ts` : validation stricte et comparaison SemVer.
  - `hash.ts` : SHA-256 par flux (`createReadStream`), `verifySha256` pour vérifier un fichier
    contre une empreinte connue.
  - `manifest.ts` : construction du `layerai-update-manifest.json`.
  - `github.ts` : client REST GitHub Releases (création de release, vérification qu'un tag
    n'existe pas déjà, upload d'asset via `node:https` avec suivi de progression octet par octet,
    suppression de release pour rollback).
  - `publish.ts` : orchestration — valide, hash chaque fichier, crée la release, uploade chaque
    asset puis le manifeste, **supprime la release si un upload échoue en cours de route** (une
    release à moitié publiée serait pire qu'aucune release : le client verrait une version
    "disponible" avec des assets manquants).
  - `history.ts` : journal local des publications (JSON, le plus récent en premier).
- [`apps/update-manager/src/main/config-store.ts`](../apps/update-manager/src/main/config-store.ts)
  — dépôt (owner/repo) et jeton d'accès personnel (PAT) GitHub, chiffré au repos via
  `safeStorage` (DPAPI sous Windows), même mécanisme que le stockage des clés API IA de
  l'application principale. **Le jeton n'est jamais écrit en clair sur disque ni dans le code.**
- Interface graphique à trois onglets : Publier (formulaire + aperçu Markdown + journal
  d'opérations en direct), Historique (statut, changelog, lien vers la release), Configuration
  (dépôt + PAT).
- [`src/cli/publish-cli.ts`](../apps/update-manager/src/cli/publish-cli.ts) — mode ligne de
  commande pour automatiser les publications (CI, scripts) :
  ```
  pnpm --filter @layerai/update-manager run cli -- \
    --version 1.2.0 --title "Titre" --changelog-file CHANGELOG.md \
    --files release/LayerAI_Setup.exe \
    --owner suceunq --repo LayerAI --token $LAYERAI_GH_TOKEN
  ```
  Owner/repo/token peuvent aussi venir des variables d'environnement `LAYERAI_GH_OWNER` /
  `LAYERAI_GH_REPO` / `LAYERAI_GH_TOKEN` pour éviter de les taper en clair dans l'historique du
  shell.

### Créer un jeton d'accès personnel (PAT)

GitHub n'accepte plus l'authentification par mot de passe pour son API (dépréciée en 2021). Sur
github.com : Settings > Developer settings > Personal access tokens > Fine-grained tokens, portée
limitée au dépôt `suceunq/LayerAI`, permission "Contents: Read and write" (nécessaire pour créer
des releases et uploader des assets).

### Scénarios d'erreur gérés

Vérifiés en conditions réelles (appels réseau réels vers l'API GitHub) :

| Scénario | Comportement vérifié |
|---|---|
| Version SemVer invalide | Rejetée avant tout appel réseau, message explicite (`"x" n'est pas un numéro de version SemVer valide`). |
| Configuration absente (pas de dépôt/PAT) | `publish:run` renvoie une erreur claire sans tenter d'appel réseau. |
| Jeton invalide / expiré | Testé en direct contre `suceunq/LayerAI` : réponse GitHub 401 "Bad credentials" propagée telle quelle à l'utilisateur. |
| Version déjà publiée (tag existant) | `findReleaseByTag` détecte la release existante avant de tenter d'en créer une nouvelle ; message dédié plutôt qu'une erreur GitHub générique. |
| Échec d'upload en cours de publication | La release fraîchement créée est supprimée (rollback) puis l'erreur d'origine est propagée — jamais de release partiellement publiée. |
| Fichier local introuvable/illisible pendant l'upload | Le flux de lecture (`createReadStream`) rejette la promesse avec un message nommant le fichier concerné. |

## Tests automatisés

`packages/update-publisher` a une suite de tests unitaires (`node:test` via `tsx`,
`pnpm --filter @layerai/update-publisher run test`) : validation/comparaison SemVer, calcul et
vérification SHA-256 (y compris détection d'un fichier altéré), lecture/écriture de l'historique.

L'interface de l'Update Manager (formulaire, aperçu Markdown, sauvegarde de configuration,
affichage de l'historique) a été vérifiée de bout en bout via Chrome DevTools Protocol contre une
instance de développement réelle.

## Sécurité

- Aucun secret (jeton GitHub, clé API) n'est stocké en clair dans le code ou sur disque : chiffrement
  au repos via `safeStorage` (DPAPI Windows), même mécanisme que les clés des fournisseurs IA.
- Le mot de passe du compte GitHub de l'utilisateur n'est jamais demandé ni stocké — uniquement un
  PAT à portée limitée, remplaçable/révocable indépendamment du compte.
- Toutes les communications avec GitHub passent en HTTPS (`api.github.com`,
  `uploads.github.com`).
- Le client ne fait jamais confiance à un téléchargement avant vérification d'intégrité
  (SHA512 interne à electron-updater) ; aucune installation n'a lieu si la vérification échoue.
