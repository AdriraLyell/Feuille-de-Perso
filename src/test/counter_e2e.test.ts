import { describe, it, expect } from 'vitest';
import { reconcileRulesWithState } from '../utils/rulesReconciler';
import { RuleCalculationsService } from '../services/RuleCalculationsService';
import { INITIAL_DATA } from '../data/initialState';
import { RulesData } from '../types/rules';

describe('Counter Cost E2E Simulation', () => {
    it('should calculate cost correctly after reconciliation with new counter costs', () => {
        // 1. Define new rules with a specific counter cost
        const rules: RulesData = {
            definitions: {
                skillCategories: [
                    { id: 'cat_counter', label: 'Compteurs', behavior: 'Compteur', costConfig: { factor: 2, type: 'linear' } }
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
                creation: { backgroundCost: 2, rankSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
                xpCosts: { attributeFactor: 6, skillFactor: 1, specializationFactor: 0.5 }
            }
        } as any;

        // 2. Reconcile initial data with these rules
        const character = reconcileRulesWithState(INITIAL_DATA, rules);

        // 3. Set a value (simulate user clicking dots)
        // Find Volonté in skills
        const skill = character.skills.cat_counter.find(s => s.name === 'Volonté');
        if (skill) {
            skill.value = 3;
            skill.creationValue = 0; // Purchased with XP
        }

        // 4. Calculate XP
        const result = RuleCalculationsService.calculateExperienceResults(character, rules);

        // Cost should be: (3-0) * 10 (base) * 2 (multiplier) = 60
        expect(parseInt(result.spent)).toBe(60);
    });
});
