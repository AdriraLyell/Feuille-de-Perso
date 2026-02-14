# Audit - État des Lieux & Roadmap (Synthèse v2.49.0)

> **Dernière mise à jour** : 2026-02-14 — Version 2.49.0

## 1. Phases Complétées

### ✅ Phase 1 : Documentation & Fondations (v2.40.2)
- [x] Création de `functional_scope.md`, `db_schema.md`.
- [x] Correction du crash critique du Changelog.

### ✅ Phase 2 : Qualité & Typage (v2.41.0)
- [x] **DatabaseService** : Typage strict via `Partial<T>`.
- [x] **rulesReconciler** : Éradication des `as any` du reconciler principal.
- [x] **GitHub API** : Unification du rate-limiting (`GithubRateLimiter`).
- [x] **UI Constants** : Centralisation dans `src/constants/theme.ts`.
- [x] **Tests Unitaires** : Tests pour `RulesContext` et `CharacterContext`.

### ✅ Phase 3 : Migration Supabase & RLS (v2.42.0)
- [x] Row Level Security implémenté sur toutes les tables.
- [x] Migration vers Settings multi-campagnes.
- [x] Ownership (`created_by`) sur les personnages.

### ✅ Phase 4 : Refactoring & Sécurité (v2.43.x)
- [x] Extraction `CharacterSheet.tsx` (788→478 lignes), hooks `useCloudSync`, `useAdminRulesHandler`.
- [x] `LibraryImportWizard`, `CampaignNotes`, `TraitLibrary` refactorisés.
- [x] Sécurité admin : mot de passe oublié, auto-logout inactivité (30 min).
- [x] Nettoyage dépendances, `dotenv` en devDep.

### ✅ Phase 5 : UX Polish & Responsive (v2.45.x)
- [x] Tri-state filters sur bibliothèques admin.
- [x] Safeguards suppression skills/backgrounds en mode création.
- [x] Design responsive mobile + navigation diégétique.
- [x] Nettoyage racine : 12 fichiers de débris supprimés.

### ✅ Phase 6 : Journal Grimoire & Sommaire (v2.48.6)
- [x] **Moteur CSS Native Columns** : Remplacement de PaginationPlus par une approche ultra-performante basée sur les colonnes CSS.
- [x] **Sommaire Dynamique** : Table des matières interactive avec navigation par clic.
- [x] **Migration v2** : Passage automatique des anciennes notes vers le format BookDocument Tiptap.
- [x] **Pagination Dynamique** : Reflow instantané et nettoyage automatique des pages vides.
- [x] **Affichage Spreads** : Toujours par paires de pages pour respecter l'esthétique grimoire.
- [x] **Navigation Intelligente** : Masquage contextuel des flèches et suppression du ghost shift.
- [x] **Thème Parchemin** : Unification graphique (#fbf4e9) Journal + PartyTable.

### ✅ Phase 7 : UX Images & Outils (v2.48.x)
- [x] **Pan & Scan** : Outil de recadrage interne pour les images (positionnement X/Y).
- [x] **Redimensionnement** : Poignées interactives et magnétisme (25%, 50%, 100%).
- [x] **Habillage Texte** : Support du flow textuel autour des images (float left/right).
- [x] **Mode Cover/Contain** : Choix du mode d'affichage pour les images.

### ✅ Phase 8 : Image Cloud Sync & Optimisation (v2.49.0)
- [x] **Cloud Sync** : Synchronisation des images (Grimoire & Portraits) vers Supabase.
- [x] **Compression** : Pipeline WebP (50%) + GZIP avant envoi.
- [x] **Cache IndexedDB** : Gestion intelligente du cache local et décompression à la volée.
- [x] **Architecture** : Résolution automatique des IDs locaux/distants (ImageSyncResolver).

### ✅ Phase 9 : CI/CD & Branching Strategy (v2.49.0)
- [x] **Branching** : GitHub Flow+ (main + develop + feature branches).
- [x] **CI Pipeline** : Nouveau workflow `ci.yml` pour branches non-production.
- [x] **E2E en CI** : Tests Playwright intégrés aux deux pipelines (ci + deploy).
- [x] **PR Template** : Template standardisé en français (`.github/pull_request_template.md`).
- [x] **Nettoyage** : Suppression de la branche legacy `Mise-en-Ligne`.
### ✅ Phase 10 : Code Health & Typing (v2.49.1)
- [x] **Refactoring Admin** : `AdminSkillsEditor` typé strictement.
- [x] **Hooks** : `useCharacterSheetActions` nettoyé (`DropPayload` interface).
- [x] **Types** : `BookDocument` (id/dates), `DBTrait` (JSONB strict).
- [x] **Extraction** : `reconcileSkillsAndBackgrounds` isolé dans `skillsReconciler.ts`.

## 2. Issues Restantes & Roadmap

### 🔶 Issue 4.1 — `console.log` directs (PARTIELLE)
- **24 occurrences** de `console.*` directs restantes (hors logger).
- Logger conditionnel `src/utils/logger.ts` créé et majoritairement adopté.

### 🔶 Issue 4.2 — Typage `any`/`@ts-ignore` (EN COURS)
- **35 `as any`** + **38 `@ts-ignore`** en production. Baisse significative sur les fichiers admin.
- Phase A & B complétées.
- Phases C-E restantes : types DB fetches, layout.
- Plan détaillé dans `docs/PLAN_ISSUES_MOYENNES.md`.

### 🔶 Issue 4.3 — Fichiers volumineux (PARTIELLE)
- Fichiers refactorisés : `CharacterSheet` (788→478), `CreationHUD` (537→168), `LibraryView` (528→409).
- **Nouveaux fichiers à traiter** :
  - `CharacterReadOnlyView.tsx` (427 lignes, 34.5 KB)
  - `SpecializationLibrary.tsx` (462 lignes, 28.2 KB)
  - `SkillsEditor.tsx` (413 lignes, 22.9 KB)
  - `ImportPanel.tsx` (389 lignes, 22.2 KB)
  - `AdminDashboard.tsx` (359 lignes, 21.5 KB)
  - `CreationConfigEditor.tsx` (320 lignes, 21.3 KB)

### 🔶 Issue 5.1 — Variables CSS (OUVERTE)
- Couleurs et dimensions hardcodées dans `index.css`.
- Bloc `:root` avec CSS custom properties non créé.

### 💡 Suggestions QoL
- **Logs de Production** : Généraliser l'usage du `logger.ts` typé (24 `console.*` restants).
- **Quota IndexedDB** : Améliorer le feedback visuel lors du dépassement de quota.
- **Constantes** : Fusionner `src/constants.ts` dans `src/constants/app.ts` à terme.
- **Dépendance inutile** : `tiptap-pagination-plus` est toujours dans `package.json` mais n'est plus importé dans le code. À retirer.

## 3. Documents Archivés (v2.49.0)

| Document | Raison | Date |
|----------|--------|------|
| `AUDIT_CAMPAIGN_NOTES.md` | Résolu — Architecture "poupées russes" supprimée, ancien journal remplacé par ColumnarEditor | 2026-02-14 |
| `AUDIT_PAGINATION.md` | Résolu — Moteur CSS Columns natif en production, PaginationPlus abandonné | 2026-02-14 |
| `plan_editeur_livre.md` | Supercédé par `PLAN_LIVRE_NUMERIQUE.md` | 2026-02-14 |

---
*Référence historique complète : `docs/archive/`*
