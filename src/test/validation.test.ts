import { describe, it, expect } from 'vitest';
import { RulesDataSchema } from '../utils/validation/rulesSchema';
import { INITIAL_DATA } from '../data/initialState';

describe('RulesData Validation', () => {

    it('should validate a correct RulesData object', () => {
        const validRules = {
            version: "1.0.0",
            configurations: {
                global: { maxAttributeScore: 5, maxSkillScore: 5 },
                creation: INITIAL_DATA.creationConfig,
                xpCosts: { attributeFactor: 1, skillFactor: 1, specializationFactor: 1 },
                cards: {
                    ...INITIAL_DATA.creationConfig.cardConfig,
                    ranks: ["D", "C", "B", "A", "S"],
                    counts: ["1", "2", "3", "4", "5"],
                    maxLabel: "Max"
                }
            },
            definitions: {
                attributes: {},
                secondaryAttributes: {},
                skills: {},
                skillCategories: [{
                    id: 'cat_1',
                    behavior: 'Compétence',
                    label: 'Test',
                    allowSpecializations: true,
                    costConfig: { factor: 1, type: 'linear' }
                }],
                counters: {},
                backgrounds: [],
                labels: {}
            },
            libraries: {
                traits: [],
                skills: [],
                backgrounds: [],
                counters: [],
                specializations: []
            }
        };

        const result = RulesDataSchema.safeParse(validRules);
        if (!result.success) {
            console.error(JSON.stringify(result.error.format(), null, 2));
        }
        expect(result.success).toBe(true);
    });

    it('should fail if required fields are missing', () => {
        const invalidRules = {
            version: "1.0.0",
            // missing configurations
            definitions: {},
            libraries: {}
        };

        const result = RulesDataSchema.safeParse(invalidRules);
        expect(result.success).toBe(false);
    });
});
