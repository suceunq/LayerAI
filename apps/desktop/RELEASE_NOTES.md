# LayerAI 1.7.7

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
