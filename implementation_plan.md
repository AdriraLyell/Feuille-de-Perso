# Implementation Plan: Formula System Unification (Final Migration)

The formula system is mostly implemented, but existing global rules in the database have not been migrated. The migration script `migrateFormulas.ts` is only applied to character sheets (`CharacterSheetData`), not to the global campaign rules (`RulesData`). This plan details the final steps to complete the migration.

## Proposed Changes

### 1. `src/utils/migrations/index.ts`
We need to ensure that when campaign rules (`RulesData`) are loaded or migrated to v2, any legacy effects inside the `libraries.traits` are converted to 'formula' types. We will extract the logic from `migrateFormulas.ts` to be reusable and apply it within `migrateRulesToV2`.

#### [MODIFY] [index.ts](file:///d:/Projet%20JdR/feuille-de-perso/src/utils/migrations/index.ts)
- Import the logic from `migrateFormulas`.
- Inside `migrateRulesToV2`, after ensuring `rules.libraries.traits` exists, loop through the traits and apply the transformation: `attribute_bonus`, `counter_max_bonus`, and `xp_bonus` -> `formula`. This ensures the Admin interface sees them as raw (orphan) formulas.

### 2. `src/admin/components/creation/AdminFormulasEditor.tsx`
The migration tool in the Admin interface currently only detects 'formula' effects that lack a `formulaId`. We must update it to be aware of the legacy types (`attribute_bonus`, `counter_max_bonus`, `xp_bonus`) so the DM can migrate them directly if the rules haven't been forcibly migrated yet, or handle the orphaned ones.

#### [MODIFY] [AdminFormulasEditor.tsx](file:///d:/Projet%20JdR/feuille-de-perso/src/admin/components/creation/AdminFormulasEditor.tsx)
- Update `orphanCount` to count all effects of type 'formula' without 'formulaId', AND effects of type 'attribute_bonus', 'counter_max_bonus', 'xp_bonus'.
- Update `autoMigrateFormulas` to handle these legacy types:
  - If `attribute_bonus`, convert value to formula string (`value.toString()`).
  - If `counter_max_bonus`, convert value to formula string (`${value} * TRAIT_LEVEL`).
  - If `xp_bonus`, convert based on method: `per_scenario` -> `${value} * SCENARIOS_COUNT`, else `${value}`. Target becomes `XP`.
- Create a global formula entry for each unique equation.
- Mutate the trait effect to be type `formula` and link `formulaId` to the newly created global entry.

### 3. Verification
Verify that loading the campaign rules automatically transforms legacy quantitative traits, and that checking the Admin Formula Editor presents the user with the number of required formulas to migrate. Clicking the link should successfully append these formulas and convert trait effects.
