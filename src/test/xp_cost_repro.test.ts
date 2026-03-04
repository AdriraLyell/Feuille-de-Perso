
import { describe, it, expect } from 'vitest';
import { CharacterSheetData, RulesData } from '../types';
import { RuleCalculationsService } from '../services/RuleCalculationsService';

describe('XP Cost & Blocking Reproduction', () => {

    const mockRules: RulesData = {
        definitions: {
            counters: {
                'volonte': { id: 'volonte', name: 'Volonté', max: 10, xpCost: 5, defaultValue: 3 }, // Cost 5
                'sante': { id: 'sante', name: 'Santé', max: 10, xpCost: 0, defaultValue: 7 }    // Blocked (Cost 0)
            },
            skillCategories: []
        },
        configurations: {
            xpCosts: { attributeFactor: 6, skillFactor: 1, specializationFactor: 0 }
        }
    } as any;

    const mockData: CharacterSheetData = {
        counters: {
            'volonte': { id: 'volonte', name: 'Volonté', value: 3, creationValue: 3 },
            'sante': { id: 'sante', name: 'Santé', value: 7, creationValue: 7 }
        },
        skills: {
            // Add standard categories to avoid undefined errors in fallback
            'talents': [], 'competences': [], 'connaissances': [],
            'competences_col_2': [], 'autres_competences': [], 'autres': [],
            'Col_Comp_1': [], 'Col_Comp_2': [], 'Col_Comp_3': [], 'Col_Comp_4': [], 'Col_Comp_5': [], 'Col_Comp_7': [],
            'competences2': [], 'Col_Comp_6': [],
            'arrieres_plans': [], 'Col_Comp_8': []
        },
        experience: { gain: "0", spent: "0", rest: "0" },
        creationConfig: { active: false }, // Standard Mode
        page2: { avantages: [], desavantages: [] }
    } as any;

    it('should calculate XP cost correctly when counter increases', () => {
        // User increases Volonté from 3 to 4
        // Should cost (4-3) * 5 = 5 XP.

        const data = JSON.parse(JSON.stringify(mockData));
        data.counters['volonte'].value = 4;

        const result = RuleCalculationsService.calculateExperienceResults(data, mockRules);

        // This test checks if the SERVICE works (which we suspect it does).
        // If this passes, the issue is likely in the UI/Data passing.
        expect(parseInt(result.spent)).toBe(5);
    });

    // We can't easily test React Component logic (UI blocking) in unit tests without rendering.
    // But we can verify if the SERVICE returns 0 cost for the blocked one.

    it('should return 0 XP cost for blocked counter (sanity check)', () => {
        const data = JSON.parse(JSON.stringify(mockData));
        // Suppose UI allowed update
        data.counters['sante'].value = 8;

        const result = RuleCalculationsService.calculateExperienceResults(data, mockRules);
        expect(parseInt(result.spent)).toBe(0);
    });
});
