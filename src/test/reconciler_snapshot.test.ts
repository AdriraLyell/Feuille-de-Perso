
import { describe, it, expect } from 'vitest';
import { reconcileRulesWithState } from '../utils/rulesReconciler';
import { INITIAL_DATA } from '../data/initialState';
import { RulesData } from '../types/rules';
import { CharacterSheetData, DotEntry } from '../types';

describe('RulesReconciler Snapshot', () => {
    it('should reconcile complex rules changes correctly', () => {
        // 1. Setup Initial State with some non-zero values to test preservation
        const state: CharacterSheetData = JSON.parse(JSON.stringify(INITIAL_DATA));

        // Set values to ensure they are preserved
        state.attributes.pave_attributs_1[0].val1 = "3"; // Force -> 3
        state.skills.Col_Comp_1[0].value = 2; // Vigilance -> 2
        state.skills.Col_Comp_1[0].creationValue = 2;

        // Add a skill that will be removed from definitions
        // (It's already in INITIAL_DATA: Cuisine at index 14 of Col_Comp_1)
        state.skills.Col_Comp_1[14].value = 1; // Cuisine -> 1

        // Add a counter value
        (state.counters.volonte as unknown as DotEntry).value = 5;

        // 2. Define New Rules
        const newRules: RulesData = {
            version: "2.0.0",
            settingId: "snapshot_test_setting",
            lastUpdated: 123456789,
            configurations: {
                global: { maxAttributeScore: 5, maxSkillScore: 5, secondaryAttributes: true },
                creation: {
                    mode: 'rangs',
                    startingXP: 100,
                    rankSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                    attributePoints: 10,
                    attributeMin: 1,
                    attributeMax: 5,
                    backgroundPoints: 5
                },
                xpCosts: { attributeFactor: 5, skillFactor: 2, specializationFactor: 1, traitCost: 5 },
                cards: { active: false, baseStart: 0, increment: 0, bestSkillsCount: 0, ranks: [], counts: [], maxLabel: '' }
            },
            definitions: {
                attributes: {
                    pave_attributs_1: ['Puissance', 'Constitution', 'Dextérité', 'Agilité', 'Nouvel Attribut']
                    // 'Force' renamed to 'Puissance', 'Nouvel Attribut' added
                },
                secondaryAttributes: {},
                skillCategories: [
                    { id: 'Col_Comp_1', label: 'Général', behavior: 'Compétence', allowSpecializations: true, costConfig: { factor: 1, type: 'linear' } },
                    { id: 'Col_Comp_8', label: 'Historiques', behavior: 'Arrière-plan', allowSpecializations: false, costConfig: { factor: 1, type: 'linear' } },
                    { id: 'Col_Comp_9', label: 'Compteurs', behavior: 'Compteur', allowSpecializations: false, costConfig: { factor: 1, type: 'linear' } }
                ],
                skills: {
                    'Col_Comp_1': ['Attention', 'Repérage', 'T.O.C', 'Athlétisme'],
                    // 'Vigilance' -> 'Attention' (via same index/logic? No, name matching usually. Let's see if Reconciler handles rename via ID or just Name matching. Code says Name matching mostly)
                    // If Name matching, 'Vigilance' (val=2) will become an orphan if not matched.
                    // Wait, Reconciler doesn't handle Renames automatically unless IDs match. 
                    // Let's test standard behavior: "Vigilance" is absent from new definitions. "Attention" is new.

                    'Col_Comp_8': ['Alliés', 'Ressources', 'Nouveau Background'],
                    'Col_Comp_9': ['Volonté de Fer'] // Renamed from Volonté
                },
                backgrounds: ['Alliés', 'Ressources', 'Nouveau Background'],
                counters: {
                    'volonte': { id: 'volonte', name: 'Volonté de Fer', max: 10, xpCost: 5 }, // ID match should preserve value
                    'mana': { id: 'mana', name: 'Mana', max: 10, xpCost: 3, defaultValue: 2 }
                },
                labels: {}
            },
            libraries: {
                traits: [], skills: [], backgrounds: [], counters: [], specializations: [], mysticAbilities: []
            }
        };

        // 3. Run Reconciliation
        const result = reconcileRulesWithState(state, newRules);

        // 4. Assertions

        // Metadata
        expect(result._rulesVersion).toBe("2.0.0");
        expect(result.syncInfo?.settingId).toBe("snapshot_test_setting");

        // Attributes
        // "Force" (id matches?) Reconciler usually tries to match by Name first or Order?
        // Code: "existing = existingEntries.find(e => e.name === name...)"
        // So "Puissance" will be a NEW attribute (val=0). "Force" will be in 'remainingAttributes' if it was preserved?
        // Code: "remainingAttributes = existingEntries.filter(...)". 
        // So Force (val=3) should be preserved in the list of attributes for pave_attributs_1?
        // Let's check the result structure.
        const attrNames = result.attributes.pave_attributs_1.map(a => a.name);
        expect(attrNames).toContain('Puissance');
        expect(attrNames).toContain('Nouvel Attribut');

        // If Force is preserved, it should be there too
        const force = result.attributes.pave_attributs_1.find(a => a.name === 'Force');
        expect(force?.val1).toBe("3");

        // Skills
        // 'Vigilance' (val=2) is not in 'Col_Comp_1' definition explicitly.
        // It shoud be preserved as an orphan in Col_Comp_1 because value > 0.
        const vigilance = result.skills.Col_Comp_1.find(s => s.name === 'Vigilance');
        expect(vigilance).toBeDefined();
        expect(vigilance?.value).toBe(2);

        // 'Cuisine' (val=1) -> Not in definitions. Should be preserved.
        const cuisine = result.skills.Col_Comp_1.find(s => s.name === 'Cuisine');
        expect(cuisine).toBeDefined();
        expect(cuisine?.value).toBe(1);

        // 'Tenir Alcool' (val=0) -> Not in definitions. Should be REMOVED.
        const tenirAlcool = result.skills.Col_Comp_1.find(s => s.name === 'Tenir Alcool');
        expect(tenirAlcool).toBeUndefined(); // Assuming existingEntries.filter keeps only value > 0

        // Counters
        // 'Volonte' (id='volonte', name='Volonté') -> matched by ID 'volonte' in definitions.counters
        // Update name to 'Volonté de Fer'.
        // Preserve value 5.
        // Counter logic: "existing = currentState.counters[key]"
        const volonte = result.counters['volonte'] as DotEntry;
        expect(volonte).toBeDefined();
        expect(volonte.name).toBe('Volonté de Fer');
        expect(volonte.value).toBe(5);

        // 'Mana' -> New
        const mana = result.counters['mana'] as DotEntry;
        expect(mana).toBeDefined();
        expect(mana.name).toBe('Mana');
        expect(mana.value).toBe(2); // defaultValue
    });
});
