# Audit - État des Lieux & Roadmap (Synthèse v2.75.0)

> **Dernière mise à jour** : 2026-02-23 — Version 2.75.0

## 1. Phases Complétées

### ✅ Phase 37 : Notifications Temps Réel (v2.75.0)
- [x] **Infrastructure** : Activation de `supabase_realtime` sur les tables `game_settings` et `characters`.
- [x] **Client Engine** : Création de `RealtimeService` pour la gestion des abonnements WebSocket isolés.
- [x] **React Integration** : Création du hook `useRealtimeSync` avec protection offline et debounce de 500ms.
- [x] **Featurability** : Propagation instantanée des changements de calendrier (MJ) et des mises à jour de fiches (MJ → Joueur) sans refresh.
- [x] **Feedback** : Notifications automatiques via le système `addLog` existant.


### ✅ Phase 36 : Chroniqueur & Narrative Enhancements (v2.68.0)
- [x] **UI Control** : Possibilité de masquer/afficher le Chroniqueur (widget temporaire) depuis la barre latérale pour libérer de l'espace visuel.
- [x] **Narrative Sections** : Support des heures précises pour les blocs 'Moment' et des dates pour les 'Flashbacks'.
- [x] **Navigation** : Interaction entre les blocs narratifs et le Chroniqueur (clic sur l'icône calendrier affiche le widget).
- [x] **Flexibilité** : Adaptation automatique des sélecteurs de date selon le type de calendrier (Réel/Fiction).

### ✅ Phase 35 : Fusion Chroniqueur & Journal (v2.67.1)
- [x] **Renommage** : Le Compagnon Temporel devient le **Chroniqueur**.
- [x] **Ergonomie** : Déplacement des flèches de navigation pour éviter les chevauchements et formatage des dates en JJ/MM/AAAA.
- [x] **Intégration** : Synchronisation des dates du journal avec la timeline du calendrier.

### ✅ Phase 34 : Calcul d'âge flexible & Verrouillage Calendrier (v2.65.4)
- [x] **Bug Fix** : Support des formats de date français (DD/MM/YYYY) et fictifs pour le calcul automatique de l'âge.
- [x] **Data Integrity** : Verrouillage automatique des champs 'Début' et 'Date Fiction' sur la fiche personnage si un calendrier de campagne est actif (MJ-controlled).
- [x] **Shared Components** : Amélioration de `HeaderInput` pour supporter l'état `readOnly` et les infobulles contextuelles.

### ✅ Phase 33 : Synchronisation du Calendrier (v2.65.3)
- [x] **Mécanique** : Réconciliation automatique des dates de l'en-tête avec les paramètres de campagne du MJ.
- [x] **Robustesse** : Déclenchement de la réconciliation basé sur la version et le timestamp de mise à jour des règles.

### ✅ Phase 32 : Correction du pavé fantôme 'PAVE_ATTRIBUTS_4' (v2.64.2)
- [x] **Bug Fix** : L'attributeSettings est désormais reconstruit proprement depuis les attributs primaires, éliminant l'apparition d'un 4ème pavé erroné lors d'un reset.
- [x] **Sécurité** : Ajout d'un filtre défensif sur les attributs secondaires pour ignorer les données orphelines.
- [x] **Nettoyage** : Suppression des clés superflues dans l'état initial des fiches.

### ✅ Phase 31 : Correction du reset du compteur de Confiance (v2.64.1)
- [x] **Bug Fix** : Nettoyage des doublons historiques et renforcement de l'unicité des clés de compteurs basées sur l'ID.
- [x] **Robustesse** : Amélioration du `campaignReconciler` pour assurer une synchronisation stable même en cas de collisions de noms.

### ✅ Phase 30 : Effet de trait 'Maître' (v2.64.0)
- [x] **Mécanique** : Nouvel effet `master_skill` permettant de porter une compétence au rang 5 gratuitement.
- [x] **UI** : Wizard de sélection de compétence et affichage thématique violet dans l'admin.
- [x] **Moteur XP** : Adaptation de `xpCalculator` pour ignorer le coût des compétences maîtrisées.

### ✅ Phase 29 : Persistance et Nettoyage des Bibliothèques (v2.63.0)
- [x] **Bug Fix** : Résolution du problème des compteurs/traits supprimés qui réapparaissaient au rafraîchissement.
- [x] **Mécanique** : Implémentation d'un nettoyage automatique des "items orphelins" dans les tables de référence globales lors de la synchronisation.
- [x] **Robustesse** : Migration vers une gestion fine de `is_active` dans les tables de relations (rel_setting_...) pour préserver les items désactivés sans polluer le dépôt de référence.
- [x] **Optimisation** : Détection ciblée des items désengagés pour minimiser les appels à la base de données.

### ✅ Phase 28 : Détails d'usage avancés (v2.62.9)
- [x] **Composant** : Création de `UsageLockedTooltip` pour afficher les campagnes et personnages verrouillant un item.
- [x] **Optimisation** : Chargement à la demande (hover) via le hook `useItemUsageDetails`.
- [x] **Intégration** : Déploiement sur toutes les bibliothèques MJ (Traits, Compétences, Historiques, Compteurs, Mysticisme, Spécialisations).

### ✅ Phase 27 : Compteur Auto & Nommage Intelligent (v2.59.0)
- [x] **Renommage** : Migration sémantique de `trait_counter` vers `auto_counter` pour une meilleure généralisation.
- [x] **Option C** : Le nom de base est désormais optionnel. Fallback automatique sur le nom du trait ou la variante si vide.
- [x] **Refactoring** : Nettoyage final des références obsolètes dans l'interface d'administration.

### ✅ Phase 26 : Compteurs de Traits Dynamiques (v2.58.0)
- [x] **Éphémère** : Les compteurs liés aux traits sont désormais instanciés uniquement sur la fiche du Héro.
- [x] **Traits Variables** : Le nom du compteur s'adapte automatiquement avec le format `[Nom de Base] ([Variante])`.
- [x] **Propreté MJ** : Suppression de la pollution de la Bibliothèque de compteurs côté Administrateur.

### ✅ Phase 25 : Intégration des Compteurs de Traits (v2.57.0)
- [x] **Mécanique** : Création du type d'effet `trait_counter` reliant dynamiquement traits et compteurs.
- [x] **Automatisation** : Création/Suppression automatique des compteurs associés sur la fiche lors de l'ajout/retrait de traits.
- [x] **UI/UX** : Implémentation du mode d'affichage `squares_only` (cases à cocher uniquement) pour une interface compacte.
- [x] **Administration** : Gestion automatisée de la bibliothèque (verrouillage des compteurs liés, création auto lors de l'édition de traits).
- [x] **Typage & Schémas** : Mise à jour de `TraitEntrySchema` et des types `primitives.ts` pour supporter le lien persistant (`associatedCounterId`).
- [x] **Qualité** : Validation complète du build et de la conformité TypeScript.

### ✅ Phase 1 à 10 : Infrastructures & Code Health (v2.49.2)
*Voir historique pour le détail des implémentations CI/CD, Cloud Sync, et Typage.*

### ✅ Phase 12 : Typage & Stabilité (v2.49.15)
- [x] **Import/Export** : Typage strict de `importExportUtils.ts` (any → Partial<CharacterSheetData>) et refactoring de `ImportPanel`.
- [x] **Migrations** : Correction des types dans `index.ts` (RulesData, Legacy Maps).
- [x] **Skills Editor** : Typage complet des props et callbacks (useSkillsEditorActions).
- [x] **Campagne & Base de Données** : Typage amélioré pour `CampaignService` et `DatabaseService`.
- [x] **Admin Library** : Éradication des `any` et `@ts-ignore` dans les composants `AdminTraitLibrary`, `AdminBackgroundLibrary`, `AdminCounterLibrary`.
- [x] **Event Handlers Génériques** : Typage strict des mises à jour complexes (`keyof T`) dans les éditeurs Admin.
- [x] **Constantes** : Réorganisation de `src/constants.ts` vers `src/constants/app.ts` pour une meilleure maintenance.
- [x] **Accessibilité Admin** : Correction des erreurs d'accessibilité (labels, boutons) bloquant la CI dans `AttributePresetManager`, `LoginScreen`, `DuplicateSettingModal`.

### ✅ Phase 13 : Stabilité E2E & CI (v2.49.22)
- [x] **Workflows GitHub** : Optimisation turbo (cache, suppression des doublons, exécution sur build de production).
- [x] **Tests E2E** : Migration des tests vers le nouveau Grimoire Digital (TiPTap + CSS Columns) et correction des sélecteurs de démarrage.
- [x] **Performance CI** : Réduction du temps de run de ~3 minutes grâce au cache Playwright.

### ✅ Phase 14 : Hygiène & Logging (v2.56.34)
- [x] **Racine Propre** : Déplacement des scripts utilitaires vers `/scripts` et archivage des SQL temporaires vers `docs/archive/sql/`.
- [x] **Logging System** : Migration des derniers reliquats de `console.*` directs vers le `logger` applicatif (xpCalculator, useCloudSyncCheck, SyncModal, StorageMonitor, ReadOnlyPortrait).
- [x] **Purge Logs** : Suppression des fichiers volumineux de logs ESLint à la racine.

### ✅ Phase 15 : Refactorisation Admin (v2.56.35)
- [x] **Découpage Bibliothèques** : Extraction des composants `Item` (Skill, Background, Mystic, Counter) dans des fichiers dédiés.
- [x] **Maintenance** : Réduction drastique de la taille des fichiers sources critiques (gain ~150 lignes/fichier).

## 2. Issues Restantes & Roadmap

### ✅ Issue 4.1 — `console.log` directs (COMPLÉTÉE)
- Migration systématique vers `src/utils/logger.ts`.

**Score global : 14/15 corrigés, 1 restant (4.1-partiel/4.3)**

### Phase 14 : Nettoyage & Refactoring (Audit v2.49.32) - [RÉSOLU]
- **Type Safety** : Remplacement de `any` par des types stricts dans `factories.ts` et `ColumnarEditor.tsx`.
- **Dette Technique** : Suppression de `tiptap-pagination-plus`.
- **Refactoring** : Extraction de 300+ lignes de `ColumnarEditor.tsx` dans `useColumnarNavigation.ts` et `useColumnarDrawing.ts`.
- **Hygène** : Suppression des imports et variables inutilisés dans les composants Admin.
- **Résultat** : Build OK, types stricts, structure plus maintenable.

### Phase 15 : Refactoring AdminTraitLibrary (Audit v2.49.33) - [RÉSOLU]
- **Refactoring** : Extraction de la logique métier (250+ lignes) de `AdminTraitLibrary.tsx` vers `useAdminTraitLibrary.ts`.
- **Résultat** : Réduction drastique de la taille du fichier (517 -> 240 lignes), séparation claire des préoccupations (UI vs Logique).

### Phase 16 : Modularisation de useAttributeEditor (Audit v2.49.34) - [RÉSOLU]
- **Refactoring** : Éclatement d'un hook mastodonte (380+ lignes) en trois hooks spécialisés.
- **Hooks créés** : `useAttributeStructure.ts` (manipulation structurelle) et `useAttributePresets.ts` (gestion DB des presets).
- **Résultat** : Code plus lisible, typé et plus facilement testable. Réduction de la dette technique sur le segment "Attributs".

### Phase 17 : Refactoring CampaignService (Audit v2.49.35) - [RÉSOLU]
- **Refactoring** : Extraction de la logique de réconciliation complexe (synchronisation règles/bibliothèques) vers `campaignReconciler.ts`.
- **Résultat** : `CampaignService.ts` est désormais plus léger et se concentre sur les appels DB. La logique métier est isolée et testable.

### Phase 18 : Fix Regression ColumnarEditor (Audit v2.49.36) - [RÉSOLU]
- **Bug Fix** : Ajout d'une garde `if (!editor)` pour éviter les `TypeError` au premier rendu.
- **Résultat** : Stabilité restaurée sur l'éditeur de livre du grimoire.

### Phase 19 : Refactoring RuleCalculationsService (Audit v2.49.37) - [RÉSOLU]
- **Refactoring** : Extraction des blocs de calcul d'XP et de Tarot vers `xpCalculator.ts` et `cardCalculator.ts`.
- **Résultat** : `RuleCalculationsService.ts` réduit à une simple façade (~30 lignes). Logique métier isolée et testable.

---
*Dernière mise à jour : 19 Février 2026 - v2.56.20*

### ✅ Phase 24 : Refactorisation de ColumnarEditor (Audit v2.56.20) - [RÉSOLU]
- **Refactoring** : Éclatement d'un composant massif (670+ lignes) en sous-composants spécialisés.
- **Composants créés** : `BookEditorToolbar.tsx`, `BookPageBackground.tsx`, `BookChapterSidebar.tsx`, `ColumnarEditorStyles.tsx`.
- **Résultat** : Réduction drastique de la taille de `ColumnarEditor.tsx` (~670 -> ~280 lignes). Amélioration de la lisibilité et séparation claire UI vs Logique. Suppression du CSS inline au profit d'un composant de style dédié.
- **Maintenance** : Mise à jour des imports et validation du build de production.

### ✅ Phase 23 : Personnalisation des Bibliothèques & UI (Audit v2.49.87) - [RÉSOLU]
- **Modularité** : Harmonisation visuelle des indicateurs de surcharge (icône Cyan `PencilLine` unifiée).
- **Flexibilité** : Déverrouillage de l'édition globale pour les compétences ayant des surcharges locales.
- **Sécurité** : Verrouillage strict de la suppression pour les éléments utilisés dans des campagnes (Correction bug de suppression accidentelle).
- **Fiabilité** : Correction du bug de "Reset" via la capture automatique de la `masterDefinition` lors de l'édition.
- **Stabilité React** : Éradication des avertissements de console liés aux valeurs `null` dans les éléments `select`.
- **Résultat** : Un système de bibliothèque hybride (Global vs Local) totalement fonctionnel, robuste et sans avertissements console.


### ✅ Phase 22 : Santé CI & Typage Strict (Audit v2.49.71) - [RÉSOLU]
- **CI/CD** : Restauration de l'intégrité du workflow GitHub suite à des erreurs de typage sur les nouvelles fonctionnalités.
- **Typage** : Correction des types optionnels dans `RecreationService.ts` et `AttributeBlock.tsx`.
- **Linting** : Élimination des erreurs `no-extra-boolean-cast` bloquant le build automatique.
- **Résultat** : Workflow CI repassé au vert (Type Check & Lint OK).

### ✅ Phase 21 : Recréation de Personnage (Audit v2.49.68) - [RÉSOLU]
- **Logique métier** : Création de `RecreationService.ts` pour liquider la progression en XP (remboursement auto).
- **Administration** : Intégration de l'action \"Recréer\" dans `GlobalPlayersView.tsx` avec signal de mise à jour forcé.
- **UI/UX** : Création de `RecreationModal.tsx` avec bilan financier (XP) et avertissements thématiques.
- **Accessibilité** : Mise à jour de `ConfirmationModal.tsx` pour supporter des messages riches (ReactNode).
- **Résultat** : Les MJs peuvent désormais autoriser un \"Respec\" complet tout en préservant l'investissement en temps (XP) du joueur.


### ✅ Phase 20 : Correction des Tooltips Portals (Audit v2.49.40) - [RÉSOLU]
- **Correction UI** : Résolution du tronquage des tooltips provoqué par `overflow: hidden` et `overflow-y: auto`.
- **Composant** : Création de `PortalTooltip.tsx` utilisant `ReactDOM.createPortal`.
- **Migration** : Mise à jour de `TraitCard.tsx`, `AdminSkillLibrary.tsx` et `AdminBackgroundLibrary.tsx` pour utiliser le système de portail.
- **Résultat** : Tooltips toujours visibles, positionnés intelligemment (flip top/bottom) et centrés horizontalement.

### ✅ Issue 4.2 — Typage `any`/`@ts-ignore` (CORRIGÉE)
- **Typage strict** généralisé sur la fiche joueur et l'administration.
- Phases A à E complétées. Plus de `@ts-ignore` bloquants ou de `any` injustifiés en production.

### ✅ Issue 4.3 — Fichiers volumineux (CORRIGÉE/STABILISÉE)
- **Récemment optimisés (v2.56.35)** : `AdminSkillLibrary` (508→370L), `AdminBackgroundLibrary` (450→318L), `AdminMysticLibrary` (404→300L), `AdminCounterLibrary` (359→280L).
- **Précédemment** : `SkillsEditor` (479→156L), `ImportPanel` (440→150L).
- Aucun fichier critique de logique pure > 400 lignes.

### ✅ Issue 5.1 — Variables CSS (CORRIGÉE)
- Bloc `:root` consolidé dans `src/index.css` avec 14 variables de couleur et 6 de dimension.
- Élimination des "valeurs magiques" (rgba, hex) au profit des variables CSS.

### 💡 Suggestions QoL
- **Logs de Production** : Généraliser l'usage du `logger.ts` typé (24 `console.*` restants).
- **IndexedDB Quota** : Améliorer le feedback visuel lors du dépassement de quota (Prochaine étape).
- **Nettoyage Dépendances** : Retirer `tiptap-pagination-plus` (Inutilisé).

## 3. Documents Archivés (v2.49.0)

| Document | Raison | Date |
|----------|--------|------|
| `AUDIT_CAMPAIGN_NOTES.md` | Résolu — Architecture "poupées russes" supprimée, ancien journal remplacé par ColumnarEditor | 2026-02-14 |
| `AUDIT_PAGINATION.md` | Résolu — Moteur CSS Columns natif en production, PaginationPlus abandonné | 2026-02-14 |
| `plan_editeur_livre.md` | Supercédé par `PLAN_LIVRE_NUMERIQUE.md` | 2026-02-14 |

---
*Référence historique complète : `docs/archive/`*
