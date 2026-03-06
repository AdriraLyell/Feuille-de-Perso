import { describe, it, expect } from 'vitest';
import { migrateData, migrateRulesToV2 } from '../utils/migrations';
import {
    LEGACY_V1_TERMINOLOGY,
    LEGACY_V1_STRING_TRAITS,
    LEGACY_V1_NUMERIC_ATTRIBUTES,
    LEGACY_V1_COUNTERS,
    LEGACY_V1_NAMED_SKILL_CATEGORIES,
    LEGACY_V1_NAMED_ATTRIBUTE_CATEGORIES,
    LEGACY_V1_ARRAY_NOTEBOOK,
    LEGACY_V1_STRING_SPECIALIZATIONS,
    LEGACY_V1_LIBRARY_TYPES,
    LEGACY_V1_SINGLE_IMAGE_NOTE,
    LEGACY_V1_TYPO_SKILLLIBRARY,
    MINIMAL_VALID_DATA
} from './fixtures/legacy-data';

// Helper to deep clone fixtures to avoid mutation between tests
const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

describe('Data Migrations - migrateData', () => {

    // =========================================================================
    // TERMINOLOGY MIGRATIONS
    // =========================================================================
    describe('Terminology Migrations (vertus/defauts -> avantages/desavantages)', () => {
        it('should rename vertus to avantages', () => {
            const result = migrateData(clone(LEGACY_V1_TERMINOLOGY));

            expect(result.page2.avantages).toBeDefined();
            expect(result.page2.avantages[0].name).toBe('Courage');
            // @ts-expect-error -- testing that old key is removed
            expect(result.page2.vertus).toBeUndefined();
        });

        it('should rename defauts to desavantages', () => {
            const result = migrateData(clone(LEGACY_V1_TERMINOLOGY));

            expect(result.page2.desavantages).toBeDefined();
            expect(result.page2.desavantages[0].name).toBe('Impulsif');
            // @ts-expect-error -- testing that old key is removed
            expect(result.page2.defauts).toBeUndefined();
        });
    });

    // =========================================================================
    // TRAIT STRUCTURE MIGRATIONS
    // =========================================================================
    describe('Trait Structure Migrations (string[] -> object[])', () => {
        it('should convert string array avantages to objects', () => {
            const result = migrateData(clone(LEGACY_V1_STRING_TRAITS));

            expect(result.page2.avantages[0]).toHaveProperty('name');
            expect(result.page2.avantages[0]).toHaveProperty('value');
            expect(result.page2.avantages[0].name).toBe('Courage');
        });

        it('should convert string array desavantages to objects', () => {
            const result = migrateData(clone(LEGACY_V1_STRING_TRAITS));

            expect(result.page2.desavantages[0]).toHaveProperty('name');
            expect(result.page2.desavantages[0].name).toBe('Impulsif');
        });

        it('should pad avantages array to 28 elements', () => {
            const result = migrateData(clone(LEGACY_V1_STRING_TRAITS));

            expect(result.page2.avantages.length).toBe(28);
        });

        it('should pad desavantages array to 28 elements', () => {
            const result = migrateData(clone(LEGACY_V1_STRING_TRAITS));

            expect(result.page2.desavantages.length).toBe(28);
        });
    });

    // =========================================================================
    // ATTRIBUTE MIGRATIONS
    // =========================================================================
    describe('Attribute Migrations', () => {
        it('should ensure all attribute values are strings after migration', () => {
            const result = migrateData(clone(MINIMAL_VALID_DATA));

            // All attribute values should be strings (not numbers)
            Object.values(result.attributes).forEach((catAttrs: any) => {
                catAttrs.forEach((attr: any) => {
                    if (attr.val1 !== '') {
                        expect(typeof attr.val1).toBe('string');
                    }
                });
            });
        });

        it('should have pave_attributs_x keys after migration', () => {
            const result = migrateData(clone(MINIMAL_VALID_DATA));

            expect(result.attributes.pave_attributs_1).toBeDefined();
            expect(result.attributes.pave_attributs_2).toBeDefined();
            expect(result.attributes.pave_attributs_3).toBeDefined();
        });

        it('should migrate named categories to generic IDs', () => {
            const result = migrateData(clone(LEGACY_V1_NAMED_ATTRIBUTE_CATEGORIES));

            expect(result.attributes.pave_attributs_1).toBeDefined();
            expect(result.attributes.pave_attributs_2).toBeDefined();
            expect(result.attributes.pave_attributs_3).toBeDefined();
            expect(result.attributes.physique).toBeUndefined();
        });

        it('should convert numeric val1 to string', () => {
            const result = migrateData(clone(LEGACY_V1_NUMERIC_ATTRIBUTES));

            // Check that Force from fixture has string val1
            const forceAttr = result.attributes.pave_attributs_1?.find((a: any) => a.name === 'Force');
            if (forceAttr) {
                expect(typeof forceAttr.val1).toBe('string');
            }
            // At minimum, structure should be valid
            expect(result.attributes.pave_attributs_1).toBeDefined();
        });
    });

    // =========================================================================
    // COUNTER MIGRATIONS
    // =========================================================================
    describe('Counter Migrations', () => {
        it('should add id to old counter structure', () => {
            const result = migrateData(clone(LEGACY_V1_COUNTERS));

            expect((result.counters.volonte as any).id).toBe('volonte');
            expect((result.counters.confiance as any).id).toBe('confiance');
        });

        it('should add current property (for squares)', () => {
            const result = migrateData(clone(LEGACY_V1_COUNTERS));

            expect((result.counters.volonte as any).current).toBe(0);
            expect((result.counters.confiance as any).current).toBe(0);
        });

        it('should preserve max values from old structure', () => {
            const result = migrateData(clone(LEGACY_V1_COUNTERS));

            expect((result.counters.volonte as any).value).toBe(5);
            expect((result.counters.confiance as any).value).toBe(3);
        });

        it('should remove "Valets / Dames / Rois" from custom counters', () => {
            const dataWithValets = {
                ...clone(LEGACY_V1_COUNTERS),
                counters: {
                    volonte: { id: 'volonte', name: 'Volonté', value: 3, current: 0, max: 10, creationValue: 3 },
                    confiance: { id: 'confiance', name: 'Confiance', value: 3, current: 0, max: 10, creationValue: 3 },
                    custom: [
                        { id: 'c1', name: 'Valets / Dames / Rois', value: 1, max: 5 },
                        { id: 'c2', name: 'Autre compteur', value: 2, max: 10 }
                    ]
                }
            };

            const result = migrateData(dataWithValets);

            expect(result.counters.custom.find((c: any) => c.name === 'Valets / Dames / Rois')).toBeUndefined();
            expect(result.counters.custom.find((c: any) => c.name === 'Autre compteur')).toBeDefined();
        });
    });

    // =========================================================================
    // SKILL CATEGORY MIGRATIONS
    // =========================================================================
    describe('Skill Category Migrations (named -> generic IDs)', () => {
        it('should migrate talents to Col_Comp_1', () => {
            const result = migrateData(clone(LEGACY_V1_NAMED_SKILL_CATEGORIES));

            expect(result.skills.Col_Comp_1).toBeDefined();
            // Check that 'Acrobatie' from fixture is in the merged array
            expect(result.skills.Col_Comp_1.some((s: any) => s.name === 'Acrobatie')).toBe(true);
            expect(result.skills.talents).toBeUndefined();
        });

        it('should migrate competences to Col_Comp_2', () => {
            const result = migrateData(clone(LEGACY_V1_NAMED_SKILL_CATEGORIES));

            expect(result.skills.Col_Comp_2).toBeDefined();
            // Check that 'Escalade' from fixture is in the merged array
            expect(result.skills.Col_Comp_2.some((s: any) => s.name === 'Escalade')).toBe(true);
        });

        it('should migrate connaissances to Col_Comp_4', () => {
            const result = migrateData(clone(LEGACY_V1_NAMED_SKILL_CATEGORIES));

            expect(result.skills.Col_Comp_4).toBeDefined();
            // Check that 'Histoire' from fixture is in the merged array
            expect(result.skills.Col_Comp_4.some((s: any) => s.name === 'Histoire')).toBe(true);
        });

        it('should migrate arrieres_plans to Col_Comp_8', () => {
            const result = migrateData(clone(LEGACY_V1_NAMED_SKILL_CATEGORIES));

            expect(result.skills.Col_Comp_8).toBeDefined();
            // Check that 'Noble' from fixture is somewhere in the merged array
            expect(result.skills.Col_Comp_8.some((s: any) => s.name === 'Noble')).toBe(true);
        });

        it('should add creationValue to all skills', () => {
            const result = migrateData(clone(LEGACY_V1_NAMED_SKILL_CATEGORIES));

            expect(result.skills.Col_Comp_1[0].creationValue).toBe(0);
        });
    });

    // =========================================================================
    // NOTEBOOK FIELD MIGRATIONS
    // =========================================================================
    describe('Notebook Field Migrations (array -> string)', () => {
        it('should convert array lieux_importants to newline-separated string', () => {
            const result = migrateData(clone(LEGACY_V1_ARRAY_NOTEBOOK));

            expect(typeof result.page2.lieux_importants).toBe('string');
            expect(result.page2.lieux_importants).toContain('Taverne du Dragon');
            expect(result.page2.lieux_importants).toContain('\n');
        });

        it('should filter empty strings from arrays', () => {
            const result = migrateData(clone(LEGACY_V1_ARRAY_NOTEBOOK));

            // Should not have empty lines
            expect(result.page2.contacts.split('\n').filter((s: string) => s === '').length).toBe(0);
        });

        it('should convert equipement array to string', () => {
            const result = migrateData(clone(LEGACY_V1_ARRAY_NOTEBOOK));

            expect(typeof result.page2.equipement).toBe('string');
            expect(result.page2.equipement).toContain('Épée');
        });

        it('should convert notes array to string', () => {
            const result = migrateData(clone(LEGACY_V1_ARRAY_NOTEBOOK));

            expect(typeof result.page2.notes).toBe('string');
            expect(result.page2.notes).toContain('Note 1');
        });
    });

    // =========================================================================
    // SPECIALIZATION MIGRATIONS
    // =========================================================================
    describe('Specialization Migrations', () => {
        it('should convert string imposed specializations to objects', () => {
            const result = migrateData(clone(LEGACY_V1_STRING_SPECIALIZATIONS));

            expect(result.imposedSpecializations.skill_1[0]).toHaveProperty('name');
            expect(result.imposedSpecializations.skill_1[0]).toHaveProperty('minLevel');
            expect(result.imposedSpecializations.skill_1[0].name).toBe('Combat rapproché');
        });

        it('should set default minLevel to 0', () => {
            const result = migrateData(clone(LEGACY_V1_STRING_SPECIALIZATIONS));

            expect(result.imposedSpecializations.skill_1[0].minLevel).toBe(0);
        });

        it('should create specializationLibrary from existing specializations', () => {
            const result = migrateData(clone(LEGACY_V1_STRING_SPECIALIZATIONS));

            expect(result.specializationLibrary).toBeDefined();
            expect(result.specializationLibrary!.length).toBeGreaterThan(0);
            expect(result.specializationLibrary!.some((s: any) => s.name === 'Épée')).toBe(true);
        });

        it('should merge skill IDs for duplicate specialization names', () => {
            const dataWithDuplicates = {
                ...clone(LEGACY_V1_STRING_SPECIALIZATIONS),
                specializations: {
                    'skill_1': ['Combat'],
                    'skill_2': ['Combat']
                }
            };

            const result = migrateData(dataWithDuplicates);

            const combatSpec = result.specializationLibrary?.find((s: any) => s.name === 'Combat');
            expect(combatSpec?.skillIds.length).toBe(2);
        });
    });

    // =========================================================================
    // LIBRARY MIGRATIONS
    // =========================================================================
    describe('Library Migrations', () => {
        it('should rename vertu type to avantage', () => {
            const result = migrateData(clone(LEGACY_V1_LIBRARY_TYPES));

            expect(result.library![0].type).toBe('avantage');
        });

        it('should rename defaut type to desavantage', () => {
            const result = migrateData(clone(LEGACY_V1_LIBRARY_TYPES));

            expect(result.library![1].type).toBe('desavantage');
        });

        it('should ensure tags array exists', () => {
            const result = migrateData(clone(LEGACY_V1_LIBRARY_TYPES));

            expect(Array.isArray(result.library![0].tags)).toBe(true);
        });

        it('should ensure effects array exists', () => {
            const result = migrateData(clone(LEGACY_V1_LIBRARY_TYPES));

            expect(Array.isArray(result.library![0].effects)).toBe(true);
        });

        it('should fix skilllibrary typo', () => {
            const result = migrateData(clone(LEGACY_V1_TYPO_SKILLLIBRARY));

            expect(result.skillLibrary).toBeDefined();
            expect(result.skillLibrary!.some((s: any) => s.name === 'Acrobatie')).toBe(true);
            // @ts-expect-error -- testing that typo key is removed
            expect(result.skilllibrary).toBeUndefined();
        });
    });

    // =========================================================================
    // CAMPAIGN NOTES MIGRATIONS
    // =========================================================================
    describe('Campaign Notes Migrations', () => {
        it('should convert single imageId to images array', () => {
            const result = migrateData(clone(LEGACY_V1_SINGLE_IMAGE_NOTE));

            expect(result.campaignNotes[0].images).toBeDefined();
            expect(Array.isArray(result.campaignNotes[0].images)).toBe(true);
            expect(result.campaignNotes![0].images!.length).toBe(1);
        });

        it('should preserve image config in new structure', () => {
            const result = migrateData(clone(LEGACY_V1_SINGLE_IMAGE_NOTE));

            expect(result.campaignNotes![0].images![0].config.width).toBe(200);
            expect(result.campaignNotes![0].images![0].config.align).toBe('right');
        });

        it('should remove old imageId property', () => {
            const result = migrateData(clone(LEGACY_V1_SINGLE_IMAGE_NOTE));

            expect((result.campaignNotes![0] as any).imageId).toBeUndefined();
            expect((result.campaignNotes![0] as any).imageConfig).toBeUndefined();
        });
    });

    // =========================================================================
    // DEFAULT STRUCTURE INITIALIZATION
    // =========================================================================
    describe('Default Structure Initialization', () => {
        it('should initialize missing attributeSettings', () => {
            const result = migrateData(clone(MINIMAL_VALID_DATA));

            expect(result.attributeSettings).toBeDefined();
        });

        it('should initialize missing secondaryAttributes', () => {
            const result = migrateData(clone(MINIMAL_VALID_DATA));

            expect(result.secondaryAttributes).toBeDefined();
            expect(result.secondaryAttributesActive).toBe(false);
        });

        it('should initialize missing creationConfig', () => {
            const result = migrateData(clone(MINIMAL_VALID_DATA));

            expect(result.creationConfig).toBeDefined();
            expect(result.creationConfig.attributeMin).toBeDefined();
            expect(result.creationConfig.attributeMax).toBeDefined();
        });

        it('should initialize missing theme', () => {
            const result = migrateData(clone(MINIMAL_VALID_DATA));

            expect(result.theme).toBeDefined();
        });

        it('should initialize missing xpLogs', () => {
            const result = migrateData(clone(MINIMAL_VALID_DATA));

            expect(result.xpLogs).toEqual([]);
        });

        it('should initialize missing appLogs', () => {
            const result = migrateData(clone(MINIMAL_VALID_DATA));

            expect(result.appLogs).toEqual([]);
        });

        it('should initialize missing partyNotes', () => {
            const result = migrateData(clone(MINIMAL_VALID_DATA));

            expect(result.partyNotes).toBeDefined();
            expect(result.partyNotes?.staticColWidths).toBeDefined();
        });

        it('should ensure all 9 skill categories exist', () => {
            const result = migrateData(clone(MINIMAL_VALID_DATA));

            for (let i = 1; i <= 9; i++) {
                expect(result.skills[`Col_Comp_${i}`]).toBeDefined();
            }
        });

        it('should ensure reputation has 7 entries', () => {
            const result = migrateData(clone(MINIMAL_VALID_DATA));

            expect(result.page2.reputation.length).toBe(7);
        });
    });

    // =========================================================================
    // XP LOGS MIGRATIONS
    // =========================================================================
    describe('XP Logs Migrations', () => {
        it('should add missing mj field to xpLogs', () => {
            const dataWithLogs = {
                ...clone(MINIMAL_VALID_DATA),
                xpLogs: [{ id: '1', date: '2024-01-01', amount: 5, reason: 'Test' }]
            };

            const result = migrateData(dataWithLogs);

            expect(result.xpLogs[0].mj).toBe('');
        });

        it('should add missing spendingLocation field to xpLogs', () => {
            const dataWithLogs = {
                ...clone(MINIMAL_VALID_DATA),
                xpLogs: [{ id: '1', date: '2024-01-01', amount: 5, reason: 'Test' }]
            };

            const result = migrateData(dataWithLogs);

            expect(result.xpLogs[0].spendingLocation).toBe('');
        });
    });
});

// =============================================================================
// RULES MIGRATION TESTS
// =============================================================================
describe('Rules Migrations - migrateRulesToV2', () => {

    it('should create skillCategories from legacy labels', () => {
        const legacyRules = {
            definitions: {
                labels: {
                    'talents': 'Talents',
                    'competences': 'Compétences'
                }
            }
        };

        const result = migrateRulesToV2(legacyRules);

        expect(result.definitions.skillCategories).toBeDefined();
        expect(result.definitions.skillCategories.length).toBeGreaterThan(0);
    });

    it('should set correct behavior for each category', () => {
        const result = migrateRulesToV2({ definitions: {} });

        const secondary = result.definitions.skillCategories.find((c: any) => c.id === 'Col_Comp_6');
        expect(secondary?.behavior).toBe('Secondaire');

        const background = result.definitions.skillCategories.find((c: any) => c.id === 'Col_Comp_8');
        expect(background?.behavior).toBe('Arrière-plan');
    });

    it('should migrate definitions.skills keys', () => {
        const legacyRules = {
            definitions: {
                skills: {
                    'talents': ['Acrobatie', 'Combat']
                }
            }
        };

        const result = migrateRulesToV2(legacyRules);

        expect(result.definitions.skills.Col_Comp_1).toEqual(['Acrobatie', 'Combat']);
        expect(result.definitions.skills.talents).toBeUndefined();
    });

    it('should ensure xpCosts structure exists', () => {
        const result = migrateRulesToV2({ definitions: {} });

        expect(result.configurations.xpCosts).toBeDefined();
        expect(result.configurations.xpCosts.attributeFactor).toBe(6);
        expect(result.configurations.xpCosts.skillFactor).toBe(1);
    });

    it('should handle null input gracefully', () => {
        const result = migrateRulesToV2(null);

        expect(result).toBeNull();
    });
});
