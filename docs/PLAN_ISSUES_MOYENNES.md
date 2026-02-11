# Plan : Résolution des Issues Audit (Sections 4 & 5)

> **Dernière mise à jour** : 2026-02-11 — Post-vérification

---

## Bilan actuel

### Section 4 — Issues Hautes

| # | Issue | Statut | Détails |
|---|-------|--------|---------|
| 4.1 | 60+ console.log | **CORRIGÉ** | Logger conditionnel `src/utils/logger.ts`, ~20 appels directs restants |
| 4.2 | 77+ `any` / 27 `@ts-ignore` | **NON CORRIGÉ** | 168 `any`, 55 `@ts-ignore` (a empiré avec le nouveau code admin) |
| 4.3 | Fichiers trop gros | **PARTIEL** | CharacterSheet 788→478, LibraryView 528→409, mais rulesReconciler 492→546 |
| 4.4 | Promises non gérées | **CORRIGÉ** | try/catch/finally sur GlobalPlayersView et autres |
| 4.5 | Rate-limiting GitHub | **CORRIGÉ** | 50 appels/heure via sessionStorage |
| 4.6 | Placeholder Supabase | **CORRIGÉ** | Throw immédiat si env vars manquantes |
| 4.7 | Qualité image agressive | **CORRIGÉ** | Harmonisé à 0.8 / 0.85 |

### Section 5 — Issues Moyennes

| # | Issue | Statut | Détails |
|---|-------|--------|---------|
| 5.1 | Valeurs magiques | **PARTIEL** | `constants/db.ts` + `constants.ts` créés, mais couleurs CSS non extraites |
| 5.2 | Duplication bibliothèques | **CORRIGÉ** | Pas de vraie duplication (rôles distincts) |
| 5.3 | dotenv en prod | **CORRIGÉ** | Déplacé en devDependencies |
| 5.4 | Sync multi-onglets | **CORRIGÉ** | `storage` event listener dans useExpertMode |
| 5.5 | JSDoc manquant | **CORRIGÉ** | JSDoc ajouté sur reconcileRulesWithState et services |
| 5.6 | Quota IndexedDB | **CORRIGÉ** | `checkStorageQuota()` + catch QuotaExceededError |
| 5.7 | Mot de passe / auto-logout | **CORRIGÉ** | Reset password + hook useIdleTimeout (30 min) |
| 5.8 | Docs RLS | **CORRIGÉ** | `docs/RLS_POLICIES.md` complet |

**Score global : 12/15 corrigés, 3 restants (4.2, 4.3, 5.1-CSS)**

---

## Plan détaillé : Issue 4.2 — Éradication des `any` et `@ts-ignore`

### État actuel

- **168 occurrences** de `: any` / `as any`
- **55 occurrences** de `@ts-ignore`
- Types DB déjà créés dans `src/types/database.ts` mais **sous-utilisés**

### Catégorisation des occurrences

| Catégorie | Count | Cause racine |
|-----------|-------|--------------|
| A. Accès dynamique aux propriétés (skills/counters) | ~20 | `@ts-ignore` pour accès `state.skills[key]` |
| B. Mapping DB snake_case → camelCase | ~15 | `(row as any).field_name` dans LibraryMapper |
| C. Handlers d'événements génériques | ~15 | `value: any` dans les éditeurs admin |
| D. Fetch DB non typés | ~15 | `fetchAll<any>(...)` dans LibraryLoader/Importer |
| E. Layout (colonnes/blocs) | ~10 | `as any[]` dans useSheetLayout, `as any` dans CharacterSheet |
| F. JSONB Postgres brut | ~8 | `configurations: Record<string, any>` dans DBGameSetting |
| G. Logger variadic | ~4 | `(...args: any[])` — **acceptable, ne pas toucher** |
| H. Fixtures de test | ~45+ | `} as any` — **acceptable, ne pas toucher** |

### Phase A : Types d'accès dynamique aux skills/counters

**Problème** : `state.skills` est typé `Record<string, DotEntry[]>` mais TS ne peut pas inférer que `key` est une clé valide → `@ts-ignore`.

**Fichiers** : `src/utils/rulesReconciler.ts` (6 @ts-ignore), `src/hooks/useCharacterSheetActions.ts` (3 as any)

**Solution** : Créer des helpers typés dans `src/utils/stateAccessors.ts` :

```typescript
import { CharacterSheetData, DotEntry } from '../types';

/** Accès typé aux skills par catégorie dynamique */
export function getSkillCategory(
    state: CharacterSheetData,
    categoryId: string
): DotEntry[] {
    return (state.skills as Record<string, DotEntry[]>)[categoryId] || [];
}

/** Mutation typée d'une catégorie de skills */
export function setSkillCategory(
    state: CharacterSheetData,
    categoryId: string,
    entries: DotEntry[]
): void {
    (state.skills as Record<string, DotEntry[]>)[categoryId] = entries;
}

/** Accès typé aux counters par clé dynamique */
export function getCounter(
    state: CharacterSheetData,
    key: string
): any {
    return (state.counters as Record<string, unknown>)[key];
}
```

**Fichiers à modifier** :
| Fichier | Lignes concernées | Remplacement |
|---------|-------------------|--------------|
| `src/utils/rulesReconciler.ts` | 168-169, 324-325, 397-398, 416-417, 424 | `getSkillCategory()` / `setSkillCategory()` |
| `src/hooks/useCharacterSheetActions.ts` | 52, 219-220 | `getCounter()` |

### Phase B : Enrichir les types DB pour le mapping

**Problème** : `LibraryMapper.ts` utilise `(t as any).type`, `(s as any).is_variable` car les interfaces DB de `database.ts` ne reflètent pas tous les champs réels des tables Supabase.

**Fichier à modifier** : `src/types/database.ts`

Champs manquants à ajouter :

```typescript
// DBTrait — ajouter :
type?: string;           // 'avantage' | 'desavantage'
tags?: string[];
is_variable?: boolean;
effects?: TraitEffect[];

// DBSkill — ajouter :
is_variable?: boolean;
default_min_level?: number;

// DBBackground — ajouter :
is_variable?: boolean;
```

Après enrichissement, remplacer dans `src/services/library/LibraryMapper.ts` :
- `(t as any).type` → `t.type`
- `(t as any).tags` → `t.tags`
- `(s as any).is_variable` → `s.is_variable`
- etc. (9 occurrences)

### Phase C : Typer les handlers d'événements admin

**Problème** : `value: any` dans les callbacks de mise à jour.

**Approche** : Utiliser des unions discriminées ou `RulesCounterDefinition[K]` pour le type de retour.

| Fichier | Ligne | Avant | Après |
|---------|-------|-------|-------|
| `AdminCountersEditor.tsx` | 14 | `value: any` | `value: RulesCounterDefinition[typeof field]` |
| `AdminCreationEditor.tsx` | 18, 47 | `value: any` | `value: string \| number \| boolean` |
| `AdminSkillsEditor.tsx` | 108 | `Partial<any>` | `Partial<SkillCategoryDefinition>` |
| `AdminSkillsEditor.tsx` | 120 | `behavior: any` | `behavior: string` |
| `JournalPage.tsx` | 13 | `value: any` | `value: CampaignNoteEntry[typeof field]` |
| `PartyTable.tsx` | 143 | `value: any` | `value: string \| Record<string, string>` |
| `AdminTraitLibrary.tsx` | 262 | `value: any` | `value: TraitEffect[typeof field]` |

**Technique** : Pour les handlers génériques avec `keyof T` :
```typescript
const handleUpdate = <K extends keyof RulesCounterDefinition>(
    id: string, field: K, value: RulesCounterDefinition[K]
) => { ... };
```

### Phase D : Typer les fetch DB

**Problème** : `DatabaseService.fetchAll<any>('libraries_traits', ...)` ignore les types.

**Fichiers** : `LibraryLoader.ts` (~12), `LibraryImporter.ts` (~10)

**Solution** : Remplacer `<any>` par les types DB existants :

| Appel actuel | Type correct |
|-------------|-------------|
| `fetchAll<any>('libraries_traits', ...)` | `fetchAll<DBTrait>(...)` |
| `fetchAll<any>('libraries_skills', ...)` | `fetchAll<DBSkill>(...)` |
| `fetchAll<any>('libraries_specializations', ...)` | `fetchAll<DBSpecialization>(...)` |
| `fetchAll<any>('libraries_backgrounds', ...)` | `fetchAll<DBBackground>(...)` |
| `fetchAll<any>('libraries_counters', ...)` | `fetchAll<DBCounter>(...)` |
| `fetchAll<any>('rel_setting_traits', ...)` | `fetchAll<RelSettingTrait>(...)` |
| `fetchAll<any>('rel_setting_skills', ...)` | `fetchAll<RelSettingSkill>(...)` |
| etc. | etc. |

Les types existent déjà dans `src/types/database.ts`, il suffit de les importer et utiliser.

### Phase E : Typer le layout (useSheetLayout + CharacterSheet)

**Problème** : `useSheetLayout.ts` ligne 35-36 utilise `as any[]` pour les blocs, et `CharacterSheet.tsx` ligne 216 cast le retour `as any`.

**Solution** : Ajouter des interfaces dans `src/hooks/useSheetLayout.ts` :

```typescript
interface SkillBlock {
    title: string;
    items: DotEntry[];
    cat: string;
    description?: string;
}

interface SheetColumn {
    id: number;
    topBlocks: SkillBlock[];
    bottomBlocks: SkillBlock[];
    readonly blocks: SkillBlock[];
}

interface SheetLayout {
    columns: SheetColumn[];
    columnCount: number;
    backgrounds: SkillBlock[];
    counters: { title: string; id: string; description?: string }[];
}
```

Puis typer le retour de `getDynamicColumns` : `(...): SheetLayout`.

**Fichiers à modifier** :
- `src/hooks/useSheetLayout.ts` — Ajouter les interfaces, typer `columns` et le retour
- `src/components/CharacterSheet.tsx` — Supprimer `as any` ligne 216, typer les `.map()` (lignes 273-381)

### Phase F : JSONB Postgres — Ne pas toucher

Les champs `configurations: Record<string, any>` et `definitions: Record<string, any>` dans `DBGameSetting` sont **justifiés** : le contenu JSONB est flexible par nature. Les toucher nécessiterait de typer l'intégralité du schéma JSONB, ce qui est hors scope.

### Ordre d'implémentation recommandé

1. **Phase B** (types DB) — Prérequis pour D
2. **Phase D** (fetch typés) — Applique les types de B
3. **Phase E** (layout) — Indépendant, fort impact visuel sur CharacterSheet
4. **Phase A** (accesseurs skills/counters) — Élimine les @ts-ignore du reconciler
5. **Phase C** (handlers admin) — Le plus mécanique mais dispersé

### Résultat attendu

| Catégorie | Avant | Après | Réduction |
|-----------|-------|-------|-----------|
| A. Accès dynamique | ~20 | 0 | -20 |
| B. Mapping DB | ~15 | 0 | -15 |
| C. Handlers admin | ~15 | 0 | -15 |
| D. Fetch DB | ~15 | 0 | -15 |
| E. Layout | ~10 | 0 | -10 |
| F. JSONB (ignoré) | ~8 | ~8 | 0 |
| G. Logger (ignoré) | ~4 | ~4 | 0 |
| H. Tests (ignoré) | ~45 | ~45 | 0 |
| **Total** | **~168+55** | **~57** | **~-75%** |

---

## Plan détaillé : Issue 4.3 — Réduction de rulesReconciler.ts

### État actuel

- **546 lignes**, 7 fonctions (6 internes + 1 export)
- `reconcileSkillsAndBackgrounds` = **271 lignes (49.6% du fichier)**
- Les 5 autres fonctions font 31-43 lignes chacune
- **11 tests** répartis dans 5 fichiers, tous importent uniquement `reconcileRulesWithState`

### Structure actuelle

```
reconcileRulesWithState (L531-546, 16 lignes, EXPORT)
├── reconcileConfigurations      (L16-55,   40 lignes)
├── reconcileAttributes          (L64-106,  43 lignes)
├── reconcileSecondaryAttributes (L114-144, 31 lignes)
├── reconcileSkillsAndBackgrounds(L158-428, 271 lignes) ← EXTRACTION
├── reconcileCounters            (L437-477, 41 lignes)
└── reconcileTraits              (L486-519, 34 lignes)

Aucune dépendance croisée entre sous-fonctions.
```

### Plan d'extraction

**Nouveau fichier** : `src/utils/reconcilers/skillsReconciler.ts`

Extraire `reconcileSkillsAndBackgrounds` tel quel, avec ses imports nécessaires :
- `CharacterSheetData`, `DotEntry` depuis `../../types`
- `RulesData` depuis `../../types/rules`
- `generateId` depuis `../factories`
- `normalizeString` depuis `../stringUtils`
- (Post phase A) `getSkillCategory`, `setSkillCategory` depuis `../stateAccessors`

**Fichier modifié** : `src/utils/rulesReconciler.ts`

```typescript
// Remplacer la fonction inline par un import
import { reconcileSkillsAndBackgrounds } from './reconcilers/skillsReconciler';
```

### Découpage interne de reconcileSkillsAndBackgrounds

Le fichier extrait contient 2 phases logiques distinctes qui seront séparées en fonctions internes nommées :

```typescript
// src/utils/reconcilers/skillsReconciler.ts

/** Phase 1 : Traitement des compétences par catégorie (L158-329) */
function processSkillCategories(
    newState: CharacterSheetData,
    currentState: CharacterSheetData,
    rules: RulesData
): Record<string, DotEntry[]> { ... }

/** Phase 2 : Traitement des arrière-plans + déduplication (L331-428) */
function processBackgrounds(
    newState: CharacterSheetData,
    currentState: CharacterSheetData,
    rules: RulesData,
    newSkills: Record<string, DotEntry[]>
): void { ... }

/** Export — Orchestrateur skills+backgrounds */
export function reconcileSkillsAndBackgrounds(
    newState: CharacterSheetData,
    currentState: CharacterSheetData,
    rules: RulesData
): void {
    const newSkills = processSkillCategories(newState, currentState, rules);
    processBackgrounds(newState, currentState, rules, newSkills);
}
```

### Résultat attendu

| Fichier | Avant | Après |
|---------|-------|-------|
| `src/utils/rulesReconciler.ts` | 546 | ~283 (-48%) |
| `src/utils/reconcilers/skillsReconciler.ts` | — | ~280 (nouveau) |

### Tests

Aucun test à modifier : tous importent `reconcileRulesWithState` depuis `rulesReconciler.ts`, qui continue d'appeler `reconcileSkillsAndBackgrounds` via import.

---

## Issue 5.1 (restant) — Variables CSS

**Fichier** : `src/index.css`
**Risque** : Faible

Ajouter un bloc `:root` avec les 7 couleurs et 6 dimensions, puis remplacer les valeurs hardcodées dans le même fichier. Détail déjà couvert dans la version précédente de ce plan.

---

## Ordre global d'implémentation

| Étape | Contenu | Dépendances |
|-------|---------|-------------|
| 1 | Phase B (types DB dans `database.ts`) | Aucune |
| 2 | Phase D (fetch typés dans LibraryLoader/Importer) | Étape 1 |
| 3 | Phase E (types layout dans useSheetLayout + CharacterSheet) | Aucune |
| 4 | Phase A (helpers `stateAccessors.ts`) | Aucune |
| 5 | Issue 4.3 (extraction reconcileSkillsAndBackgrounds) | Étape 4 |
| 6 | Phase C (handlers admin typés) | Aucune |
| 7 | Issue 5.1 CSS variables | Aucune |
| 8 | Versioning + build + tests | Toutes |

---

## Grille de vérification

| Étape | Vérification |
|-------|-------------|
| 1-2 (types DB + fetch) | `npm run build` sans erreur TS |
| 3 (layout) | Build + vérification visuelle portrait/paysage |
| 4-5 (accesseurs + reconciler) | `npm test` — les 11 tests de réconciliation passent |
| 6 (handlers) | Build + test manuel des éditeurs admin |
| 7 (CSS) | Build + vérification visuelle des couleurs |
| 8 (version) | Build final + `npm test` complet |

---

## Résumé des risques

| Étape | Risque | Fichiers | Effort |
|-------|--------|----------|--------|
| 1 - Types DB | Aucun | 1 | 15 min |
| 2 - Fetch typés | Faible | 2 | 30 min |
| 3 - Layout types | Faible | 2 | 30 min |
| 4 - State accessors | Faible | 3 | 30 min |
| 5 - Extraction reconciler | Moyen | 3 | 45 min |
| 6 - Handlers admin | Faible | 7 | 1h |
| 7 - CSS vars | Faible | 1 | 15 min |
