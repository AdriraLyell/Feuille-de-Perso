# Audit - État des Lieux & Roadmap (Synthèse v2.49.3)

> **Dernière mise à jour** : 2026-02-14 — Version 2.49.3

## 1. Phases Complétées

### ✅ Phase 1 à 10 : Infrastructures & Code Health (v2.49.2)
*Voir historique pour le détail des implémentations CI/CD, Cloud Sync, et Typage.*

### ✅ Phase 12 : Typage & Stabilité (v2.49.5)
- [x] **Import/Export** : Typage strict de `importExportUtils.ts` (any → Partial<CharacterSheetData>) et refactoring de `ImportPanel`.
- [x] **Migrations** : Correction des types dans `index.ts` (RulesData, Legacy Maps).
- [x] **Skills Editor** : Typage complet des props et callbacks (useSkillsEditorActions).
- [x] **Campagne & Base de Données** : Typage amélioré pour `CampaignService` et `DatabaseService`.

## 2. Issues Restantes & Roadmap

### 🔶 Issue 4.1 — `console.log` directs (PARTIELLE)
- **15 occurrences** de `console.*` directs restantes (hors logger).
- Logger conditionnel `src/utils/logger.ts` adopté dans les composants critiques (CharacterReadOnlyView, etc.).

**Score global : 12/15 corrigés, 3 restants (4.1-partiel, 4.2, 4.3)**

### 🔶 Issue 4.2 — Typage `any`/`@ts-ignore` (EN COURS)
- **~15 `as any`** + **~25 `@ts-ignore`** en production. Baisse significative.
- Phase A, B, D & H complétées. Correction massive sur import/export et migrations. 
- Phases C & E restantes : types layout, handlers admin.

### 🔶 Issue 4.3 — Fichiers volumineux (EN COURS)
- **Récemment optimisés** : `SkillsEditor` (479→156L), `ImportPanel` (440→150L).
- **Fichiers volumineux restants** :
  - `admin/components/Adven..` ? À vérifier.
  - Aucun fichier > 400 lignes identifié comme critique pour l'instant.

### ✅ Issue 5.1 — Variables CSS (CORRIGÉE)
- Bloc `:root` consolidé dans `src/index.css` avec 14 variables de couleur et 6 de dimension.
- Élimination des "valeurs magiques" (rgba, hex) au profit des variables CSS.

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
