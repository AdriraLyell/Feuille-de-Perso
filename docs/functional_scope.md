# Périmètre Fonctionnel - Feuille de Perso

## 1. Vision & Architecture
L'application est un gestionnaire de feuilles de personnages de jeu de rôle orienté **Performance** et **Robustesse**.

### Architecture "Hybrid Database Engine"
- **Online First** : L'application tente de charger les configurations et les personnages depuis Supabase (PostgreSQL).
- **Offline Fallback** : Fonctionnement garanti sans connexion via `default_rules.json` (Joueur) et export statique `rules.json` (Admin).
- **Synchronisation** : Les joueurs peuvent synchroniser leurs fiches vers le Cloud pour que le MJ (Admin) puisse les consulter.

## 2. Rôles & Accès
- **Joueur** :
    - Création et édition de personnages.
    - Accès aux bibliothèques publiques.
    - Synchronisation vers le Cloud (optionnel).
- **Administrateur (MJ)** :
    - Gestion de plusieurs campagnes (Settings).
    - Édition des bibliothèques (Skills, Traits, Backgrounds, Counters).
    - Consultation des joueurs synchronisés.
    - Publication des règles en ligne.

## 3. Fonctionnalités Clés
- **Éditeur de Personnage** : Mode direct ou mode création avec budgets (Points/Rangs).
- **Gestionnaire de Bibliothèque** : Définition d'éléments globaux ou spécifiques à une campagne.
- **Journal de Campagne** : Bloc-notes riche avec support d'images.
- **Système de Cartes** : Calcul automatique de cartes (Valet, Dame, Roi) basé sur les compétences.
- **Réconciliation** : Mise à jour automatique des fiches existantes lors du changement des règles.
