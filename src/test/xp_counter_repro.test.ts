/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect } from 'vitest';
import { CharacterSheetData, RulesData } from '../types';
import { RuleCalculationsService } from '../services/RuleCalculationsService';

describe('XP Cost Calculation for Custom Counters', () => {

    const rules: RulesData = {
        definitions: {
            counters: {
                'volonte': { id: 'volonte', name: 'Volonté', max: 10, xpCost: 5, defaultValue: 3 },
                // 'sang' is NOT in definitions (simulating custom library counter not yet in system definitions)
            },
            skillCategories: []
        },
        libraries: {
            counters: [
                // Library counter with XP Cost
                { id: 'lib_sang', name: 'Sang', maxValue: 10, defaultValue: 0, xpCost: 10, isGlobal: true }
            ],
            skills: [],
            backgrounds: [],
            traits: [],
            specializations: []
        },
        configurations: {
            xpCosts: { attributeFactor: 6, skillFactor: 1, specializationFactor: 0 },
            creation: { backgroundCost: 2 }
        }
    } as any;

    const baseData: CharacterSheetData = {
        counters: {
            // Case 1: Standard System Counter
            'volonte': { id: 'volonte', name: 'Volonté', value: 3, creationValue: 3 },

            // Case 2: Custom Counter linked to Library by ID
            'lib_sang': { id: 'lib_sang', name: 'Sang', value: 0, creationValue: 0 },

            // Case 3: Custom Counter linked to Library by Name (ID mismatch/Generated)
            'gen_123': { id: 'gen_123', name: 'Sang', value: 0, creationValue: 0, max: 10 }
        },
        skills: {
            // Empty categories
            'talents': [], 'competences': [], 'connaissances': [],
            'competences_col_2': [], 'autres_competences': [], 'autres': [],
            'Col_Comp_1': [], 'Col_Comp_2': [], 'Col_Comp_3': [], 'Col_Comp_4': [],
            'Col_Comp_5': [], 'Col_Comp_7': [], 'competences2': [], 'Col_Comp_6': [],
            'arrieres_plans': [], 'Col_Comp_8': []
        },
        experience: { gain: "0", spent: "0", rest: "0" },
        creationConfig: { active: false },
        page2: {
            avantages: [],
            desavantages: [],
            // Add other page2 properties if necessary, but these seem to be the ones causing crash
            notes: "",
            background: "",
            description: ""
        }
    } as any;

    it('should calculate cost for System Counter (Volonté)', () => {
        const data = JSON.parse(JSON.stringify(baseData));
        // Increase from 3 to 4. Cost = 5.
        data.counters['volonte'].value = 4;

        const result = RuleCalculationsService.calculateExperienceResults(data, rules);
        // Expect 5
        expect(Number(result.spent)).toBe(5);
    });

    it('should calculate cost for Custom Library Counter (Matched by ID)', () => {
        const data = JSON.parse(JSON.stringify(baseData));
        // Increase Sang from 0 to 1. Cost = 10.
        data.counters['lib_sang'].value = 1;

        const result = RuleCalculationsService.calculateExperienceResults(data, rules);
        // Expect 10 (Sang)
        expect(Number(result.spent)).toBe(10);
    });

    it('should calculate cost for Custom Library Counter (Matched by Name)', () => {
        const data = JSON.parse(JSON.stringify(baseData));
        // Increase Sang (gen_123) from 0 to 1. 
        // Logic should find Library Definition via Name "Sang". Cost = 10.
        data.counters['gen_123'].value = 1;

        const result = RuleCalculationsService.calculateExperienceResults(data, rules);
        // Expect 10
        expect(Number(result.spent)).toBe(10);
    });

    it('should CALCULATE cost if counter is in custom array (Fix)', () => {
        const data = JSON.parse(JSON.stringify(baseData));
        const customCounter = { id: 'custom_1', name: 'Sang', value: 1, creationValue: 0, max: 10 };
        data.counters = {
            custom: [
                customCounter
            ]
        };

        const result = RuleCalculationsService.calculateExperienceResults(data, rules);

        // Fix expectation: Expected 10 (Sang Cost) because we rely on name matching 'Sang' -> Library 'Sang' (cost 10).
        // If logic works, it finds 'lib_sang' via Name match on 'Sang'.
        expect(Number(result.spent)).toBe(10);
    });

    it('should return 0 if no library definition found (Unknown ID/Name)', () => {
        const data = JSON.parse(JSON.stringify(baseData));
        // 'Mana' does not exist in definitions or library
        data.counters['mana'] = { id: 'mana', name: 'Mana', value: 1, creationValue: 0, max: 10 };

        const result = RuleCalculationsService.calculateExperienceResults(data, rules);
        // Expect 0
        expect(Number(result.spent)).toBe(0);
    });
});

