import { CharacterSheetData, AttributeEntry, DotEntry, LibrarySkillEntry, CreationConfig } from '../types';
import { RulesData } from '../types/rules';
import { generateId } from './factories';

/**
 * Merges the loaded rules into the character sheet state.
 * This function effectively overrides hardcoded defaults with the external configuration.
 */
export const applyRulesToState = (baseState: CharacterSheetData, rules: RulesData | null): CharacterSheetData => {
    if (!rules) return baseState;

    // Deep copy to avoid mutating baseState
    const newState: CharacterSheetData = JSON.parse(JSON.stringify(baseState));

    // 1. Apply Theme
    newState.theme = { ...newState.theme, ...rules.theme };

    // 1b. Apply XP Costs
    newState.xpCosts = {
        attributeFactor: rules.configurations.xpCosts.attributeFactor,
        skillFactor: rules.configurations.xpCosts.skillFactor,
        specializationFactor: rules.configurations.xpCosts.specializationFactor
    };

    // 2. Apply Creation Config
    newState.creationConfig = {
        ...newState.creationConfig,
        ...rules.configurations.creation,
        // Ensure nested objects are merged correctly if they exist
        cardConfig: rules.configurations.cards ? {
            ...newState.creationConfig.cardConfig,
            ...rules.configurations.cards
        } : newState.creationConfig.cardConfig
    } as CreationConfig;

    // 3. Apply Global Configurations (Max Scores)
    // We map these to the state if needed, or they might be used directly from rules by components.
    // For now, checks are done in components, but we might want to store limits in the state?
    // Actually, max scores are often hardcoded in factories.ts as well (max: 5).
    // Updating existing entries is complex, but for new entries via factories, we pass limits.
    // For the sheet structure itself:

    // 4. Update Attributes Definition
    const ruleAttributes = rules.definitions.attributes;
    if (ruleAttributes) {
        // We reconstruct the attributes object based on rules
        const newAttributes: Record<string, AttributeEntry[]> = {};

        Object.keys(ruleAttributes).forEach(category => {
            const names = ruleAttributes[category];
            newAttributes[category] = names.map(name => ({
                id: generateId(), // Start with fresh IDs for a new sheet
                name: name,
                val1: "",
                val2: "",
                val3: "",
                creationVal1: 0,
                creationVal2: 0,
                creationVal3: 0
            }));
        });
        newState.attributes = newAttributes;
    }

    // 5. Update Secondary Attributes Definition (if any)
    const ruleSecAttributes = rules.definitions.secondaryAttributes;
    if (ruleSecAttributes) {
        const newSecAttributes: Record<string, AttributeEntry[]> = {};
        Object.keys(ruleSecAttributes).forEach(category => {
            const names = ruleSecAttributes[category];
            newSecAttributes[category] = names.map(name => ({
                id: generateId(),
                name: name,
                val1: "",
                val2: "",
                val3: ""
            }));
        });
        newState.secondaryAttributes = newSecAttributes;

        // Also update attributeSettings to match the keys
        newState.attributeSettings = Object.keys(ruleSecAttributes).map(cat => ({
            id: cat,
            label: (rules.definitions.labels && rules.definitions.labels[cat]) || cat.charAt(0).toUpperCase() + cat.slice(1)
        }));

        // Activate based on Configuration Flag
        newState.secondaryAttributesActive = !!rules.configurations.global.secondaryAttributes;
    }

    // 6. Update Skills Definition
    // We update both the sheet 'skills' lists AND the 'skillLibrary'
    const ruleSkills = rules.definitions.skills;
    const ruleCategories = rules.definitions.skillCategories;

    if (ruleCategories && ruleCategories.length > 0) {
        const newSkills: Record<string, DotEntry[]> = {};
        const newSkillLibrary: LibrarySkillEntry[] = [];

        ruleCategories.forEach(cat => {
            const names = ruleSkills ? ruleSkills[cat.id] : [];
            if (!names) {
                newSkills[cat.id] = [];
                return;
            }

            // Build the sheet skill list
            newSkills[cat.id] = names.map(name => {
                if (!name || name.trim() === "") {
                    return { id: generateId(), name: "", value: 0, creationValue: 0, max: 0, variant: "" };
                }

                const libSkill = rules.libraries?.skills?.find(s => s.name === name);
                const isVariable = libSkill?.isVariable === true;

                return {
                    id: generateId(),
                    name: name,
                    value: 0,
                    creationValue: 0,
                    max: rules.configurations.global.maxSkillScore,
                    variant: isVariable ? "" : undefined
                };
            });

            // Build the library entries
            names.forEach(name => {
                if (!name || name.trim() === "") return;
                newSkillLibrary.push({
                    id: generateId(),
                    name: name,
                    defaultCategory: cat.id,
                    description: "",
                    isVariable: false
                });
            });
        });

        newState.skills = newSkills;
        newState.skillLibrary = newSkillLibrary;
    } else if (ruleSkills) {
        // Fallback Legacy (Old definitions.skills Record)
        const newSkills: Record<string, DotEntry[]> = {};
        const newSkillLibrary: LibrarySkillEntry[] = [];

        Object.keys(ruleSkills).forEach(category => {
            const names = ruleSkills[category];
            newSkills[category] = names.map(name => {
                if (!name || name.trim() === "") return { id: generateId(), name: "", value: 0, creationValue: 0, max: 0, variant: "" };
                const libSkill = rules.libraries?.skills?.find(s => s.name === name);
                return {
                    id: generateId(),
                    name: name,
                    value: 0,
                    creationValue: 0,
                    max: rules.configurations.global.maxSkillScore,
                    variant: libSkill?.isVariable ? "" : undefined
                };
            });

            names.forEach(name => {
                if (!name || name.trim() === "") return;
                newSkillLibrary.push({ id: generateId(), name: name, defaultCategory: category, description: "", isVariable: false });
            });
        });
        newState.skills = newSkills;
        newState.skillLibrary = newSkillLibrary;
    }

    // Ensure all 9 columns exist even if not defined in rules
    const requiredCats = ['Col_Comp_1', 'Col_Comp_2', 'Col_Comp_3', 'Col_Comp_4', 'Col_Comp_5', 'Col_Comp_6', 'Col_Comp_7', 'Col_Comp_8', 'Col_Comp_9'];
    requiredCats.forEach(cat => {
        if (!newState.skills[cat]) newState.skills[cat] = [];
    });

    // 7. Update Backgrounds (if defined in rules as string array)
    const ruleBackgrounds = rules.definitions.backgrounds;
    if (ruleBackgrounds && Array.isArray(ruleBackgrounds)) {
        // Map to DotEntry[] for legacy arrieres_plans and Col_Comp_8
        const bgEntries = ruleBackgrounds.map(name => {
            const libBg = rules.libraries?.backgrounds?.find(b => b.name === name);
            const isVariable = libBg?.isVariable === true;

            return {
                id: generateId(),
                name: name,
                value: 0,
                creationValue: 0,
                max: 5,
                variant: isVariable ? "" : undefined
            };
        });

        newState.skills.Col_Comp_8 = bgEntries;
    }

    // 8. Update Counters
    const ruleCounters = rules.definitions.counters;
    if (ruleCounters) {
        const newCounters: any = { custom: [] };

        Object.keys(ruleCounters).forEach(key => {
            const def = ruleCounters[key];
            newCounters[key] = {
                id: def.id || key,
                name: def.name,
                value: def.max, // Value represents the Max cap in DotRating
                creationValue: def.max,
                max: def.max, // Hard cap for UI
                current: 0 // "Utilisé" start at 0
            };
        });

        // Preserve custom counters if possible? No, we apply rules strictly for system counters.
        // But we might want to keep 'custom' array from user state if it exists?
        // For now, let's reset to rules + empty custom.
        newCounters.custom = baseState.counters.custom || [];

        newState.counters = newCounters;
    }

    // Force strict structure matching for potential mismatch in rankSlots or other deep objects
    if (rules.configurations.creation.rankSlots) {
        // @ts-ignore
        newState.creationConfig.rankSlots = rules.configurations.creation.rankSlots;
    }

    return newState;
};
