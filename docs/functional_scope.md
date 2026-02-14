# Périmètre Fonctionnel - Feuille de Perso (v2.49.0)

## 1. Vision & Architecture

L'application est un gestionnaire de feuilles de personnages de jeu de rôle orienté **Performance** et **Robustesse**.

### Architecture "Hybrid Database Engine"
- **Online First** : L'application tente de charger les configurations et les personnages depuis Supabase (PostgreSQL).
- **Offline Fallback** : Fonctionnement garanti sans connexion via `default_rules.json` (Joueur) et export statique `rules.json` (Admin).
- **Synchronisation** : Les joueurs peuvent synchroniser leurs fiches vers le Cloud pour que le MJ (Admin) puisse les consulter.

### Architecture Image "3-Tier"
- **Tier 1 (Local)** : IndexedDB via `imageDB.ts` (portraits et images grimoire).
- **Tier 2 (Compression)** : WebP (50%) + GZIP avant synchronisation (`ImageCompressionService.ts`).
- **Tier 3 (Cloud)** : Résolution automatique local↔distant (`ImageSyncResolver.ts`).

## 2. Rôles & Accès

- **Joueur** :
    - Création et édition de personnages.
    - Accès aux bibliothèques publiques.
    - Synchronisation vers le Cloud (manuelle ou auto-sync 10s).
    - Journal de campagne (grimoire personnel).
    - Notes de groupe (tableau collaboratif).

- **Administrateur (MJ)** :
    - Gestion multi-campagnes (Settings) avec duplication et archivage.
    - Éditeurs complets : Attributs, Compétences, Traits, Backgrounds, Counters, Spécialisations.
    - Configuration de création de personnage (budgets, coûts, modes Points/Rangs).
    - Assistant d'import (`LibraryImportWizard`) pour migration de données depuis fiches existantes.
    - Consultation des fiches joueurs synchronisées en lecture seule (`CharacterReadOnlyView`).
    - Vue globale des joueurs de toutes campagnes (`GlobalPlayersView`).
    - Outils de déploiement des règles vers GitHub (`DeployModal`, `DeploymentMonitor`).
    - Publication des règles en ligne.

## 3. Fonctionnalités Clés

### Éditeur de Personnage
- Mode direct (édition libre) ou mode création avec budgets configurables (Points XP ou Rangs).
- Fiche multi-pages : En-tête, Attributs, Compétences, Combat, Biographie, Spécialisations, Suivi XP.
- Jauge visuelle temps-réel du budget de création (`BudgetGauge`).
- Validation modale de la création (`CreationValidationModal`).

### Gestionnaire de Bibliothèque
- Définition d'éléments globaux ou spécifiques à une campagne.
- Réserve Universelle : Système de variantes globales pour les Traits et Compétences, partagées entre campagnes.

### Grimoire (Éditeur de Livre)
- Éditeur riche Tiptap avec pagination CSS Columns native.
- Chapitres avec date et signets, navigation par sommaire dynamique auto-généré.
- Images avec redimensionnement (poignées magnétiques), recadrage (pan & scan), habillage texte (float), filtres.
- Affichage double-page (spreads) avec navigation par flèches.
- Composants : `ColumnarEditor`, `BookImageView`, `ChapterHeaderView`, `BookTableOfContents`.

### Notes de Groupe
- Tableau collaboratif (`PartyTable`) avec colonnes dynamiques.
- Suivi des membres du groupe (personnage, joueur, données personnalisées).

### Synchronisation Cloud
- Sync manuelle ou auto-sync (debounce 10s) vers Supabase.
- Compression images (WebP + GZIP, réduction 70-85%).
- Résolution automatique des IDs locaux/distants (`ImageSyncResolver`).
- Résolution de conflits (modal de comparaison).

### Système de Cartes
- Calcul automatique de cartes (Valet, Dame, Roi) basé sur les compétences.

### Réconciliation
- Mise à jour automatique des fiches existantes lors du changement des règles.
- Préservation des choix du joueur tout en injectant les nouvelles définitions.

### Import / Export
- Export JSON complet avec images compressées.
- Import depuis fichier ou depuis le Cloud.
- Résolution de conflits lors de l'import.

### Système de Migration
- Migration automatique des données (V1 legacy → V2 bookDocument).
- Registre centralisé (`registry.ts`), migrations incrémentales, version schéma trackée.
- L'ancien format `campaignNotes[]` est préservé (rollback possible).
