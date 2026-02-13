# Audit - État des Lieux & Roadmap (Synthèse v2.48.0)

> **Dernière mise à jour** : 2026-02-13T19:55 — Version 2.48.0

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

### ✅ Phase 6 : Moteur Journal 'Columnar' (v2.47.0)
- [x] **Moteur CSS Native Columns** : Remplacement de PaginationPlus par une approche ultra-performante basée sur les colonnes CSS.
- [x] **Pagination Dynamique** : Reflow instantané et nettoyage automatique des pages vides.
- [x] **Affichage Spreads** : Toujours par paires de pages pour respecter l'esthétique grimoire.
- [x] **Navigation Intelligente** : Masquage contextuel des flèches et suppression du ghost shift.
- [x] **Thème Parchemin** : Unification graphique (#fbf4e9) Journal + PartyTable.

## 2. Issues Restantes & Roadmap

### 🔶 Issue 4.1 — `console.log` directs (PARTIELLE)
- **24 occurrences** de `console.*` directs restantes (hors logger).
- Logger conditionnel `src/utils/logger.ts` créé et majoritairement adopté.

### 🔶 Issue 4.2 — Typage `any`/`@ts-ignore` (OUVERTE)
- **26 `as any`** + **35 `@ts-ignore`** en production (hors tests/fixtures).
- Phase A complétée (`stateAccessors.ts` créé).
- Phases B-E restantes : types DB, handlers admin, fetch typés, layout.
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

---
*Référence historique : `docs/archive/`*
