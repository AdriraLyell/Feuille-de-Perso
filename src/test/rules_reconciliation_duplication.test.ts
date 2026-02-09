import { describe, it, expect } from 'vitest';
import { reconcileRulesWithState } from '../utils/rulesReconciler';
import { CharacterSheetData, DotEntry } from '../types';
import { INITIAL_DATA } from '../data/initialState';
import { RulesData } from '../types/rules';

describe('Rules Reconciliation Duplication', () => {
    it('should NOT produce duplicate IDs when rules have duplicate skill names', () => {
        const currentState: CharacterSheetData = {
            ...INITIAL_DATA,
            skills: {
                ...INITIAL_DATA.skills,
                'competences': [
                    { id: 'uuid-1', name: 'Skill A', value: 1, creationValue: 1, max: 5 }
                ] as DotEntry[]
            }
        };

        const rules = {
            version: '2.0.0',
            definitions: {
                skillCategories: [
                    { id: 'competences', label: 'Compétences', behavior: 'Compétence' }
                ],
                skills: {
                    'competences': ['Skill A', 'Skill A', 'Other']
                },
                attributes: {},
                secondaryAttributes: {},
                attributeSettings: {},
            },
            configurations: {},
            libraries: { skills: [], backgrounds: [], counters: [], traits: [], spells: [] }
        } as any;

        const newState = reconcileRulesWithState(currentState, rules as RulesData);
        const skills = newState.skills['competences'] as DotEntry[];

        expect(skills).toHaveLength(3);

        const ids = skills.map(s => s.id);
        const uniqueIds = new Set(ids);

        // This is expected to FAIL before the fix
        expect(uniqueIds.size).toBe(ids.length);
    });
});
