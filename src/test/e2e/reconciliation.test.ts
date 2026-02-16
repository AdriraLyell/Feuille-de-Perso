import { describe, it, expect } from 'vitest';
import { reconcileRulesWithState } from '../../utils/rulesReconciler';
import { INITIAL_DATA } from '../../data/initialState';
import { RulesData } from '../../types/rules';
import { CharacterSheetData } from '../../types/character';

describe('RulesReconciler E2E', () => {

    const baseRules: RulesData = {
        version: "1.0.0",
        configurations: {
            global: { maxAttributeScore: 5, maxSkillScore: 5 },
            creation: {
                mode: 'rangs',
                startingXP: 350,
                attributeMin: -1,
                attributeMax: 3,
                rankSlots: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            },
            xpCosts: { attributeFactor: 1, skillFactor: 1, specializationFactor: 1, traitCost: 1 },
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
            skillCategories: [],
            counters: {},
            backgrounds: [],
            labels: {}
        },
        libraries: {
            traits: [],
            skills: [],
            backgrounds: [],
            counters: [],
            specializations: [],
            mysticAbilities: []
        }
    };

    it('should inject _rulesVersion into character data', () => {
        const character: CharacterSheetData = JSON.parse(JSON.stringify(INITIAL_DATA));
        expect(character._rulesVersion).toBeUndefined();

        const newRules: RulesData = { ...baseRules, version: "2.5.0" };
        const updated = reconcileRulesWithState(character, newRules);

        expect(updated._rulesVersion).toBe("2.5.0");
    });

    it('should rely on _rulesVersion to avoid unnecessary updates (simulated check)', () => {
        const character: CharacterSheetData = JSON.parse(JSON.stringify(INITIAL_DATA));
        character._rulesVersion = "1.0.0";

        const sameRules: RulesData = { ...baseRules, version: "1.0.0" };
        const updated = reconcileRulesWithState(character, sameRules);

        expect(updated._rulesVersion).toBe("1.0.0");
    });

    it('should update _rulesVersion when rules version changes', () => {
        const character: CharacterSheetData = JSON.parse(JSON.stringify(INITIAL_DATA));
        character._rulesVersion = "1.0.0";

        const newRules: RulesData = { ...baseRules, version: "1.0.1" };
        const updated = reconcileRulesWithState(character, newRules);

        expect(updated._rulesVersion).toBe("1.0.1");
    });

    it('should preserve existing values when updating rules', () => {
        const character: CharacterSheetData = JSON.parse(JSON.stringify(INITIAL_DATA));
        character.experience.gain = "100";

        const newRules: RulesData = { ...baseRules, version: "2.0.0" };
        const updated = reconcileRulesWithState(character, newRules);

        expect(updated.experience.gain).toBe("100");
    });

    it('should update skill definitions (max, name) from rules', () => {
        const character: CharacterSheetData = JSON.parse(JSON.stringify(INITIAL_DATA));
        // Setup initial skill
        character.skills['Col_Comp_1'] = [{ id: 'skill_1', name: 'Old Name', value: 2, max: 5, creationValue: 0 }];

        const newRules: RulesData = {
            ...baseRules,
            version: "2.0.0",
            definitions: {
                ...baseRules.definitions,
                skills: { 'Col_Comp_1': ['New Name'] },
                skillCategories: [{ id: 'Col_Comp_1', behavior: 'Compétence', label: 'Test Cat', allowSpecializations: true, costConfig: { factor: 1, type: 'linear' } }]
            },
            configurations: { ...baseRules.configurations, global: { ...baseRules.configurations.global, maxSkillScore: 8 } }
        };

        const updated = reconcileRulesWithState(character, newRules);
        const skill = updated.skills['Col_Comp_1'].find(s => s.name === 'New Name');

        expect(skill).toBeDefined();
        // Since matching is by name, "New Name" matches nothing, so it's created new with 0.
        expect(skill?.value).toBe(0);
        expect(skill?.max).toBe(8);

        // Old Name is preserved as orphan because value > 0
        const oldSkill = updated.skills['Col_Comp_1'].find(s => s.name === 'Old Name');
        expect(oldSkill).toBeDefined();
        expect(oldSkill?.value).toBe(2);
    });

    it('should add new skills defined in rules', () => {
        const character: CharacterSheetData = JSON.parse(JSON.stringify(INITIAL_DATA));
        character.skills['Col_Comp_1'] = [];

        const newRules: RulesData = {
            ...baseRules,
            version: "2.0.0",
            definitions: {
                ...baseRules.definitions,
                skills: { 'Col_Comp_1': ['Brand New Skill'] }
            }
        };

        const updated = reconcileRulesWithState(character, newRules);
        const skill = updated.skills['Col_Comp_1'].find(s => s.name === 'Brand New Skill');
        expect(skill).toBeDefined();
        expect(skill?.value).toBe(0);
    });

    it('should remove empty skills not in rules', () => {
        const character: CharacterSheetData = JSON.parse(JSON.stringify(INITIAL_DATA));
        character.skills['Col_Comp_1'] = [{ id: 'skill_1', name: 'Obsolete Skill', value: 0, max: 5, creationValue: 0 }];

        const newRules: RulesData = {
            ...baseRules,
            version: "2.0.0",
            definitions: {
                ...baseRules.definitions,
                skills: { 'Col_Comp_1': ['Other Skill'] }
            }
        };

        const updated = reconcileRulesWithState(character, newRules);
        const obsolete = updated.skills['Col_Comp_1'].find(s => s.name === 'Obsolete Skill');
        expect(obsolete).toBeUndefined();
    });

    it('should correctly handle Backgrounds migration and deduplication', () => {
        const character: CharacterSheetData = JSON.parse(JSON.stringify(INITIAL_DATA));
        // Simulate a background that was in Col_Comp_8 (historical)
        character.skills['Col_Comp_8'] = [{ id: 'bg_1', name: 'Noblesse', value: 3, max: 5, creationValue: 0 }];
        // And one in skills (incorrectly placed but should be detected if defined as BG)
        character.skills['Col_Comp_1'] = [{ id: 'bg_2', name: 'Richesse', value: 1, max: 5, creationValue: 0 }];

        const newRules: RulesData = {
            ...baseRules,
            version: "2.1.0",
            definitions: {
                ...baseRules.definitions,
                backgrounds: ['Noblesse', 'Richesse'], // Both defined as backgrounds
                skillCategories: [
                    { id: 'Col_Comp_1', behavior: 'Compétence', label: 'Skills', allowSpecializations: true, costConfig: { factor: 1, type: 'linear' } },
                    { id: 'arrieres_plans', behavior: 'Arrière-plan', label: 'Backgrounds', allowSpecializations: false, costConfig: { factor: 1, type: 'linear' } }
                ]
            }
        };

        const updated = reconcileRulesWithState(character, newRules);

        const bgCat = updated.skills['arrieres_plans'];
        expect(bgCat).toBeDefined();

        const noblesse = bgCat.find(s => s.name === 'Noblesse');
        expect(noblesse).toBeDefined();
        expect(noblesse?.value).toBe(3);

        const richesse = bgCat.find(s => s.name === 'Richesse');
        expect(richesse).toBeDefined();
        expect(richesse?.value).toBe(1);

        // Check deduplication (should be removed from original categories)
        const oldNoblesse = updated.skills['Col_Comp_8']?.find(s => s.name === 'Noblesse');
        expect(oldNoblesse).toBeUndefined();

        const oldRichesse = updated.skills['Col_Comp_1']?.find(s => s.name === 'Richesse');
        expect(oldRichesse).toBeUndefined();
    });

});
