
import { ChangelogEntry } from '../types';

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: "2.7.7",
        date: "01/02/2026 15:20",
        type: 'patch',
        changes: [
            "Versioning : Automatisation de la synchronisation entre package.json, version.json et constants.ts.",
            "Versioning : Correction de la version dans le fichier version.json."
        ]
    },
    {
        version: "2.7.6",
        date: "01/02/2026 15:15",
        type: 'patch',
        changes: [
            "UX : Dans la modale d'édition, les compétences cochées restent désormais visibles même si elles ne correspondent pas au terme de recherche actuel.",
            "UX : Une compétence décochée qui ne correspond pas au filtre disparaît immédiatement de la vue."
        ]
    },
    {
        version: "2.7.5",
        date: "01/02/2026 15:05",
        type: 'patch',
        changes: [
            "Recherche : Implémentation de la recherche intelligente (insensible aux accents et à la casse).",
            "Filtres : Uniformisation du comportement de recherche dans toutes les bibliothèques et l'Omnibar.",
            "Technique : Centralisation de la normalisation de texte via un nouvel utilitaire stringUtils."
        ]
    },
    {
        version: "2.7.4",
        date: "01/02/2026 14:55",
        type: 'patch',
        changes: [
            "Bibliothèque : Ajout d'un champ de recherche pour filtrer les compétences lors de l'édition d'une spécialisation.",
            "Bibliothèque : Tri alphabétique automatique de la liste des compétences parentes.",
            "UX : Amélioration visuelle de la sélection des compétences (surbrillance et indicateur de nombre)."
        ]
    },
    {
        version: "2.7.3",
        date: "01/02/2026 14:45",
        type: 'patch',
        changes: [
            "Sécurité : Alerte de confirmation avant de quitter les réglages si des modifications ne sont pas enregistrées.",
            "Fiabilisation : Correction du bug de pollution des bibliothèques (synchronisation déportée sur le 'onBlur').",
            "Automatisation : Synchronisation bidirectionnelle automatique entre la configuration MJ et les catalogues globaux.",
            "UI : Renommage des 'Spécialisations Imposées' en 'Spécialisations Automatiques' pour plus de clarté."
        ]
    },
    {
        version: "2.7.0",
        date: "01/02/2026 14:00",
        type: 'minor',
        changes: [
            "Bibliothèque : Création du Catalogue de Spécialisations centralisé.",
            "Ergonomie : Nouvel Omnibar de recherche intelligente pour les spécialisations.",
            "Drag-and-Drop : Support du glisser-déposer depuis le catalogue vers la fiche ou les réglages MJ.",
            "Import/Export : Support complet du catalogue de spécialisations avec fusion intelligente et résolution de conflits."
        ]
    },
    {
        version: "2.6.0",
        date: "01/02/2026 13:00",
        type: 'minor',
        changes: [
            "Architecture : Refonte technique majeure des composants cœurs pour une meilleure modularité.",
            "TraitLibrary : Fragmentation du composant monolithique en sous-composants spécialisés (TraitCard, TraitForm, TraitEffectEditor).",
            "CharacterSheet : Découpage chirurgical du fichier principal (Header, ExperienceSummary, CreationModeModal).",
            "Performance : Optimisation du cycle de rendu React grâce à des composants plus petits et isolés.",
            "Maintenance : Extraction de la logique complexe de mise en page dans un hook dédié (useSheetLayout).",
            "Code Quality : Réduction significative de la complexité cyclomatique des fichiers principaux."
        ]
    },
    {
        version: "2.5.1",
        date: "01/02/2026 12:35",
        type: 'patch',
        changes: [
            "Spécialisations : Application d'une règle globale de visibilité (minimum 1 point dans la compétence requis).",
            "Fiche : Les spécialisations imposées sont désormais masquées tant que la compétence racine est à 0."
        ]
    },
    {
        version: "2.5.0",
        date: "01/02/2026 12:35",
        type: 'minor',
        changes: [
            "Spécialisations : Introduction des seuils de niveau pour les spécialisations imposées.",
            "MJ : Possibilité de définir un niveau minimum requis dans une compétence pour activer une spécialisation offerte.",
            "UI : Nouvel éditeur de seuils intégré dans les paramètres de spécialisation.",
            "Fiche : Masquage automatique des spécialisations (et de l'étoile indicative) tant que le niveau requis n'est pas atteint.",
            "Architecture : Migration structurelle des données de spécialisation pour supporter les métadonnées de seuil."
        ]
    },
    {
        version: "2.4.0",
        date: "01/02/2026 12:08",
        type: 'minor',
        changes: [
            "UI : Expansion majeure du catalogue de symboles de notation (32 symboles disponibles).",
            "UI : Ajout de symboles thématiques RPG (Couronne, Fantôme, Hache, Épée, etc.).",
            "UI : Optimisation du rendu visuel des symboles avec gestion native du remplissage (stroke/fill).",
            "Architecture : Résolution de l'erreur de configuration TypeScript (types Node.js).",
            "Version : Passage à la version 2.4.0 pour marquer l'introduction de la personnalisation visuelle avancée."
        ]
    },
    {
        version: "2.3.0",
        date: "01/02/2026 11:53",
        type: 'minor',
        changes: [
            "Robustesse : Ajout d'une couche de validation de données (Zod) pour sécuriser le chargement et l'import.",
            "Qualité : Mise en place de l'environnement de tests unitaires avec Vitest.",
            "Tests : Validation automatisée de la logique de calcul d'XP, des migrations de données et des hooks de bonus.",
            "UI : Personnalisation des symboles de notation (Cercle, Carré, Étoile, etc.) via l'onglet Apparence.",
            "Correction : Optimisation visuelle des symboles (mode vide/plein) pour une meilleure lisibilité.",
            "UI : Ajout d'une alerte visuelle de décalage de version lors de l'importation de fichiers.",
            "Maintenance : Refonte chirurgicale du module d'Import/Export (découpage en composants et extraction de la logique métier).",
            "Sécurité : Protection contre les sauvegardes corrompues avec fallback automatique vers l'état initial sain."
        ]
    },
    {
        version: "2.2.0",
        date: "01/02/2026 10:45",
        type: 'minor',
        changes: [
            "Performance : Optimisation majeure des re-rendus React.",
            "Architecture : Séparation du CharacterContext en État (données) et Actions (fonctions) pour une meilleure fluidité.",
            "Stabilité : Stabilisation des fonctions de modification (useCallback + Functional Updates) pour éviter les calculs inutiles.",
            "Optimisation : Mémoïsation des composants de section (Attributs, Compétences, Combat, Compteurs) via React.memo."
        ]
    },
    {
        version: "2.1.0",
        date: "01/02/2026 10:20",
        type: 'minor',
        changes: [
            "Architecture : Refactorisation structurelle majeure pour améliorer la maintenabilité.",
            "Code : Extraction de la logique métier (calculs de bonus, mode création) dans des Custom Hooks dédiés (useCharacterBonuses, useCreationMode).",
            "Organisation : Réorganisation des composants UI (migration de DotRating vers le dossier dédié).",
            "Performance : Séparation de la logique de calcul de la couche de présentation (JSX) pour une meilleure clarté."
        ]
    },
    {
        version: "2.0.5",
        date: "31/01/2026 23:15",
        type: 'patch',
        changes: [
            "UI : Remplacement du sélecteur d'orientation textuel par des icônes géométriques explicites.",
            "Visual : Utilisation de RectangleHorizontal (Paysage) et RectangleVertical (Portrait) pour indiquer le mode actuel."
        ]
    },
    {
        version: "2.0.4",
        date: "31/01/2026 21:58",
        type: 'patch',
        changes: [
            "UI : Simplification du bouton de gestion des données (Sauvegarde/Chargement).",
            "Visual : Suppression du label textuel pour ne conserver que les icônes, allégeant la barre de navigation."
        ]
    },
    {
        version: "2.0.3",
        date: "31/01/2026 21:55",
        type: 'patch',
        changes: [
            "UI : Mise à jour de l'icône du bouton de sauvegarde.",
            "Visual : Ajout de l'icône 'Download' (Import) à côté de la 'Disquette' (Sauvegarde) pour mieux signifier la double fonction du menu."
        ]
    },
    {
        version: "2.0.2",
        date: "31/01/2026 21:40",
        type: 'patch',
        changes: [
            "Navigation : Ajustement de la disposition des boutons.",
            "Visual : Le séparateur gauche est déplacé entre le sélecteur de vue et le bouton 'Fiche de Personnage'.",
            "Ergonomie : Le bouton d'impression est regroupé avec les outils (Historique, Aide) pour une meilleure logique visuelle."
        ]
    },
    {
        version: "2.0.1",
        date: "31/01/2026 21:35",
        type: 'patch',
        changes: [
            "Navigation : Réorganisation de la barre supérieure. Le bouton 'Fiche de Personnage' est désormais à gauche.",
            "Visual : Le nom du personnage est centré de manière absolue pour une symétrie parfaite.",
            "UI : Renommage du bouton 'Fiche' en 'Fiche de Personnage' pour plus de clarté."
        ]
    },
    {
        version: "2.0.0",
        date: "31/01/2026 20:30",
        type: 'major',
        changes: [
            "Architecture : Migration complète vers React/Vite et adoption du pattern Context API pour une meilleure gestion d'état et des performances accrues.",
            "Visual : Nouvelle identité 'Jeu de Rôle' avec des composants d'interface texturés (Boutons, Modales, Panneaux).",
            "Navigation : Interface modernisée conservant l'ergonomie classique mais construite sur une architecture modulaire.",
            "Technique : Structure de projet standardisée (`src/`) et optimisation du build en fichier unique pour une portabilité maximale."
        ]
    },
    {
        version: "1.9.53",
        date: "27/01/2026 18:00",
        type: 'minor',
        changes: [
            "Ergonomie : Séparation contextuelle des menus de Sauvegarde/Chargement.",
            "Joueur : En vue 'Fiche', le menu est simplifié (Sauvegarder/Charger le personnage uniquement) pour plus de clarté.",
            "MJ : En vue 'Configurer', le menu complet (Système, Templates, Bibliothèques) reste accessible pour la gestion avancée.",
            "Correction Visuelle : Ajustement de l'alignement des colonnes dans le tableau de Réputation (Page 2)."
        ]
    },
    {
        version: "1.9.52",
        date: "27/01/2026 17:00",
        type: 'patch',
        changes: [
            "Technique : Refactoring complet de la structure des types TypeScript. Découpage du fichier monolithique `types.ts` en modules spécialisés (primitives, system, campaign, character).",
            "Technique : Mise en place du pattern 'Barrel File' pour assurer la rétrocompatibilité des imports."
        ]
    },
    {
        version: "1.9.51",
        date: "27/01/2026 16:00",
        type: 'minor',
        changes: [
            "Amélioration : La Réserve de Compétences est désormais pré-remplie par défaut avec l'ensemble des compétences de la fiche.",
            "Migration : Lors de la mise à jour, les compétences de votre fiche actuelle sont automatiquement ajoutées à la réserve si celle-ci était vide."
        ]
    },
    {
        version: "1.9.50",
        date: "27/01/2026 15:00",
        type: 'patch',
        changes: [
            "Bibliothèque : Ajout d'une aide contextuelle listant les codes de catégories pour les compétences.",
            "Bibliothèque : Remplacement de l'alerte native de suppression par une fenêtre de confirmation stylisée et sécurisée.",
            "Amélioration de l'interface utilisateur pour la gestion des compétences de réserve."
        ]
    },
    {
        version: "1.9.49",
        date: "27/01/2026 14:15",
        type: 'patch',
        changes: [
            "Bibliothèque : Ajout d'une fenêtre de confirmation stylisée pour l'importation des compétences depuis la fiche, remplaçant les alertes natives du navigateur.",
            "Technique : Migration du système de notification vers un 'Context React' pour garantir la stabilité et éviter les erreurs lors des interactions complexes."
        ]
    },
    {
        version: "1.9.48",
        date: "27/01/2026 12:30",
        type: 'major',
        changes: [
            "Introduction de la Réserve de Compétences : un espace pour stocker des compétences personnalisées non utilisées.",
            "Nouvelle vue 'Bibliothèque' regroupant les Traits (Avantages/Désavantages) et les Compétences.",
            "Configuration de la fiche : Ajout d'une barre latérale pour glisser-déposer des compétences depuis la réserve vers la fiche, et inversement pour les archiver."
        ]
    },
    {
        version: "1.9.47",
        date: "27/01/2026 11:00",
        type: 'patch',
        changes: [
            "Ajustement mineur de texte dans la fenêtre d'activation du Mode Création : 'Slots de Rangs' devient simplement 'Rangs'."
        ]
    },
    {
        version: "1.9.46",
        date: "27/01/2026 10:30",
        type: 'minor',
        changes: [
            "Refonte du Mode Création : Nouvelle interface HUD en bas d'écran, plus claire et informative.",
            "Création : Ajout de jauges visuelles pour le suivi des budgets (Attributs, Compétences, Arrière-plans).",
            "Création : Système de validation amélioré avec rapport d'erreurs détaillé avant confirmation."
        ]
    },
    {
        version: "1.9.45",
        date: "26/01/2026 18:45",
        type: 'patch',
        changes: [
            "Correction : Le mode création incrémente désormais correctement la 'Valeur de Création' (le socle gratuit) en plus de la valeur courante.",
            "Visuel : Les points acquis à la création s'affichent désormais avec une couleur distincte (Bleu roi) par rapport aux points XP (Gris foncé).",
            "Configuration : Ajout d'un sélecteur de couleurs dans l'onglet 'Apparence' des paramètres pour personnaliser ces deux types de points."
        ]
    },
    {
        version: "1.9.44",
        date: "26/01/2026 17:30",
        type: 'minor',
        changes: [
            "Ajout du système de 'Carte' automatique (Valet, Dame, Roi) basé sur la moyenne des meilleures compétences.",
            "Configuration : Options pour activer/désactiver le calcul de la Carte et ajuster ses seuils dans les paramètres."
        ]
    },
    {
        version: "1.9.43",
        date: "26/01/2026 16:00",
        type: 'patch',
        changes: [
            "Optimisation de l'affichage mobile pour la barre de navigation.",
            "Correction mineure sur l'affichage des bonus d'attributs."
        ]
    },
    {
        version: "1.9.42",
        date: "26/01/2026 14:00",
        type: 'major',
        changes: [
            "Implémentation du système d'effets pour les Traits (Avantages/Désavantages).",
            "Les traits peuvent désormais accorder automatiquement des bonus d'XP, des bonus d'Attributs ou des rangs de compétence gratuits.",
            "Mise à jour du calculateur d'XP pour prendre en compte les bonus issus des traits."
        ]
    },
    {
        version: "1.9.41",
        date: "25/01/2026 11:30",
        type: 'minor',
        changes: [
            "Ajout d'options de configuration pour la méthode de création (Par Rangs ou Par Points/XP).",
            "Possibilité de définir des budgets XP séparés (Attributs, Compétences, Arrière-plans) ou un pot commun.",
            "Refonte visuelle de la fenêtre de paramètres."
        ]
    }
];
