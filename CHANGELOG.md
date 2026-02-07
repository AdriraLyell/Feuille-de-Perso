# Historique Ancien (Legacy Changelog)

## [2.12.33] - 2026-02-02

- Correctif : Restauration de la taille de la zone "Notes" en bas de la page "Détails & Équipement".

## [2.12.32] - 2026-02-02

- Correctif Critique : Le défilement de la page n'est plus bloqué après avoir validé ou fermé une fenêtre modale.

## [2.12.31] - 2026-02-02

- Correctif : Suppression des logs de débogage dans la console.
- Ergonomie : La fiche s'agrandit désormais automatiquement en hauteur si vous ajoutez beaucoup de compétences, débloquant le défilement.

## [2.12.30] - 2026-02-02

- Ergonomie : Les compétences à variations (Artisanat : ...) sont maintenant cliquables directement sur la fiche.
- Fonctionnalité : Remplir une variante ajoute automatiquement une nouvelle ligne vide en dessous pour des ajouts rapides.

## [2.12.29] - 2026-02-02

- Nettoyage : Suppression des traces de débogage de la migration, le correctif étant confirmé.

## [2.12.28] - 2026-02-02

- Correction Critique : Mise à jour du schéma de validation pour autoriser le champ "variante" (empêche sa suppression automatique).

## [2.12.27] - 2026-02-02

- Correction d'urgence : Réparation automatique des conflits de nommage dans les données sauvegardées (skilllibrary vs skillLibrary).

## [2.12.26] - 2026-02-02

- Correction : Application rétroactive du statut "Variable" aux compétences déjà présentes sur la fiche (restauration des champs de saisie).

## [2.12.25] - 2026-02-02

- Diagnostic : Ajout de traces détaillées dans le processus de migration de la bibliothèque.

## [2.12.24] - 2026-02-02

- Correction d'initialisation : Forçage de la mise à jour des indicateurs "Variable" pour les bibliothèques existantes (Artisanat, Jouer, Art Martial).

## [2.12.23] - 2026-02-02

- Ajout de traces pour diagnostic approfondi de l'initialisation.

## [2.12.22] - 2026-02-02

- Correction définitive de l'initialisation : Le premier lancement charge désormais strictement les données par défaut, garantissant l'intégrité de la bibliothèque et des valeurs.

## [2.12.21] - 2026-02-02

- Correction critique : La bibliothèque de compétences se charge désormais correctement lors de la première ouverture (ou mise à jour depuis une ancienne version).
- Correction interne : La propriété "Variable" est maintenant correctement validée et conservée.

## [2.12.20] - 2026-02-02

- Ajustement : Déplacement de l'icône "Variable" à côté de l'indicateur de présence sur les cartes de compétence.

## [2.12.19] - 2026-02-02

- Polissage visuel de la bibliothèque de compétences (icônes "Variable" et "Présent").
- Ajout d'une légende explicative dans la vue principale de la bibliothèque.

## [2.12.18] - 2026-02-02

- Correction : Les compétences variables ajoutées sans précision affichent bien " : ..." au lieu de rien.
- Assurance que la propriété "variante" est bien conservée même vide.

## [2.12.17] - 2026-02-02

- Ajout d'un indicateur visuel (" : ...") pour les compétences variables sans spécialité définie sur la fiche.
- Amélioration de la lisibilité des compétences vides.

## [2.12.16] - 2026-02-02

- Configuration par défaut : Artisanat, Jouer et Art Martial sont désormais initialisés comme variables.
- Ceci permet de spécifier directement la spécialité lors de la création d'un nouveau personnage.

## [2.12.15] - 2026-02-02

- Les compétences "variables" resten désomais dans la réserve après ajout, pour permettre des ajouts multiples (ex: plusieurs Artisanats).
- Correction mineure de l'affichage de la réserve.

## [2.12.14] - 2026-02-02

- Remplacement de la modale native par une modale thématique lors de l'ajout de compétences variables.
- Amélioration de l'UX lors du glisser-déposer de compétences.

## [2.12.13] - 2026-02-02

- Ajout du système de Compétences Variables (ex: Artisanat : Forge).
- La bibliothèque permet de marquer une compétence comme variable.
- À l'ajout, une boîte de dialogue demande de préciser la spécialité.
- L'éditeur de configuration permet de modifier la variante ultérieurement.

## [2.12.12] - 2026-02-01

- Ajout du système de Traits Variables (ex: Allergie : Chats).
- Mise à jour de l'éditeur de traits (Page 2) pour supporter les variantes et compléments.
- Mise à jour de la Bibliothèque pour permettre la configuration de traits variables.

## [2.12.11] - 2026-02-01

- Harmonisation des boutons d'action (Importer/Créer) sur l'ensemble des bibliothèques.
- Standardisation de la taille des textes et des icônes d'action.

## [2.12.10] - 2026-02-01

- Harmonisation visuelle des onglets de bibliothèque (Style Premium RPG).
- Unification du thème (Sépia/Papier) pour Traits et Spécialisations.
- Ajout de badges 'Utilisé' sur les cartes de Traits.

## [2.12.9] - 2026-02-01 [PATCH]

- UI : Synchronisation du numéro de version affiché dans l'interface (2.9.11 -> 2.12.9).

## [2.12.0] - 2026-02-01 [MINOR]

- Feature : L'éditeur de traits (page Détails & Equipement) permet maintenant de saisir une description et un tag/catégorie.
- Feature : Lors de la sélection d'un trait depuis la bibliothèque, la description et le tag sont automatiquement remplis.

## [2.11.5] - 2026-02-01 [PATCH]

- UI : Agrandissement de la zone de la bibliothèque dans les réglages pour maximiser l'espace utilisable.

## [2.11.4] - 2026-02-01 [PATCH]

- Bug Fix : Correction d'une erreur (ReferenceError) lors de l'ouverture des réglages due à des imports manquants.

## [2.11.3] - 2026-02-01 [PATCH]

- UI : Le bouton 'Bibliothèque' a été déplacé du menu principal vers l'onglet dédié dans les Réglages.

## [2.11.2] - 2026-02-01 [PATCH]

- Correction : Le rapport de migration (et la recommandation de sauvegarde) s'affiche désormais correctement après un import.

## [2.11.1] - 2026-02-01 [PATCH]

- Code : Refactoring majeur du module Import/Export (Découpage en sous-composants).
- Maintenance : Amélioration de la structure du code pour faciliter les évolutions futures.

## [2.9.11] - 2026-02-01 [PATCH]

- UI : Mise à jour du libellé de la légende de la réserve ('Présent dans la Fiche').

## [2.9.10] - 2026-02-01 [PATCH]

- UI : Centrage de la légende 'Sur la fiche' dans la barre d'outils de la réserve.

## [2.9.9] - 2026-02-01 [PATCH]

- Optimisation UX : Réduction de la taille des vignettes de compétences dans la réserve.
- Optimisation UX : L'indicateur 'Sur la fiche' est désormais une icône placée avant le nom de la compétence.
- Optimisation UX : Ajout d'une légende globale dans la barre d'outils de la réserve.

## [2.9.8] - 2026-02-01 [PATCH]

- Bug Fix : Restauration des imports critiques dans les Réglages (Correction du crash ReferenceError).

## [2.9.7] - 2026-02-01 [MINOR]

- Audit d'accessibilité et correction des contrastes dans les Réglages
- Harmonisation thématique complète du menu Réglages (Style Grimoire)
- Migration des modales de confirmation des réglages vers ThematicModal
- Amélioration de la lisibilité des textes secondaires (tons Sépia/Encre)

## [2.9.6] - 01/02/2026 17:40 [PATCH]

- UX : L'aide des catégories s'affiche désormais comme un panneau latéral coulissant dans l'éditeur (au lieu d'une modale superposée).
- UX : Permet de consulter les codes de placement tout en saisissant les informations de la compétence.

## [2.9.5] - 01/02/2026 17:35 [PATCH]

- UX : Déplacement du bouton d'aide des catégories dans l'éditeur de compétence.
- UI : Passage de l'aide des catégories en mode 'ThematicModal' avec style Grimoire.
- Accessibilité : Audit et correction globale des contrastes (textes gris trop clairs).
- Accessibilité : Amélioration de la visibilité des placeholders sur le parchemin.

## [2.9.4] - 01/02/2026 17:22 [PATCH]

- Bug Fix : Correction d'une ReferenceError lors du chargement de la modale d'édition de compétence (Import manquant).

## [2.9.3] - 01/02/2026 17:20 [MINOR]

- UI : Refonte visuelle complète des formulaires bibliothèque vers un style 'Grimoire' (Papier & Encre).
- Accessibilité : Correction majeure des contrastes sur les descriptions et sélecteurs.
- Design : Suppression des couleurs vives (rose fushia) au profit d'une palette plus naturelle (Bordeaux, Forêt, Ambre).
- UX : Passage de tous les éditeurs de la bibliothèque sur le système de modales thématiques.

## [2.9.2] - 01/02/2026 17:10 [PATCH]

- Réserve : Masquage de l'icône de suppression pour les compétences présentes sur la fiche (Sécurité).
- Réserve : Maintien de l'icône d'édition pour permettre le renommage synchronisé.

## [2.9.1] - 01/02/2026 16:45 [PATCH]

- Fix : Correction d'un crash (ReferenceError) lors de l'enregistrement d'une compétence renommée dû à une icône manquante.

## [2.9.0] - 01/02/2026 16:45 [MAJOR]

- Réserve : Déblocage de l'édition et de la suppression des compétences déjà présentes sur la fiche.
- Réserve : Possibilité de définir/modifier la catégorie de placement par défaut pour chaque compétence.
- Réserve : Système de renommage synchronisé avec la fiche de personnage (avec confirmation de sécurité).
- UX : Amélioration de la visibilité des indicateurs 'Sur la fiche' dans la réserve.

## [2.8.2] - 01/02/2026 15:55 [PATCH]

- Import : Remplacement de l'alerte navigateur par une modale thématique élégante après une migration.
- Import : Ajout d'un bouton de sauvegarde directe dans la modale de succès de migration.

## [2.8.1] - 01/02/2026 15:50 [PATCH]

- Import : Ajout d'une recommandation de sauvegarde immédiate après une migration de fichier.
- Migration : Finalisation du système de moissonnage des spécialisations.

## [2.8.0] - 01/02/2026 15:45 [MINOR]

- Migration : Système de moissonnage automatique des spécialisations lors de l'importation de vieilles fiches.
- Migration : Initialisation automatique de la bibliothèque de spécialisations si absente.
- Migration : Sécurisation de l'intégrité des données (thèmes, effets des traits, configuration de création) pour les imports d'anciennes versions (v2.4+).
- Migration : Correction d'un bug où la bibliothèque de compétences n'était pas toujours correctement réactivée lors d'un import.

## [2.7.9] - 01/02/2026 15:35 [PATCH]

- Bugfix : Correction d'un crash au démarrage suite à un import manquant (icône Plus).

## [2.7.8] - 01/02/2026 15:30 [PATCH]

- UI/UX : Refonte visuelle des zones de spécialisations (Design 'Pills' épuré).
- UI/UX : Suppression des placeholders texte encombrants au profit d'un design pointillé minimalist pour les champs vides.
- UI/UX : Distinction visuelle accrue entre spécialisations imposées (bleues) et spécialisations joueur (ambrées).

## [2.7.7] - 01/02/2026 15:20 [PATCH]

- Versioning : Automatisation de la synchronisation entre package.json, version.json et constants.ts.
- Versioning : Correction de la version dans le fichier version.json.

## [2.7.6] - 01/02/2026 15:15 [PATCH]

- UX : Dans la modale d'édition, les compétences cochées restent désormais visibles même si elles ne correspondent pas au terme de recherche actuel.
- UX : Une compétence décochée qui ne correspond pas au filtre disparaît immédiatement de la vue.

## [2.7.5] - 01/02/2026 15:05 [PATCH]

- Recherche : Implémentation de la recherche intelligente (insensible aux accents et à la casse).
- Filtres : Uniformisation du comportement de recherche dans toutes les bibliothèques et l'Omnibar.
- Technique : Centralisation de la normalisation de texte via un nouvel utilitaire stringUtils.

## [2.7.4] - 01/02/2026 14:55 [PATCH]

- Bibliothèque : Ajout d'un champ de recherche pour filtrer les compétences lors de l'édition d'une spécialisation.
- Bibliothèque : Tri alphabétique automatique de la liste des compétences parentes.
- UX : Amélioration visuelle de la sélection des compétences (surbrillance et indicateur de nombre).

## [2.7.3] - 01/02/2026 14:45 [PATCH]

- Sécurité : Alerte de confirmation avant de quitter les réglages si des modifications ne sont pas enregistrées.
- Fiabilisation : Correction du bug de pollution des bibliothèques (synchronisation déportée sur le 'onBlur').
- Automatisation : Synchronisation bidirectionnelle automatique entre la configuration MJ et les catalogues globaux.
- UI : Renommage des 'Spécialisations Imposées' en 'Spécialisations Automatiques' pour plus de clarté.

## [2.7.0] - 01/02/2026 14:00 [MINOR]

- Bibliothèque : Création du Catalogue de Spécialisations centralisé.
- Ergonomie : Nouvel Omnibar de recherche intelligente pour les spécialisations.
- Drag-and-Drop : Support du glisser-déposer depuis le catalogue vers la fiche ou les réglages MJ.
- Import/Export : Support complet du catalogue de spécialisations avec fusion intelligente et résolution de conflits.

## [2.6.0] - 01/02/2026 13:00 [MINOR]

- Architecture : Refonte technique majeure des composants cœurs pour une meilleure modularité.
- TraitLibrary : Fragmentation du composant monolithique en sous-composants spécialisés (TraitCard, TraitForm, TraitEffectEditor).
- CharacterSheet : Découpage chirurgical du fichier principal (Header, ExperienceSummary, CreationModeModal).
- Performance : Optimisation du cycle de rendu React grâce à des composants plus petits et isolés.
- Maintenance : Extraction de la logique complexe de mise en page dans un hook dédié (useSheetLayout).
- Code Quality : Réduction significative de la complexité cyclomatique des fichiers principaux.

## [2.5.1] - 01/02/2026 12:35 [PATCH]

- Spécialisations : Application d'une règle globale de visibilité (minimum 1 point dans la compétence requis).
- Fiche : Les spécialisations imposées sont désormais masquées tant que la compétence racine est à 0.

## [2.5.0] - 01/02/2026 12:35 [MINOR]

- Spécialisations : Introduction des seuils de niveau pour les spécialisations imposées.
- MJ : Possibilité de définir un niveau minimum requis dans une compétence pour activer une spécialisation offerte.
- UI : Nouvel éditeur de seuils intégré dans les paramètres de spécialisation.
- Fiche : Masquage automatique des spécialisations (et de l'étoile indicative) tant que le niveau requis n'est pas atteint.
- Architecture : Migration structurelle des données de spécialisation pour supporter les métadonnées de seuil.

## [2.4.0] - 01/02/2026 12:08 [MINOR]

- UI : Expansion majeure du catalogue de symboles de notation (32 symboles disponibles).
- UI : Ajout de symboles thématiques RPG (Couronne, Fantôme, Hache, Épée, etc.).
- UI : Optimisation du rendu visuel des symboles avec gestion native du remplissage (stroke/fill).
- Architecture : Résolution de l'erreur de configuration TypeScript (types Node.js).
- Version : Passage à la version 2.4.0 pour marquer l'introduction de la personnalisation visuelle avancée.

## [2.3.0] - 01/02/2026 11:53 [MINOR]

- Robustesse : Ajout d'une couche de validation de données (Zod) pour sécuriser le chargement et l'import.
- Qualité : Mise en place de l'environnement de tests unitaires avec Vitest.
- Tests : Validation automatisée de la logique de calcul d'XP, des migrations de données et des hooks de bonus.
- UI : Personnalisation des symboles de notation (Cercle, Carré, Étoile, etc.) via l'onglet Apparence.
- Correction : Optimisation visuelle des symboles (mode vide/plein) pour une meilleure lisibilité.
- UI : Ajout d'une alerte visuelle de décalage de version lors de l'importation de fichiers.
- Maintenance : Refonte chirurgicale du module d'Import/Export (découpage en composants et extraction de la logique métier).
- Sécurité : Protection contre les sauvegardes corrompues avec fallback automatique vers l'état initial sain.

## [2.2.0] - 01/02/2026 10:45 [MINOR]

- Performance : Optimisation majeure des re-rendus React.
- Architecture : Séparation du CharacterContext en État (données) et Actions (fonctions) pour une meilleure fluidité.
- Stabilité : Stabilisation des fonctions de modification (useCallback + Functional Updates) pour éviter les calculs inutiles.
- Optimisation : Mémoïsation des composants de section (Attributs, Compétences, Combat, Compteurs) via React.memo.

## [2.1.0] - 01/02/2026 10:20 [MINOR]

- Architecture : Refactorisation structurelle majeure pour améliorer la maintenabilité.
- Code : Extraction de la logique métier (calculs de bonus, mode création) dans des Custom Hooks dédiés (useCharacterBonuses, useCreationMode).
- Organisation : Réorganisation des composants UI (migration de DotRating vers le dossier dédié).
- Performance : Séparation de la logique de calcul de la couche de présentation (JSX) pour une meilleure clarté.

## [2.0.5] - 31/01/2026 23:15 [PATCH]

- UI : Remplacement du sélecteur d'orientation textuel par des icônes géométriques explicites.
- Visual : Utilisation de RectangleHorizontal (Paysage) et RectangleVertical (Portrait) pour indiquer le mode actuel.

## [2.0.4] - 31/01/2026 21:58 [PATCH]

- UI : Simplification du bouton de gestion des données (Sauvegarde/Chargement).
- Visual : Suppression du label textuel pour ne conserver que les icônes, allégeant la barre de navigation.

## [2.0.3] - 31/01/2026 21:55 [PATCH]

- UI : Mise à jour de l'icône du bouton de sauvegarde.
- Visual : Ajout de l'icône 'Download' (Import) à côté de la 'Disquette' (Sauvegarde) pour mieux signifier la double fonction du menu.

## [2.0.2] - 31/01/2026 21:40 [PATCH]

- Navigation : Ajustement de la disposition des boutons.
- Visual : Le séparateur gauche est déplacé entre le sélecteur de vue et le bouton 'Fiche de Personnage'.
- Ergonomie : Le bouton d'impression est regroupé avec les outils (Historique, Aide) pour une meilleure logique visuelle.

## [2.0.1] - 31/01/2026 21:35 [PATCH]

- Navigation : Réorganisation de la barre supérieure. Le bouton 'Fiche de Personnage' est désormais à gauche.
- Visual : Le nom du personnage est centré de manière absolue pour une symétrie parfaite.
- UI : Renommage du bouton 'Fiche' en 'Fiche de Personnage' pour plus de clarté.

## [2.0.0] - 31/01/2026 20:30 [MAJOR]

- Architecture : Migration complète vers React/Vite et adoption du pattern Context API pour une meilleure gestion d'état et des performances accrues.
- Visual : Nouvelle identité 'Jeu de Rôle' avec des composants d'interface texturés (Boutons, Modales, Panneaux).
- Navigation : Interface modernisée conservant l'ergonomie classique mais construite sur une architecture modulaire.
- Technique : Structure de projet standardisée (`src/`) et optimisation du build en fichier unique pour une portabilité maximale.

## [1.9.53] - 27/01/2026 18:00 [MINOR]

- Ergonomie : Séparation contextuelle des menus de Sauvegarde/Chargement.
- Joueur : En vue 'Fiche', le menu est simplifié (Sauvegarder/Charger le personnage uniquement) pour plus de clarté.
- MJ : En vue 'Configurer', le menu complet (Système, Templates, Bibliothèques) reste accessible pour la gestion avancée.
- Correction Visuelle : Ajustement de l'alignement des colonnes dans le tableau de Réputation (Page 2).

## [1.9.52] - 27/01/2026 17:00 [PATCH]

- Technique : Refactoring complet de la structure des types TypeScript. Découpage du fichier monolithique `types.ts` en modules spécialisés (primitives, system, campaign, character).
- Technique : Mise en place du pattern 'Barrel File' pour assurer la rétrocompatibilité des imports.

## [1.9.51] - 27/01/2026 16:00 [MINOR]

- Amélioration : La Réserve de Compétences est désormais pré-remplie par défaut avec l'ensemble des compétences de la fiche.
- Migration : Lors de la mise à jour, les compétences de votre fiche actuelle sont automatiquement ajoutées à la réserve si celle-ci était vide.

## [1.9.50] - 27/01/2026 15:00 [PATCH]

- Bibliothèque : Ajout d'une aide contextuelle listant les codes de catégories pour les compétences.
- Bibliothèque : Remplacement de l'alerte native de suppression par une fenêtre de confirmation stylisée et sécurisée.
- Amélioration de l'interface utilisateur pour la gestion des compétences de réserve.

## [1.9.49] - 27/01/2026 14:15 [PATCH]

- Bibliothèque : Ajout d'une fenêtre de confirmation stylisée pour l'importation des compétences depuis la fiche, remplaçant les alertes natives du navigateur.
- Technique : Migration du système de notification vers un 'Context React' pour garantir la stabilité et éviter les erreurs lors des interactions complexes.

## [1.9.48] - 27/01/2026 12:30 [MAJOR]

- Introduction de la Réserve de Compétences : un espace pour stocker des compétences personnalisées non utilisées.
- Nouvelle vue 'Bibliothèque' regroupant les Traits (Avantages/Désavantages) et les Compétences.
- Configuration de la fiche : Ajout d'une barre latérale pour glisser-déposer des compétences depuis la réserve vers la fiche, et inversement pour les archiver.

## [1.9.47] - 27/01/2026 11:00 [PATCH]

- Ajustement mineur de texte dans la fenêtre d'activation du Mode Création : 'Slots de Rangs' devient simplement 'Rangs'.

## [1.9.46] - 27/01/2026 10:30 [MINOR]

- Refonte du Mode Création : Nouvelle interface HUD en bas d'écran, plus claire et informative.
- Création : Ajout de jauges visuelles pour le suivi des budgets (Attributs, Compétences, Arrière-plans).
- Création : Système de validation amélioré avec rapport d'erreurs détaillé avant confirmation.

## [1.9.45] - 26/01/2026 18:45 [PATCH]

- Correction : Le mode création incrémente désormais correctement la 'Valeur de Création' (le socle gratuit) en plus de la valeur courante.
- Visuel : Les points acquis à la création s'affichent désormais avec une couleur distincte (Bleu roi) par rapport aux points XP (Gris foncé).
- Configuration : Ajout d'un sélecteur de couleurs dans l'onglet 'Apparence' des paramètres pour personnaliser ces deux types de points.

## [1.9.44] - 26/01/2026 17:30 [MINOR]

- Ajout du système de 'Carte' automatique (Valet, Dame, Roi) basé sur la moyenne des meilleures compétences.
- Configuration : Options pour activer/désactiver le calcul de la Carte et ajuster ses seuils dans les paramètres.

## [1.9.43] - 26/01/2026 16:00 [PATCH]

- Optimisation de l'affichage mobile pour la barre de navigation.
- Correction mineure sur l'affichage des bonus d'attributs.

## [1.9.42] - 26/01/2026 14:00 [MAJOR]

- Implémentation du système d'effets pour les Traits (Avantages/Désavantages).
- Les traits peuvent désormais accorder automatiquement des bonus d'XP, des bonus d'Attributs ou des rangs de compétence gratuits.
- Mise à jour du calculateur d'XP pour prendre en compte les bonus issus des traits.

## [1.9.41] - 25/01/2026 11:30 [MINOR]

- Ajout d'options de configuration pour la méthode de création (Par Rangs ou Par Points/XP).
- Possibilité de définir des budgets XP séparés (Attributs, Compétences, Arrière-plans) ou un pot commun.
- Refonte visuelle de la fenêtre de paramètres.
