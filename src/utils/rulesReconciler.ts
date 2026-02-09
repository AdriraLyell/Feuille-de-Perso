import { CharacterSheetData, DotEntry } from '../types';
import { RulesData } from '../types/rules';
import { generateId } from './factories';
import { normalizeString } from './stringUtils';

/**
 * Reconciles the existing character state with the new rules.
 * Preserves user values (xp, ranks) but updates definitions (names, costs, max).
 */
export const reconcileRulesWithState = (currentState: CharacterSheetData, rules: RulesData): CharacterSheetData => {
    // Deep copy to work safely
    const newState: CharacterSheetData = JSON.parse(JSON.stringify(currentState));

    // Store the version of the rules being applied
    if (rules.version) {
        newState._rulesVersion = rules.version;
    }

    // 1. Update Configuration (Costs, etc.)
    const ruleSettingId = (rules as any).settingId;
    if (ruleSettingId) {
        newState.syncInfo = {
            ...newState.syncInfo,
            settingId: ruleSettingId,
            settingName: (rules as any).settingName || newState.syncInfo?.settingName || 'Inconnue',
            syncId: newState.syncInfo?.syncId || '',
            lastSynced: Date.now()
        };
    }

    if (rules.configurations?.xpCosts) {
        newState.xpCosts = {
            attributeFactor: rules.configurations.xpCosts.attributeFactor || 6,
            skillFactor: rules.configurations.xpCosts.skillFactor || 1,
            specializationFactor: rules.configurations.xpCosts.specializationFactor || 0
        };
    }

    if (rules.configurations?.creation) {
        newState.creationConfig = {
            ...newState.creationConfig,
            ...rules.configurations.creation,
            cardConfig: rules.configurations.cards ? {
                ...newState.creationConfig.cardConfig,
                ...rules.configurations.cards
            } : newState.creationConfig.cardConfig,
            rankSlots: rules.configurations.creation.rankSlots as any
        };
    }

    // 2. Reconcile Attributes
    const ruleAttributes = rules.definitions.attributes;
    if (ruleAttributes) {
        const newAttributes: any = {};
        Object.keys(ruleAttributes).forEach(category => {
            const definedNames = ruleAttributes[category];
            const existingEntries = currentState.attributes[category] || [];
            const processedNames = new Set<string>();
            const consumedIds = new Set<string>();

            const syncedAttributes = definedNames.map(name => {
                processedNames.add(name);
                const existing = existingEntries.find(e => e.name === name && !consumedIds.has(e.id));
                if (existing) {
                    consumedIds.add(existing.id);
                    return { ...existing, name: name };
                } else {
                    return {
                        id: generateId(), name, val1: "0", val2: "", val3: "",
                        creationVal1: 0, creationVal2: 0, creationVal3: 0
                    };
                }
            });
            const remainingAttributes = existingEntries.filter(e => e && e.name && !consumedIds.has(e.id) && !processedNames.has(e.name));
            newAttributes[category] = [...syncedAttributes, ...remainingAttributes];
        });
        Object.keys(currentState.attributes).forEach(cat => {
            if (!newAttributes[cat]) newAttributes[cat] = currentState.attributes[cat];
        });
        newState.attributes = newAttributes;
    }

    // 2b. Reconcile Attribute Settings
    if (ruleAttributes) {
        const labels = rules.definitions.labels || {};
        newState.attributeSettings = Object.keys(ruleAttributes).map(key => ({
            id: key,
            label: labels[key] || key.charAt(0).toUpperCase() + key.slice(1)
        }));
    }

    // 2c. Reconcile Secondary Attributes
    const ruleSecondary = rules.definitions.secondaryAttributes || {};
    const newSecondary: any = {};
    const allCategories = new Set([
        ...Object.keys(ruleAttributes || {}),
        ...Object.keys(currentState.secondaryAttributes || {})
    ]);
    allCategories.forEach(category => {
        const definedNames = ruleSecondary[category] || [];
        const existingEntries = currentState.secondaryAttributes?.[category] || [];
        const processedNames = new Set<string>();
        const consumedIds = new Set<string>();

        const syncedSecondary = definedNames.map(name => {
            processedNames.add(name);
            const existing = existingEntries.find(e => e.name === name && !consumedIds.has(e.id));
            if (existing) consumedIds.add(existing.id);
            return existing
                ? { ...existing, name }
                : { id: generateId(), name, val1: "0", val2: "", val3: "", creationVal1: 0, creationVal2: 0, creationVal3: 0 };
        });
        const remainingSecondary = existingEntries.filter(e => e && e.name && !consumedIds.has(e.id) && !processedNames.has(e.name));
        newSecondary[category] = [...syncedSecondary, ...remainingSecondary];
    });
    newState.secondaryAttributes = newSecondary;

    // 2d. Sync 'secondaryAttributesActive' config
    if (rules.configurations?.global?.secondaryAttributes !== undefined) {
        newState.secondaryAttributesActive = rules.configurations.global.secondaryAttributes;
    }

    // 3. Reconcile Skills
    const ruleSkills = rules.definitions.skills;
    if (ruleSkills) {
        const newSkills: any = {};
        Object.keys(ruleSkills).forEach(category => {
            const definedNames = ruleSkills[category] || [];
            const existingEntries = currentState.skills[category as keyof typeof currentState.skills] as DotEntry[] || [];
            const catDef = rules.definitions.skillCategories?.find(c => c.id === category);
            const behavior = catDef?.behavior;
            const isCounterCat = behavior === 'Compteur';
            const isBgCat = behavior === 'Arrière-plan';
            const processedNames = new Set<string>();
            const consumedIds = new Set<string>();

            const syncedSkills = definedNames.map(name => {
                if (!name || name.trim() === "") return { id: generateId(), name: "", value: 0, creationValue: 0, max: 0, variant: "" };
                processedNames.add(name);

                const existing = existingEntries.find(e => e && e.name === name && !consumedIds.has(e.id));
                const libSkill = rules.libraries?.skills?.find(s => s && s.name === name);
                const isVariable = libSkill?.isVariable === true;
                const description = libSkill?.description || "";

                let targetId = existing?.id || generateId();
                if (isCounterCat && rules.definitions.counters) {
                    const counterKey = Object.keys(rules.definitions.counters).find(k => normalizeString(rules.definitions.counters[k].name) === normalizeString(name));
                    if (counterKey) targetId = counterKey;
                }

                if (existing) {
                    consumedIds.add(existing.id);
                    return { ...existing, id: targetId, max: isBgCat ? 5 : (rules.configurations?.global?.maxSkillScore || 10), name, description: description || existing.description };
                } else {
                    return { id: targetId, name, description, value: 0, creationValue: 0, max: isBgCat ? 5 : (rules.configurations?.global?.maxSkillScore || 10), variant: isVariable ? "" : undefined };
                }
            });
            const remainingSkills = existingEntries.filter(e => e && e.name && !consumedIds.has(e.id) && !processedNames.has(e.name) && ((e.value || 0) > 0 || e.variant !== undefined));
            newSkills[category] = [...syncedSkills, ...remainingSkills];
        });
        const standardCats = ['talents', 'competences', 'competences_col_2', 'connaissances', 'competences2', 'autres_competences', 'autres', 'arrieres_plans'];
        standardCats.forEach(cat => {
            if (!newSkills[cat]) newSkills[cat] = currentState.skills[cat as keyof typeof currentState.skills] || [];
        });
        newState.skills = newSkills;
    }

    // 4. Backgrounds (Arriere-plans)
    const dynamicBgCat = rules.definitions.skillCategories?.find(c => c.behavior === 'Arrière-plan')?.id || 'Col_Comp_8';
    const definedInSkills = rules.definitions.skills?.[dynamicBgCat] || [];
    const definedInBackgrounds = rules.definitions.backgrounds || [];
    // Union of both sources to safeguard against incomplete definitions
    const ruleBackgrounds = Array.from(new Set([...definedInBackgrounds, ...definedInSkills]));

    if (ruleBackgrounds && Array.isArray(ruleBackgrounds)) {
        const allExistingSkills = Object.values(currentState.skills).flat() as DotEntry[];
        const namesAddedToBgs = new Set<string>();

        const syncedBgs = ruleBackgrounds.map(name => {
            namesAddedToBgs.add(name);
            const existing = allExistingSkills.find((e: DotEntry) => e && e.name === name);
            const libBg = rules.libraries?.backgrounds?.find(b => b.name === name);
            const isVariable = libBg?.isVariable === true;
            const description = libBg?.description || "";
            return existing ? { ...existing, max: 5, name, description: description || existing.description } : { id: generateId(), name, description, value: 0, creationValue: 0, max: 5, variant: isVariable ? "" : undefined };
        });

        const remainingBgs = allExistingSkills.filter((e: DotEntry) => {
            if (!e || !e.name || namesAddedToBgs.has(e.name)) return false;

            // Refined Criteria: Only migrate if it was ALREADY in a background category
            const wasInBackgroundCat = Object.keys(currentState.skills).some(catId => {
                const catDef = rules.definitions.skillCategories?.find(c => c.id === catId);
                // We check behavior of category OR historical ID Col_Comp_8
                const isBgCat = catDef?.behavior === 'Arrière-plan' || catId === 'Col_Comp_8' || catId === 'arrieres_plans';
                return isBgCat && currentState.skills[catId as keyof typeof currentState.skills]?.some((s: any) => s && s.name === e.name);
            });

            // If it was a background, and has value/variant, keep it.
            if (wasInBackgroundCat && ((e.value || 0) > 0 || e.variant !== undefined)) {
                namesAddedToBgs.add(e.name);
                return true;
            }
            return false;
        });

        newState.skills[dynamicBgCat] = [...syncedBgs, ...remainingBgs];

        // Global Deduplication: Remove these names from ALL other categories
        Object.keys(newState.skills).forEach(catId => {
            if (catId !== dynamicBgCat && Array.isArray(newState.skills[catId as keyof typeof newState.skills])) {
                // @ts-ignore
                newState.skills[catId as keyof typeof newState.skills] = newState.skills[catId as keyof typeof newState.skills].filter((s: any) =>
                    !s || !s.name || !namesAddedToBgs.has(s.name)
                );
            }
        });

        if (dynamicBgCat !== 'arrieres_plans' && newState.skills['arrieres_plans']) (newState.skills as any)['arrieres_plans'] = [];
    }

    // 5. Counters
    if (rules.definitions.counters) {
        const newCounters: any = { custom: currentState.counters.custom || [] };
        Object.keys(rules.definitions.counters).forEach(key => {
            const def = rules.definitions.counters[key];
            const existing = currentState.counters[key];
            const libCounter = rules.libraries?.counters?.find(c => normalizeString(c.name) === normalizeString(def.name) || c.id === key);
            const description = (def as any).description || libCounter?.description || '';
            if (existing) {
                newCounters[key] = { ...existing, name: def.name, max: def.max, description: description || (existing as any).description || '', value: (existing as any).value !== undefined ? (existing as any).value : ((def as any).defaultValue !== undefined ? (def as any).defaultValue : ((def as any).value || 3)), creationValue: (existing as any).creationValue !== undefined ? (existing as any).creationValue : ((def as any).defaultValue !== undefined ? (def as any).defaultValue : ((def as any).value || 3)) };
            } else {
                const startValue = (def as any).defaultValue !== undefined ? (def as any).defaultValue : ((def as any).value || 3);
                newCounters[key] = { id: key, name: def.name, description, value: startValue, creationValue: startValue, max: def.max || 10, current: 0 };
            }
        });
        newState.counters = newCounters;
    }

    return newState;
};
