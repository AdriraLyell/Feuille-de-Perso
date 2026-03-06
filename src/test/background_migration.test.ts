/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { reconcileRulesWithState } from '../utils/rulesReconciler';
import { CharacterSheetData } from '../types';
import { INITIAL_DATA } from '../data/initialState';
import { RulesData } from '../types/rules';

describe('Background Migration', () => {
    it('should move backgrounds from Col_Comp_8 to a new category defined by behavior', () => {
        const currentState: CharacterSheetData = {
            ...INITIAL_DATA,
            skills: {
                ...INITIAL_DATA.skills,
                'Col_Comp_8': [
                    { id: 'bg1', name: 'Noble', value: 3, creationValue: 3, max: 5 },
                    { id: 'bg2', name: 'Guerrier', value: 2, creationValue: 2, max: 5 }
                ]
            }
        };

        const rules = {
            version: '2.0.0',
            lastUpdated: Date.now(),
            definitions: {
                skillCategories: [
                    { id: 'Col_Comp_10', label: 'Nouveaux Historiques', behavior: 'Arrière-plan' }
                ],
                skills: {
                    'Col_Comp_10': ['Noble', 'Guerrier', 'Marchand']
                },
                backgrounds: ['Noble', 'Guerrier', 'Marchand'],
                attributes: {},
                secondaryAttributes: {},
                attributeSettings: {},
                vibe: { theme: 'classic', color: '#000' }
            },
            configurations: {
                global: { maxSkillScore: 10 }
            },
            libraries: { skills: [], backgrounds: [], counters: [], traits: [], spells: [] }
        } as any;

        const newState = reconcileRulesWithState(currentState, rules as RulesData);

        expect(newState.skills['Col_Comp_10']).toBeDefined();
        const bgs = newState.skills['Col_Comp_10'];

        expect(bgs.find(s => s.name === 'Noble')?.value).toBe(3);
        expect(bgs.find(s => s.name === 'Guerrier')?.value).toBe(2);
    });

    it('should NOT duplicate regular skills into backgrounds', () => {
        const currentState: CharacterSheetData = {
            ...INITIAL_DATA,
            skills: {
                ...INITIAL_DATA.skills,
                'competences': [
                    { id: 'skill1', name: 'Athlétisme', value: 3, creationValue: 3, max: 5 }
                ],
                'Col_Comp_8': [
                    { id: 'bg1', name: 'Noble', value: 2, creationValue: 2, max: 5 }
                ]
            }
        };

        const rules = {
            version: '2.0.0',
            lastUpdated: Date.now(),
            definitions: {
                skillCategories: [
                    { id: 'competences', label: 'Compétences', behavior: 'Compétence' },
                    { id: 'Col_Comp_10', label: 'Historiques', behavior: 'Arrière-plan' }
                ],
                skills: {
                    'competences': ['Athlétisme'],
                    'Col_Comp_10': ['Noble']
                },
                backgrounds: ['Noble'],
                attributes: {},
                secondaryAttributes: {},
                attributeSettings: {},
                vibe: { theme: 'classic', color: '#000' }
            },
            configurations: {},
            libraries: { skills: [], backgrounds: [], counters: [], traits: [], spells: [] }
        } as any;

        const newState = reconcileRulesWithState(currentState, rules as RulesData);

        // Verify Athlétisme is in competences
        expect(newState.skills['competences'].some(s => s.name === 'Athlétisme')).toBe(true);
        // CRITICAL: Verify Athlétisme is NOT duplicated in backgrounds
        expect(newState.skills['Col_Comp_10'].some(s => s.name === 'Athlétisme')).toBe(false);
    });

    it('should preserve custom backgrounds from legacy categories and remove them from original', () => {
        const currentState: CharacterSheetData = {
            ...INITIAL_DATA,
            skills: {
                ...INITIAL_DATA.skills,
                'arrieres_plans': [
                    { id: 'bg_custom', name: 'Aventurier Perdu', value: 4, creationValue: 4, max: 5 }
                ]
            }
        };

        const rules = {
            version: '2.0.0',
            lastUpdated: Date.now(),
            definitions: {
                skillCategories: [
                    { id: 'Col_Comp_10', label: 'Historiques MJ', behavior: 'Arrière-plan' }
                ],
                skills: {
                    'Col_Comp_10': ['Soldat']
                },
                backgrounds: ['Soldat'],
                attributes: {},
                secondaryAttributes: {},
                attributeSettings: {},
                vibe: { theme: 'classic', color: '#000' }
            },
            configurations: {},
            libraries: { skills: [], backgrounds: [], counters: [], traits: [], spells: [] }
        } as any;

        const newState = reconcileRulesWithState(currentState, rules as RulesData);
        const bgs = newState.skills['Col_Comp_10'];

        const custom = bgs.find(s => s.name === 'Aventurier Perdu');
        expect(custom).toBeDefined();
        expect(custom?.value).toBe(4);

        // Should be removed from legacy category
        expect(newState.skills['arrieres_plans']).toEqual([]);
    });

    it('should include backgrounds defined in skills even if missing from definitions.backgrounds', () => {
        const currentState = { ...INITIAL_DATA };

        // Simulating a case where 'Mentorat' is only in skills definition, not in backgrounds
        const rules = {
            version: '2.0.0',
            definitions: {
                skillCategories: [
                    { id: 'Col_Comp_10', label: 'Historiques MJ', behavior: 'Arrière-plan' }
                ],
                skills: {
                    'Col_Comp_10': ['Soldat', 'Mentorat']
                },
                // Mentora is MISSING here
                backgrounds: ['Soldat'],
                attributes: {},
                secondaryAttributes: {},
                attributeSettings: {},
            },
            configurations: {},
            libraries: { skills: [], backgrounds: [], counters: [], traits: [], spells: [] }
        } as any;

        const newState = reconcileRulesWithState(currentState, rules as RulesData);
        const bgs = newState.skills['Col_Comp_10'];

        expect(bgs.find(s => s.name === 'Soldat')).toBeDefined();
        // This is expected to FAIL before fix
        expect(bgs.find(s => s.name === 'Mentorat')).toBeDefined();
    });
});

