import { CharacterSheetData } from '../../types';
import { RulesData, SkillCategoryConfig, SkillBehavior } from '../../types/rules';
import { INITIAL_DATA } from '../../data/initialState';

// Import migration modules
import { migrateTerminology } from './migrateTerminology';
import { migrateTraits } from './migrateTraits';
import { migrateCounters } from './migrateCounters';
import { migrateAttributes, migrateAttributeId } from './migrateAttributes';
import { migrateNotebook } from './migrateNotebook';
import { migrateSkills, LEGACY_SKILL_MAP } from './migrateSkills';
import { migrateSpecializations } from './migrateSpecializations';
import { migrateLibrary } from './migrateLibrary';
import { migrateDefaults } from './migrateDefaults';

/**
 * Main migration function for character sheet data.
 * Applies all migrations in sequence to convert legacy data to current format.
 */
export const migrateData = (parsed: any): CharacterSheetData => {
    // 1. Terminology (vertus → avantages)
    migrateTerminology(parsed);

    // 2. Traits structure (string[] → object[])
    migrateTraits(parsed);

    // 3. Counters (add id, current, creationValue)
    migrateCounters(parsed);

    // 4. Attributes (numeric → string, generic IDs)
    migrateAttributes(parsed);

    // 5. Notebook fields (array → string)
    migrateNotebook(parsed);

    // 6. Libraries (skillLibrary, trait library)
    migrateLibrary(parsed);

    // 7. Specializations
    migrateSpecializations(parsed);

    // 8. Skills (legacy IDs → generic, creationValue)
    migrateSkills(parsed);

    // 9. Default values (header, xpLogs, etc.)
    migrateDefaults(parsed);

    return parsed as CharacterSheetData;
};

/**
 * Migration function for rules data (v2 format).
 * Converts legacy skill category IDs and ensures proper structure.
 */
export const migrateRulesToV2 = (rules: any): RulesData => {
    if (!rules) return rules;

    const behaviorMap: Record<string, SkillBehavior> = {
        'Col_Comp_1': 'Compétence',
        'Col_Comp_2': 'Compétence',
        'Col_Comp_3': 'Compétence',
        'Col_Comp_4': 'Compétence',
        'Col_Comp_5': 'Secondaire',
        'Col_Comp_6': 'Secondaire',
        'Col_Comp_7': 'Secondaire',
        'Col_Comp_8': 'Arrière-plan',
        'Col_Comp_9': 'Compteur'
    };

    // 1. Ensure Definitions exist
    if (!rules.definitions) rules.definitions = {};

    // 2. Migrate skillCategories if missing
    if (!rules.definitions.skillCategories || rules.definitions.skillCategories.length === 0) {
        const labels = rules.definitions.labels || {};
        const categories: SkillCategoryConfig[] = [];

        Object.entries(LEGACY_SKILL_MAP).forEach(([oldKey, newId]) => {
            const label = labels[oldKey] || labels[newId] || oldKey.charAt(0).toUpperCase() + oldKey.slice(1);
            const behavior = behaviorMap[newId] || 'Compétence';
            const factor = behavior === 'Secondaire' ? 0.5 : 1;
            const type = (behavior === 'Arrière-plan' || behavior === 'Compteur') ? 'linear' : 'triangular';

            categories.push({
                id: newId,
                label: label,
                behavior: behavior,
                description: "",
                allowSpecializations: behavior === 'Compétence',
                costConfig: { factor, type }
            });
        });

        categories.sort((a, b) => a.id.localeCompare(b.id));
        rules.definitions.skillCategories = categories;
    }

    // 3. Migrate definitions.skills Record keys
    if (rules.definitions.skills) {
        const newSkills: Record<string, string[]> = {};
        Object.keys(rules.definitions.skills).forEach(oldKey => {
            const newKey = LEGACY_SKILL_MAP[oldKey] || oldKey;
            newSkills[newKey] = rules.definitions.skills[oldKey];
        });
        rules.definitions.skills = newSkills;
    }

    // 4. Migrate definitions.attributes Record keys
    if (rules.definitions.attributes) {
        const newAttrs: Record<string, string[]> = {};
        Object.keys(rules.definitions.attributes).forEach(oldKey => {
            const newKey = migrateAttributeId(oldKey);
            newAttrs[newKey] = rules.definitions.attributes[oldKey];
        });
        rules.definitions.attributes = newAttrs;
    }

    // 5. Migrate definitions.secondaryAttributes Record keys
    if (rules.definitions.secondaryAttributes) {
        const newSecAttrs: Record<string, string[]> = {};
        Object.keys(rules.definitions.secondaryAttributes).forEach(oldKey => {
            const newKey = migrateAttributeId(oldKey);
            newSecAttrs[newKey] = rules.definitions.secondaryAttributes[oldKey];
        });
        rules.definitions.secondaryAttributes = newSecAttrs;
    }

    // 6. Migrate definitions.labels Record keys
    if (rules.definitions.labels) {
        const newLabels: Record<string, string> = {};
        Object.keys(rules.definitions.labels).forEach(oldKey => {
            // Apply both skill map and attribute map (hierarchical check)
            let newKey = LEGACY_SKILL_MAP[oldKey] || oldKey;
            newKey = migrateAttributeId(newKey);
            newLabels[newKey] = rules.definitions.labels[oldKey];
        });
        rules.definitions.labels = newLabels;
    }

    // 5. Ensure configurations structure
    if (!rules.configurations) {
        rules.configurations = {
            global: { maxAttributeScore: 5, maxSkillScore: 10, secondaryAttributes: false },
            creation: INITIAL_DATA.creationConfig,
            xpCosts: { attributeFactor: 6, skillFactor: 1, specializationFactor: 0 },
            cards: INITIAL_DATA.creationConfig.cardConfig as any
        };
    } else {
        // Ensure sub-sections exist
        if (!rules.configurations.global) rules.configurations.global = { maxAttributeScore: 5, maxSkillScore: 10 };
        if (!rules.configurations.creation) rules.configurations.creation = INITIAL_DATA.creationConfig;
        if (!rules.configurations.xpCosts) {
            rules.configurations.xpCosts = {
                attributeFactor: 6,
                skillFactor: 1,
                specializationFactor: 0
            };
        }
        if (!rules.configurations.cards && rules.configurations.creation.cardConfig) {
            rules.configurations.cards = rules.configurations.creation.cardConfig;
        }
    }

    return rules as RulesData;
};

// Re-export for backward compatibility
export { LEGACY_SKILL_MAP } from './migrateSkills';
export { ATTRIBUTE_ID_MAP, migrateAttributeId } from './migrateAttributes';
