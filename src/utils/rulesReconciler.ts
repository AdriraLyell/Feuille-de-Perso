import { CharacterSheetData, DotEntry } from '../types';
import { RulesData } from '../types/rules';
import { generateId } from './factories';

/**
 * Reconciles the existing character state with the new rules.
 * Preserves user values (xp, ranks) but updates definitions (names, costs, max).
 */
export const reconcileRulesWithState = (currentState: CharacterSheetData, rules: RulesData): CharacterSheetData => {
    // Deep copy to work safely
    const newState: CharacterSheetData = JSON.parse(JSON.stringify(currentState));

    // 1. Update Configuration (Costs, etc.)
    // These are safe to simply overwrite as they are "System Rules"
    if (rules.configurations && rules.configurations.xpCosts) {
        newState.xpCosts = {
            attributeFactor: rules.configurations.xpCosts.attributeFactor || 6,
            skillFactor: rules.configurations.xpCosts.skillFactor || 1,
            specializationFactor: rules.configurations.xpCosts.specializationFactor || 0
        };
    }

    if (rules.configurations && rules.configurations.creation) {
        newState.creationConfig = {
            ...newState.creationConfig,
            ...rules.configurations.creation,
            // Merge cardConfig from rules.configurations.cards (same as rulesAdapter)
            cardConfig: rules.configurations.cards ? {
                ...newState.creationConfig.cardConfig,
                ...rules.configurations.cards
            } : newState.creationConfig.cardConfig,
            // Force cast for rankSlots as generic Record<string> is not assignable to strict keys {1:number...}
            rankSlots: rules.configurations.creation.rankSlots as any
        };
    }

    // 2. Reconcile Attributes
    // We match by Name since IDs might differ if re-generated
    const ruleAttributes = rules.definitions.attributes;
    if (ruleAttributes) {
        const newAttributes: any = {};

        Object.keys(ruleAttributes).forEach(category => {
            const definedNames = ruleAttributes[category];
            const existingEntries = currentState.attributes[category] || [];

            // Map new definition
            newAttributes[category] = definedNames.map(name => {
                // Find existing value
                const existing = existingEntries.find(e => e.name === name);

                if (existing) {
                    // Start from existing to keep values, but update name/structure if needed
                    return {
                        ...existing,
                        // Ensure name is synced (fix typos in rules propagates)
                        name: name
                    };
                } else {
                    // New attribute in rules
                    return {
                        id: generateId(),
                        name: name,
                        val1: "", val2: "", val3: "",
                        creationVal1: 0, creationVal2: 0, creationVal3: 0
                    };
                }
            });
        });

        // Preserve other categories not in rules? No, rules define the sheet structure.
        newState.attributes = newAttributes;
    }

    // 2b. Reconcile Attribute Settings (Labels & Order)
    // We must ensure the sheet's metadata matches the rules structure.
    if (ruleAttributes) {
        const labels = rules.definitions.labels || {};
        newState.attributeSettings = Object.keys(ruleAttributes).map(key => ({
            id: key,
            label: labels[key] || key.charAt(0).toUpperCase() + key.slice(1)
        }));
    }

    // 2c. Reconcile Secondary Attributes
    // Check if rules define secondary attributes logic
    // Even if empty, we should clean up stale entries if the category no longer exists
    const ruleSecondary = rules.definitions.secondaryAttributes || {};
    // If not defined in rules, maybe we should clear it if global config says so?
    // But let's assume if it's there, we reconcile it.

    // We iterate based on PRIMARY categories (since secondary are attached to them)
    // OR based on defined secondary attributes keys? 
    // Usually they match primary keys.
    const newSecondary: any = {};

    // Only process categories that exist in primary attributes (source of truth for blocks)
    Object.keys(ruleAttributes || {}).forEach(category => {
        const definedNames = ruleSecondary[category] || []; // Might be empty
        const existingEntries = currentState.secondaryAttributes?.[category] || [];

        newSecondary[category] = definedNames.map(name => {
            const existing = existingEntries.find(e => e.name === name);
            if (existing) {
                return { ...existing, name: name };
            } else {
                return {
                    id: generateId(),
                    name: name,
                    val1: "", val2: "", val3: "",
                    creationVal1: 0, creationVal2: 0, creationVal3: 0
                };
            }
        });
    });
    newState.secondaryAttributes = newSecondary;

    // 2d. Sync 'secondaryAttributesActive' config
    if (rules.configurations.global.secondaryAttributes !== undefined) {
        newState.secondaryAttributesActive = rules.configurations.global.secondaryAttributes;
    }

    // 3. Reconcile Skills
    const ruleSkills = rules.definitions.skills;
    if (ruleSkills) {
        const newSkills: any = {};

        Object.keys(ruleSkills).forEach(category => {
            const definedNames = ruleSkills[category];
            const existingEntries = currentState.skills[category as keyof typeof currentState.skills] as DotEntry[] || [];

            newSkills[category] = definedNames.map(name => {
                // Handle Spacer
                if (!name || name.trim() === "") {
                    return {
                        id: generateId(),
                        name: "",
                        value: 0, creationValue: 0, max: 0, variant: ""
                    };
                }

                // Find existing
                const existing = existingEntries.find(e => e && e.name === name);

                // Lookup description from library
                const libSkill = rules.libraries?.skills?.find(s => s && s.name === name);
                const isVariable = libSkill?.isVariable === true;
                const description = libSkill?.description || "";

                if (existing) {
                    return {
                        ...existing,
                        // Update Max in case rule changed the cap
                        max: rules.configurations?.global?.maxSkillScore || 10,
                        // Update Name (case correction)
                        name: name,
                        // Refresh description from library
                        description: description || existing.description
                    };
                } else {
                    // New Skill
                    return {
                        id: generateId(),
                        name: name,
                        description: description,
                        value: 0,
                        creationValue: 0,
                        max: rules.configurations?.global?.maxSkillScore || 10,
                        variant: isVariable ? "" : undefined
                    };
                }
            });
        });

        // Ensure standard categories exist
        const standardCats = ['talents', 'competences', 'competences_col_2', 'connaissances', 'competences2', 'autres_competences', 'autres', 'arrieres_plans'];
        standardCats.forEach(cat => {
            if (!newSkills[cat]) newSkills[cat] = [];
        });

        newState.skills = newSkills;
    }

    // 4. Backgrounds (Arriere-plans)
    // These are often "Skills" but defined separately
    const ruleBackgrounds = rules.definitions.backgrounds;
    if (ruleBackgrounds && Array.isArray(ruleBackgrounds)) {
        const existingBackgrounds = (currentState.skills as any).arrieres_plans || [];

        // @ts-ignore
        newState.skills.arrieres_plans = ruleBackgrounds.map(name => {
            const existing = existingBackgrounds.find((e: DotEntry) => e.name === name);
            const libBg = rules.libraries?.backgrounds?.find(b => b.name === name);
            const description = libBg?.description || "";

            if (existing) {
                return {
                    ...existing,
                    max: 5,
                    name: name,
                    description: description || existing.description
                };
            }
            return {
                id: generateId(),
                name: name,
                description: description,
                value: 0, creationValue: 0, max: 5, variant: ""
            };
        });
    }

    // 5. Counters
    // Reset definitions but keep values
    if (rules.definitions.counters) {
        const newCounters: any = { custom: currentState.counters.custom || [] };

        Object.keys(rules.definitions.counters).forEach(key => {
            const def = rules.definitions.counters[key];
            const existing = currentState.counters[key];

            // Lookup description from library (Online mode uses libraries.counters)
            const libCounter = rules.libraries?.counters?.find(c =>
                c.name?.toLowerCase() === def.name?.toLowerCase() || c.id === key
            );
            const description = (def as any).description || libCounter?.description || '';

            if (existing) {
                newCounters[key] = {
                    ...existing,
                    // Preserve existing value, or use default from rules
                    name: def.name,
                    max: def.max,
                    description: description || (existing as any).description || '',
                    value: (existing as any).value !== undefined ? (existing as any).value : ((def as any).defaultValue !== undefined ? (def as any).defaultValue : ((def as any).value || 3)),
                    creationValue: (existing as any).creationValue !== undefined ? (existing as any).creationValue : ((def as any).defaultValue !== undefined ? (def as any).defaultValue : ((def as any).value || 3))
                };
            } else {
                // New Counter Case
                const startValue = (def as any).defaultValue !== undefined ? (def as any).defaultValue : ((def as any).value || 3);
                newCounters[key] = {
                    id: def.id || key,
                    name: def.name,
                    description: description,
                    value: startValue,
                    creationValue: startValue,
                    max: def.max || 10,
                    current: 0
                };
            }
        });
        newState.counters = newCounters;
    }

    // 6. Libraries
    // We generally WANT to update the official libraries to match new rules.
    // Official libraries should be fully replaced by new rules definitions.
    // However, we must preserve "Local" (User) items if they were mixed in?
    // In v2.12+, libraries are Hybrid. 
    // Admin libraries are mostly for providing "Official" content.
    // The sheet's `data.library` contains user added stuff.
    // We should probably NOT wipe `data.library` but we might want to update `rules.definitions.libraries` which is handled elsewhere.
    // Actually, `applyRulesToState` initializes `newState.skillLibrary`.
    // We should do the same here for official skills.

    if (rules.definitions.skills) {
        const newSkillLibrary: any[] = [];

        // Re-generate official skill library from rules
        Object.keys(rules.definitions.skills).forEach(category => {
            rules.definitions.skills[category].forEach(name => {
                if (!name || name.trim() === "") return;
                newSkillLibrary.push({
                    id: generateId(),
                    name: name,
                    defaultCategory: category,
                    description: "",
                    isVariable: false
                });
            });
        });

        // Determine how to merge with existing library.
        // Characters might have "Custom Skills" in their library.
        // We should keep entries that are NOT in the official list?
        // Or just strictly rely on `rules` for the "Official" part?
        // For now, let's update the `skillLibrary` on the sheet to match the Rules source of truth,
        // but we should ideally keep user added stuff.
        // Checking `initialState`, `skillLibrary` is mostly empty/default.
        // If user added custom skills, they add it to the library.

        // Safe bet: Append custom ones? 
        // Implementation Detail: The CharacterSheetData.skillLibrary is often used as "Reserve".
        // Replacing it completely might delete user's custom reserve skills.
        // Better Strategy: Don't touch `skillLibrary` in reconciliation unless we interpret it as "Official Only".
        // `applyRulesToState` (Line 144) DOES replace it.
        // So if we follow that pattern, we should replace it too to ensure new official skills appear.
        // Compromise: We replace it, assuming "Reserve" is meant to be the Official Pool + User Additions.
        // This is risky if we can't distinguish user additions.

        // Let's SKIP library reconciliation for safety in this pass, 
        // as changing skills on the sheet (Step 3) is the most critical part for "Updates".
    }

    return newState;
};
