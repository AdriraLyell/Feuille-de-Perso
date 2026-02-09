import { describe, it, expect } from 'vitest';
import { reconcileRulesWithState } from '../utils/rulesReconciler';
import { INITIAL_DATA } from '../data/initialState';
import { RulesData } from '../types/rules';

describe('RulesReconciler', () => {
    it('should match skill IDs with counter IDs for behavior: Compteur', () => {
        const rules: RulesData = {
            definitions: {
                skillCategories: [
                    { id: 'cat_counter', label: 'Compteurs', behavior: 'Compteur', costConfig: { factor: 1, type: 'linear' } }
                ],
                skills: {
                    'cat_counter': ['Volonté']
                },
                counters: {
                    'volonte': { id: 'volonte', name: 'Volonté', max: 10, xpCost: 5 }
                },
                labels: {}
            },
            configurations: {
                global: { secondaryAttributes: false, maxAttributeScore: 5, maxSkillScore: 5 },
                creation: { mode: 'rangs', startingXP: 350, rankSlots: { 1: 10, 2: 8, 3: 6, 4: 2, 5: 0 } },
                xpCosts: { attributeFactor: 6, skillFactor: 1, specializationFactor: 0 }
            }
        } as any;

        const result = reconcileRulesWithState(INITIAL_DATA, rules);

        // Find the 'Volonté' skill in the reconciled state
        const skill = result.skills.cat_counter.find(s => s.name === 'Volonté');

        // It should have ID 'volonte' to match the counter ID
        expect(skill?.id).toBe('volonte');
    });
});
