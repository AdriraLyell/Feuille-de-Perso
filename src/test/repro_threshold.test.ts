
import { describe, it, expect } from 'vitest';
import { reconcileRulesWithState } from '../utils/rulesReconciler';
import { CharacterSheetData, DotEntry } from '../types';
import { INITIAL_DATA } from '../data/initialState';
import { RulesData } from '../types/rules';

describe('Specialization Threshold Bug Reproduction', () => {
    it('should remove imposed specialization when local override increases threshold above skill level', () => {
        // 1. Initial State: Skill "Katana" at level 1
        const currentState: CharacterSheetData = {
            ...INITIAL_DATA,
            skills: {
                ...INITIAL_DATA.skills,
                'combat': [
                    { id: 'katana-id', name: 'Katana', value: 1, creationValue: 1, max: 5 }
                ] as DotEntry[]
            },
            // 2. Local override: threshold 3
            specializationLibrary: [
                {
                    id: 'spec-ikebana',
                    name: 'Ikebana',
                    skillIds: ['katana-id'],
                    defaultMinLevel: 3,
                    isImposed: true
                }
            ]
        };

        // 3. Official rules: the specialization exists there too (threshold 1)
        const rules: RulesData = {
            version: '1.0.0',
            definitions: {
                skillCategories: [{ id: 'combat', label: 'Combat', behavior: 'Compétence' }],
                skills: { 'combat': ['Katana'] },
                attributes: {},
                secondaryAttributes: {},
                labels: {},
            },
            configurations: {
                global: { maxAttributeScore: 5, maxSkillScore: 5 },
                creation: { mode: 'rangs', startingXP: 0, rankSlots: {} },
                xpCosts: { attributeFactor: 0, skillFactor: 0, specializationFactor: 0 }
            },
            libraries: {
                specializations: [
                    {
                        id: 'spec-ikebana',
                        name: 'Ikebana',
                        skillIds: ['katana-id'],
                        defaultMinLevel: 1,
                        isImposed: true
                    }
                ],
                skills: [{ id: 'katana-id', name: 'Katana' }]
            }
        } as any;

        const newState = reconcileRulesWithState(currentState, rules as RulesData);

        // The imposed specialization should be REMOVED because level (1) < threshold (3)
        // Currently it will FAIL because it only looks at rules (threshold 1)
        const imposed = newState.imposedSpecializations['katana-id'] || [];
        expect(imposed.map(s => s.name)).not.toContain('Ikebana');
    });
});
