
import { ChangelogEntry } from '../types';

export const CHANGELOG: ChangelogEntry[] = [
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
