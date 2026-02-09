import { describe, it, expect } from 'vitest';
import { RuleCalculationsService } from '../services/RuleCalculationsService';
import { CharacterSheetData } from '../types';
import { RulesData } from '../types/rules';

describe('Counter Cost Verification', () => {
    it('should calculate non-zero XP cost for counters if xpCost is set in rules', () => {
        const rules: RulesData = {
            definitions: {
                skillCategories: [
                    { id: 'cat_counter', label: 'Compteurs', behavior: 'Compteur', costConfig: { factor: 1, type: 'linear' } }
                ],
                skills: {
                    'cat_counter': ['Volonté']
                },
                counters: {
                    'volonte': { id: 'volonte', name: 'Volonté', max: 10, xpCost: 10 }
                },
                labels: {}
            },
            configurations: {
                global: { secondaryAttributes: false },
                creation: { backgroundCost: 2 },
                xpCosts: { attributeFactor: 6, skillFactor: 1, specializationFactor: 0.5 }
            }
        } as any;

        const data: CharacterSheetData = {
            skills: {
                'cat_counter': [
                    { id: 'volonte', name: 'Volonté', value: 3, creationValue: 0 }
                ]
            },
            counters: {
                'volonte': { id: 'volonte', name: 'Volonté', value: 3, creationValue: 0 }
            },
            experience: { gain: "0", spent: "0", rest: "0" },
            creationConfig: { active: false },
            attributes: {},
            attributeSettings: [],
            secondaryAttributesActive: false,
            secondaryAttributes: {},
            page2: { avantages: [], desavantages: [] }
        } as any;

        const result = RuleCalculationsService.calculateExperienceResults(data, rules);

        // Value: 3, Creation: 0, Base: 10, Factor: 1. Linear.
        // Cost should be (3-0) * 10 * 1 = 30.
        expect(parseInt(result.spent)).toBe(30);
    });
});
