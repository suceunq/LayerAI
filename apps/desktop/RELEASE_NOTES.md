# LayerAI 1.7.25 — Configuration PayPal protégée

## Améliorations

- Le lien PayPal n’est plus affiché ni modifiable dans les paramètres de l’application.
- L’onglet Soutien conserve uniquement le réglage d’affichage de la fenêtre de bienvenue au démarrage.
- Le renderer ne reçoit plus l’adresse PayPal : il connaît seulement l’état configuré ou indisponible.
- L’ouverture de la page de don reste entièrement gérée et validée par le processus principal sécurisé.

## Configuration

- L’adresse officielle reste administrable sans recompilation via le fichier interne `donation.json` et l’asset distant de la dernière release GitHub.
- La configuration PayPal LayerAI actuelle demeure active avec l’identifiant marchand fourni et les paiements en euros.
