# Task: Implement Mystic Abilities HUD

## Automate Formula Migration

- [x] Analyze current mechanical effects and formula system
- [x] Automate migration in `migrateRulesToV2`
    - [x] Detect legacy `attribute_bonus`, `xp_bonus`, `counter_max_bonus`
    - [x] Convert to global formula dictionary entries
    - [x] Link formulas back to trait effects
- [x] Update Zod schema to support `formulas` library
- [x] Implement database persistence for formulas
    - [x] Create `libraries_formulas` and `rel_setting_formulas` tables
    - [x] Update `LibraryPersistence.ts` to support formula UPSERT
    - [x] Update `LibraryLoader.ts` to support formula loading
- [x] Clean up and refinement
    - [x] Remove manual migration UI in Admin dashboard
    - [x] Increment version to `2.81.0`
    - [x] Update changelog
- [x] Documentation and verification
    - [x] Create `walkthrough.md`
    - [x] Verify final build stateion
  - [x] Version bump (2.56.47) & changelog update
