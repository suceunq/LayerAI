# LayerAI 1.7.18

## Nouvelle icône LayerAI
- Nouvelle identité visuelle métallique commune à la suite Bob59.
- Une buse d’impression dépose trois couches lumineuses violet/cyan, accompagnées d’une étincelle IA.
- Silhouette simplifiée et contrastée pour rester identifiable dans le bureau, la barre des tâches et les petites tailles Windows.
- Les formats PNG et ICO multi-résolutions de l’application et du gestionnaire de mise à jour ont été régénérés.

## Placement intelligent des supports
- Les supports sont désormais réglés sur « plateau uniquement » par défaut afin de limiter les marques sur la pièce et la matière consommée.
- Un risque de surplomb modéré conserve ce réglage économe.
- Si un risque élevé subsiste après que LayerAI a déjà choisi la meilleure orientation, l’analyse IA prend la priorité et autorise automatiquement les supports partout.
- L’écran de révision affiche le placement choisi et un badge « Choix IA · orientation » lorsque la géométrie impose les supports partout.
- Le placement reste modifiable manuellement entre « Plateau uniquement » et « Partout ».

## Export complet vers les slicers
- PrusaSlicer reçoit `support_material_buildplate_only` et le style de support sans transformation.
- Bambu Studio et Creality Print reçoivent `support_on_build_plate_only` ainsi que leur valeur native `support_type`.
- Le style organique est traduit en `tree(auto)` et les styles grille/ajusté en `normal(auto)` pour ces slicers.
- Aucun paramètre généré n’est plus ignoré silencieusement : l’export est interrompu avec une erreur claire si une future option ne possède pas encore de correspondance.
- Cinq nouveaux tests vérifient la priorité IA, le comportement par défaut et la présence des paramètres dans les profils INI et JSON.

## Sélecteurs plus visibles
- Les commandes Simple/Expert et Sombre/Clair sont maintenant regroupées exactement au centre de la barre supérieure.
- Le bloc bénéficie d’un fond contrasté, d’une bordure accentuée et d’une ombre légère pour être repéré immédiatement.
- Les boutons sont plus grands, avec une typographie plus lisible et une zone de clic élargie.
- Les outils LayerAI restent regroupés à gauche et un espace symétrique à droite garantit un centrage stable.
- Les états actifs et les libellés pour lecteurs d’écran sont conservés.

## Correction urgente du démarrage
- Correction de l’écran noir qui pouvait apparaître dès le lancement des versions 1.7.13 et 1.7.14.
- Le preload était généré au format ESM alors que le bac à sable Electron exige un script CommonJS : l’API sécurisée n’était donc jamais exposée à l’interface.
- Le preload est maintenant produit et chargé explicitement sous la forme `index.cjs`, compatible avec le bac à sable.
- Le bac à sable, l’isolation de contexte et toutes les autres protections de sécurité restent activés.
- Un test de non-régression vérifie le format du preload compilé, son chemin de chargement et le maintien du bac à sable avant chaque publication.

## Accessibilité
- Toutes les fenêtres modales et tous les panneaux latéraux gèrent maintenant la touche Échap, le piégeage du focus et le retour vers l’action d’origine.
- Les fenêtres, titres, onglets et panneaux disposent de rôles et relations ARIA explicites pour les lecteurs d’écran.
- Un lien d’évitement permet d’aller directement au contenu principal.
- Le viewer 3D devient accessible au clavier : flèches pour tourner, touches plus et moins pour zoomer.
- Les boutons uniquement représentés par une icône possèdent maintenant un nom accessible et les sélecteurs de mode/thème exposent leur état.
- Les erreurs, notifications, analyses en cours et états de mise à jour sont annoncés automatiquement.
- Les barres de progression exposent leur libellé et leur valeur aux technologies d’assistance.
- La langue du document suit désormais réellement le choix français/anglais.
- Le contraste des textes discrets atteint WCAG AA dans les thèmes sombre et clair.
- Les contours de focus couvrent boutons, liens, champs, listes, zones de texte et éléments interactifs personnalisés.
- La préférence système « réduire les animations » est respectée, avec prise en charge du mode de contraste forcé de Windows.
- Les commandes invisibles au repos deviennent visibles dès qu’elles reçoivent le focus clavier.
- Deux tests automatisés protègent les ratios de contraste et les mécanismes clavier/mouvement.

## Sécurité et confidentialité
- Le renderer Electron fonctionne désormais dans un bac à sable, en plus de l’isolation de contexte et de l’absence d’accès Node.js.
- Toute navigation intégrée et toute demande de permission navigateur sont bloquées ; seuls les liens HTTP(S) explicitement ouverts sont transmis au navigateur système.
- Les clés API ne sont plus jamais enregistrées si le chiffrement sécurisé Windows est indisponible.
- Le fichier contenant les fournisseurs IA est écrit atomiquement avec des permissions privées.
- Les serveurs IA cloud personnalisés exigent HTTPS, sans identifiants intégrés dans l’adresse.
- LM Studio est strictement limité à localhost afin qu’une photo ou un texte présenté comme « local » ne puisse pas partir vers un serveur distant.
- Les requêtes IA expirent après 30 secondes et les réponses anormalement volumineuses sont refusées.
- Les noms de modèles, clés, adresses, formats, signatures et tailles des photos sont validés côté processus principal.
- Les modèles importés sont limités à 250 Mo et doivent être de vrais fichiers STL, OBJ ou 3MF.
- L’interface explique maintenant précisément quelles données quittent l’ordinateur et confirme que Bob59 ne reçoit ni les clés, ni les textes, ni les photos.
- Audit des dépendances de production : aucune vulnérabilité connue détectée.
- Trois tests automatisés couvrent les destinations réseau et les entrées photo interdites.

## Performances et fluidité
- L’analyse géométrique lourde s’exécute maintenant dans un processus de travail séparé.
- La fenêtre, les menus et le système restent réactifs pendant l’import et l’analyse des modèles complexes.
- Le même processus optimisé prend en charge l’analyse initiale, le redimensionnement et la réorientation manuelle.
- Le worker est réutilisé entre les analyses pour éviter le coût d’un nouveau démarrage à chaque opération.
- Une panne du worker est isolée, signalée proprement et le moteur peut être recréé lors de l’analyse suivante.
- La géométrie colorisée du viewer est désormais partagée avec les copies et les plateaux multiples au lieu d’être reconstruite deux fois.
- Réduction du calcul des normales, des allocations mémoire et des copies de sommets dans les scènes contenant plusieurs exemplaires.
- Un test automatisé exécute désormais une véritable analyse STL dans le worker de production.

## Sauvegarde automatique et récupération
- LayerAI sauvegarde automatiquement le projet actif après chaque modification importante, sans interrompre le travail.
- Au prochain démarrage, une fenêtre propose de reprendre exactement le dernier modèle, l’objectif, l’imprimante, le filament, la quantité, les plateaux et les réglages générés.
- Les réglages modifiés manuellement sont eux aussi restaurés et réaffichés dans le récapitulatif.
- Les sauvegardes sont écrites atomiquement afin qu’une fermeture au mauvais moment ne produise pas un fichier partiel.
- Une copie de secours est conservée et utilisée automatiquement si la sauvegarde principale est illisible.
- « Recommencer » ou « Ignorer » efface proprement la session récupérable.
- Un fichier source déplacé ou supprimé produit une erreur claire sans bloquer le démarrage de LayerAI.
- Interface de récupération disponible en français et en anglais.

## Risques expliqués et actions concrètes
- Chaque risque affiche maintenant un titre clair, sa gravité, la cause mesurée, la conséquence probable et l’action conseillée.
- Les risques sont classés automatiquement du plus important au moins important.
- Le niveau de fiabilité de l’analyse est visible, y compris lorsqu’aucun risque important n’est détecté.
- Les surplombs sont reliés à leur représentation orange dans la vue 3D.
- Le résumé est disponible après l’analyse et avant l’export final.
- En mode Simple, les risques secondaires restent repliés pour alléger l’écran ; le mode Expert affiche tous les détails.
- Présentation et recommandations disponibles en français et en anglais.

## Modes Simple et Expert
- Nouveau mode Simple activé par défaut : seules les actions essentielles restent visibles.
- Le mode Expert restaure instantanément les diagnostics, la vue couches, les options avancées, le diagnostic photo et les outils de transformation.
- Le choix Simple/Expert est mémorisé entre les sessions.
- Les paramètres généraux et le formulaire de suggestion restent accessibles en mode Simple.
- Aucun réglage généré ni aucune capacité d’export n’est supprimé : les deux modes utilisent le même moteur.

## Fiabilité des exports
- Validation des géométries avant génération : coordonnées, triangles et indices sont contrôlés.
- Relecture complète des archives 3MF avec vérification CRC et contrôle des fichiers obligatoires.
- Validation des profils PrusaSlicer INI et Bambu Studio / Creality Print JSON.
- Chaque fichier 3MF, INI, JSON, PDF ou PNG est relu depuis le disque après écriture avant d’être annoncé comme enregistré.
- Les projets temporaires envoyés aux slicers sont eux aussi validés avant ouverture.
- Première suite de tests dédiée aux exports valides, corrompus et incomplets.

## Nouvelle identité visuelle
- Interface redessinée pour distinguer clairement LayerAI de SauvegardePro.
- Nouvelle palette violet et cyan inspirée de l'impression 3D, en modes sombre et clair.
- Barre supérieure flottante, panneaux arrondis et arrière-plan technique quadrillé.
- Contrastes, focus clavier et profondeur visuelle améliorés sans modifier les fonctionnalités.

## Nouveautés
- Correction d'un bug d'affichage : après avoir activé « Plusieurs plateaux » et navigué sur un plateau avancé, changer d'imprimante pouvait laisser le navigateur de plateau afficher un numéro incohérent (ex. « Plateau 4 / 1 »). Le fichier exporté restait correct, seul l'affichage était trompeur - corrigé.
- Durcissement sécurité : les liens ouverts depuis l'application vérifient maintenant qu'ils commencent bien par http(s) avant d'être transmis au système, et l'import de manifeste de LayerAI Update Manager refuse les chemins de fichier qui tenteraient de sortir du dossier du manifeste.
- Vérification complète du code (typage, sécurité) effectuée avant compilation - aucune autre anomalie détectée.

## Depuis la version précédente
- Fenêtre d'installation personnalisée : la page d'accueil et la page de fin ont chacune leur propre illustration de marque avec une petite blague sur l'impression 3D, au lieu des graphismes génériques de l'installateur.
- Mode clair vraiment complet : la fenêtre native (barre de titre, menu Fichier/Édition/Outils/Affichage/Aide, boîtes de dialogue système) suit maintenant le thème choisi, tout comme le viewer 3D (plateau, grille, fond de scène) qui restait toujours sombre auparavant.
- Le menu Fichier → Exporter propose maintenant une ligne dédiée « Profil Creality Print (.json) », séparée de Bambu Studio (auparavant fusionnées).
- Description du logiciel corrigée dans « À propos » : LayerAI utilise un moteur local par défaut, mais peut aussi s'appuyer sur un fournisseur d'IA externe (via votre propre clé API) pour les descriptions complexes et le diagnostic photo - ce n'était pas indiqué correctement avant.
- Documentation intégrée (onglet Aide) largement complétée : fonctionnalités principales, export des profils, calcul du coût, facturation, IA et clés API, FAQ, conseils de prise en main.
- Correction d'une faille de sécurité potentielle : les notes de version affichées dans la fenêtre de mise à jour sont maintenant filtrées avant affichage (évite qu'une note de version corrompue ou falsifiée puisse exécuter du code dans l'application).
- Nettoyage interne du code (détection de l'exécutable slicer simplifiée et unifiée pour PrusaSlicer/Bambu Studio/Creality Print) - aucun changement visible, fiabilité et maintenabilité améliorées.
- Support complet des imprimantes Creality (54 modèles : séries K1/K2, Ender-3, CR-10 et bien d'autres) avec leurs filaments dédiés (CR-PLA, CR-PETG, CR-ABS, CR-TPU, CR-Nylon...), export .3mf compatible Creality Print, et détection automatique de l'exécutable Creality Print pour l'ouverture directe.
- Le sélecteur d'imprimante se fait maintenant en deux étapes : choisissez d'abord la marque (Prusa Research / Bambu Lab / Creality), puis le modèle - le menu Filament reste filtré automatiquement selon votre choix.
- Nouveau réglage Thème (Sombre / Clair) accessible directement dans la barre du haut, en plus de l'onglet Paramètres.
- Correction du texte de remerciement dans "À propos" : il citait uniquement Keup's 3D, il mentionne maintenant Keup's 3D et lolo.lc3d.
- Correction d'un bug remonté par des utilisateurs : zoomer/déplacer la pièce dans le viewer 3D (notamment en vue couches) pouvait faire recentrer et re-zoomer automatiquement la caméra, annulant le cadrage manuel. La caméra respecte maintenant toujours ce que fait l'utilisateur.
- Nouveau bouton "✉ Suggestion / Correction" bien visible dans la barre du haut : ouvre un petit formulaire (sujet + message) qui prépare un e-mail prêt à envoyer, avec un bouton "Copier" en secours si votre messagerie par défaut n'est pas configurée.
- Barre du haut réorganisée : les boutons (Vue couches, Diagnostic, Options avancées, Diagnostic photo, Suggestion/Correction) sont maintenant regroupés à gauche, juste à côté du nom de l'imprimante, au lieu d'être poussés à droite.
- Encadré de remerciement dans "À propos" pour Keup's 3D et lolo.lc3d.
- Génération de facture (séparée du rapport IA) : nouvel onglet "Ma société" dans Paramètres (statut, adresse, SIRET, TVA, IBAN, délai de paiement...), et un bouton "Générer une facture" dans l'écran de révision pour créer une facture PDF avec les mentions légales françaises (numérotation séquentielle, TVA ou mention d'exonération, pénalités de retard, indemnité forfaitaire de recouvrement). Le temps d'impression n'apparaît jamais sur la facture.
- Temps estimé plus lisible dans l'écran de révision et le rapport PDF : au lieu d'un nombre brut de minutes, l'estimation s'affiche maintenant en mois / jours / heures / minutes selon la durée (ex. "2 j 4 h 12 min" pour une longue impression).
- Correction d'un bug d'alignement : sur un plateau avec plusieurs exemplaires, la pièce réelle pouvait ne pas être exactement calée sur sa case de la grille et chevaucher visuellement les copies voisines. Elle est maintenant toujours alignée précisément sur la position calculée.
- En mode « Plusieurs plateaux », tous les plateaux sont désormais affichés ensemble côte à côte dans la vue 3D (au lieu d'un seul à la fois) - le plateau actif (celui exporté) reste identifiable car ses pièces sont pleines, les autres restent en aperçu translucide.
- Plusieurs plateaux (optionnel) : si la quantité demandée dépasse ce qui tient sur un plateau, activez « Plusieurs plateaux » pour répartir automatiquement les pièces sur plusieurs plateaux successifs (navigation Plateau 1/2/3..., export du plateau affiché à l'écran). Désactivé par défaut - sans l'option, seul le premier plateau est exporté comme avant.
- L'imprimante et le filament sélectionnés sont mémorisés d'une session à l'autre : au redémarrage, LayerAI rouvre sur votre dernier choix au lieu de revenir à la MK4S / PLA par défaut.
- Barre du haut réorganisée : Vue couches, Diagnostic (intégrité du maillage), Options avancées et Diagnostic photo regroupés en un clic, toujours visibles en haut de la fenêtre.
- Le curseur de hauteur de la vue couches s'affiche désormais juste sous la barre du haut au lieu de flotter dans le viewer 3D.
- Diagnostic photo (IA) : importez une photo de votre impression pour détecter le défaut (stringing, pied d'éléphant, warping, décalage de couches, sur/sous-extrusion, adhérence...) avec un score de confiance et des corrections de réglages en un clic. Nécessite un fournisseur IA cloud configuré dans Paramètres → Clés API.
- La fenêtre s'adapte automatiquement à la résolution de l'écran (se maximise sur les écrans plus petits, ne rogne plus le contenu).
- Nouvel onglet "Coûts" dans les Paramètres : prix de la bobine, puissance imprimante et prix électricité.
- Estimation du coût d'impression (matière + électricité) affichée directement dans l'écran de révision.
- Assistant IA de préparation d'impression 3D (Prusa & Bambu Lab), analyse de modèle, description en langage naturel, réglages expliqués avec score de confiance.
- Impression en plusieurs exemplaires (quantité + arrangement automatique sur le plateau).
- Projets récents (réouverture rapide depuis l'écran d'import).
- Réglages appris depuis vos retours d'impression, mis en évidence dans l'écran de révision.
- Capture d'image du modèle 3D pour les réseaux sociaux.
- Export .3mf, profil PrusaSlicer (.ini), profil Bambu Studio (.json), rapport PDF.
- Mise à jour intégrée (GitHub Releases).
