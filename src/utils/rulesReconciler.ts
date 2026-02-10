
import { CharacterSheetData, DotEntry, AttributeEntry } from '../types';
import { RulesData } from '../types/rules';
import { generateId } from './factories';
import { normalizeString } from './stringUtils';

// --- Sub-functions ---

const reconcileConfigurations = (newState: CharacterSheetData, rules: RulesData) => {
    // 1. Sync Info
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

    // 2. XP Costs
    if (rules.configurations?.xpCosts) {
        newState.xpCosts = {
            attributeFactor: rules.configurations.xpCosts.attributeFactor || 6,
            skillFactor: rules.configurations.xpCosts.skillFactor || 1,
            specializationFactor: rules.configurations.xpCosts.specializationFactor || 0
        };
    }

    // 3. Creation Config
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

    // 4. Secondary Attributes Toggle
    if (rules.configurations?.global?.secondaryAttributes !== undefined) {
        newState.secondaryAttributesActive = rules.configurations.global.secondaryAttributes;
    }
};

const reconcileAttributes = (newState: CharacterSheetData, rules: RulesData) => {
    const ruleAttributes = rules.definitions.attributes;
    if (!ruleAttributes) return;

    // A. Main Attributes
    const newAttributes: Record<string, AttributeEntry[]> = {};
    Object.keys(ruleAttributes).forEach(category => {
        const definedNames = ruleAttributes[category];
        const existingEntries = newState.attributes[category] || [];
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

    Object.keys(newState.attributes).forEach(cat => {
        if (!newAttributes[cat]) newAttributes[cat] = newState.attributes[cat];
    });
    newState.attributes = newAttributes;

    // B. Attribute Settings (Labels)
    const labels = rules.definitions.labels || {};
    newState.attributeSettings = Object.keys(ruleAttributes).map(key => ({
        id: key,
        label: labels[key] || key.charAt(0).toUpperCase() + key.slice(1)
    }));
};

const reconcileSecondaryAttributes = (newState: CharacterSheetData, rules: RulesData) => {
    const ruleSecondary = rules.definitions.secondaryAttributes || {};
    const newSecondary: Record<string, AttributeEntry[]> = {};

    const allCategories = new Set([
        ...Object.keys(rules.definitions.attributes || {}),
        ...Object.keys(newState.secondaryAttributes || {})
    ]);

    allCategories.forEach(category => {
        const definedNames = ruleSecondary[category] || [];
        const existingEntries = newState.secondaryAttributes?.[category] || [];
        const processedNames = new Set<string>();
        const consumedIds = new Set<string>();

        const syncedSecondary = definedNames.map(name => {
            processedNames.add(name);
            const existing = existingEntries.find(e => e.name === name && !consumedIds.has(e.id));
            if (existing) {
                consumedIds.add(existing.id);
                return { ...existing, name };
            } else {
                return { id: generateId(), name, val1: "0", val2: "", val3: "", creationVal1: 0, creationVal2: 0, creationVal3: 0 };
            }
        });

        const remainingSecondary = existingEntries.filter(e => e && e.name && !consumedIds.has(e.id) && !processedNames.has(e.name));
        newSecondary[category] = [...syncedSecondary, ...remainingSecondary];
    });
    newState.secondaryAttributes = newSecondary;
};

const reconcileSkillsAndBackgrounds = (newState: CharacterSheetData, currentState: CharacterSheetData, rules: RulesData) => {
    const ruleSkills = rules.definitions.skills;
    if (!ruleSkills) return;

    const newSkills: Record<string, DotEntry[]> = {};
    const processedNamesGlobal = new Set<string>();

    // 1. Process Standard Categories
    Object.keys(ruleSkills).forEach(category => {
        const definedNames = ruleSkills[category] || [];
        // @ts-ignore
        const existingEntries: DotEntry[] = (currentState.skills[category as keyof typeof currentState.skills] as DotEntry[]) || [];

        const catDef = rules.definitions.skillCategories?.find(c => c.id === category);
        const behavior = catDef?.behavior;
        const isCounterCat = behavior === 'Compteur';
        const isBgCat = behavior === 'Arrière-plan';

        const processedNames = new Set<string>();
        const consumedIds = new Set<string>();

        // A. Handle defined skills (Rules)
        const syncedSkills = definedNames.flatMap(name => {
            // Special handling for empty names (Spacers)
            if (!name || name.trim() === "") {
                const spacerCandidate = existingEntries.find(e =>
                    !consumedIds.has(e.id) &&
                    (!e.name || e.name.trim() === "")
                );

                if (spacerCandidate) {
                    consumedIds.add(spacerCandidate.id);
                    return [spacerCandidate];
                } else {
                    return [{ id: generateId(), name: "", value: 0, creationValue: 0, max: 0, variant: "" } as DotEntry];
                }
            }

            processedNames.add(name);
            processedNamesGlobal.add(name);

            // Find Library Definition to get stable ID

            // Find Library Definition to get stable ID
            const libSkill = rules.libraries?.skills?.find(s => s && normalizeString(s.name) === normalizeString(name));
            const definitionId = libSkill?.id; // Stable ID from library
            const isVariable = libSkill?.isVariable === true;
            const description = libSkill?.description || "";
            const max = isBgCat ? 5 : (rules.configurations?.global?.maxSkillScore || 10);

            // Strategy: Find ALL existing entries that match this definition
            // 1. Match by definitionId (Robust)
            // 2. Match by exact Name (Fallback/Migration)
            let matchingExisting = existingEntries.filter(e =>
                !consumedIds.has(e.id) && (
                    (definitionId && e.definitionId === definitionId) ||
                    (!e.definitionId && normalizeString(e.name) === normalizeString(name))
                )
            );

            // FALLBACK: If we have a definitionId but NO existing entry matched it, 
            // maybe the ID changed in the library but the name is the same.
            // We search for an entry that has NO definitionId (pure data) or a DIFFERENT definitionId but matching NAME.
            if (matchingExisting.length === 0 && definitionId && name && name.trim() !== "") {
                matchingExisting = existingEntries.filter(e =>
                    !consumedIds.has(e.id) &&
                    normalizeString(e.name) === normalizeString(name)
                );
            }

            // Special Case: Variable Skills can have multiple instances
            if (isVariable) {
                // If we have matching entries, return them all (updated)
                if (matchingExisting.length > 0) {
                    return matchingExisting.map(existing => {
                        consumedIds.add(existing.id);
                        return {
                            ...existing,
                            name, // Update name if definition changed
                            definitionId, // Inject definitionId during migration
                            max,
                            description: description || existing.description
                        };
                    });
                } else {
                    // No existing entry, create ONE empty placeholder
                    // DO NOT create it if it's meant to be added by user via "Add" button?
                    // actually for now we keep the behavior of showing at least one available slot or the skill itself
                    // BUT for variable skills, usually we just want the list of what the user added.
                    // However, if it's in "definitions", it implies it MUST be there.
                    // If it's variable, maybe we don't force a slot unless it's explicitly requested?
                    // Standard logic: If it's in the rule definition, it appears on the sheet.
                    // For variable skills, it often appears as an empty slot "Artisanat : ______"
                    return [{
                        id: generateId(),
                        name,
                        description,
                        value: 0,
                        creationValue: 0,
                        max,
                        variant: "", // Empty variant for user input
                        definitionId
                    }];
                }
            } else {
                // Non-variable: One-to-one mapping
                const existing = matchingExisting[0]; // Specific variant should not happen here usually

                let targetId = existing?.id || generateId();
                if (isCounterCat && rules.definitions.counters) {
                    const counterKey = Object.keys(rules.definitions.counters).find(k => normalizeString(rules.definitions.counters[k].name) === normalizeString(name));
                    if (counterKey) targetId = counterKey;
                }

                if (existing) {
                    consumedIds.add(existing.id);
                    return [{
                        ...existing,
                        id: targetId,
                        max,
                        name,
                        description: description || existing.description,
                        definitionId
                    }];
                } else {
                    return [{
                        id: targetId,
                        name,
                        description,
                        value: 0,
                        creationValue: 0,
                        max,
                        variant: undefined,
                        definitionId
                    }];
                }
            }
        });

        // B. Handle remaining entries (Custom skills or removed from rules but kept because they have XP)
        const remainingSkills = existingEntries.filter(e =>
            !consumedIds.has(e.id) &&
            !processedNames.has(e.name) && // Safety check, though consumedIds should cover it
            ((e.value || 0) > 0 || e.variant !== undefined || (e.definitionId && rules.libraries?.skills?.find(s => s.id === e.definitionId)?.isVariable))
        ).map(e => {
            // Try to retro-link custom skills if they match a library item by name (Late Binding)
            if (!e.definitionId) {
                const libMatch = rules.libraries?.skills?.find(s => normalizeString(s.name) === normalizeString(e.name));
                if (libMatch) {
                    return { ...e, definitionId: libMatch.id };
                }
            }
            return e;
        });

        newSkills[category] = [...syncedSkills, ...remainingSkills];
    });

    // Ensure standard categories exist
    const standardCats = [
        'Col_Comp_1', 'Col_Comp_2', 'Col_Comp_3', 'Col_Comp_4',
        'Col_Comp_5', 'Col_Comp_6', 'Col_Comp_7', 'Col_Comp_8', 'Col_Comp_9',
        'competences', 'talents', 'connaissances', 'langues', 'arrieres_plans', 'counters'
    ];
    standardCats.forEach(cat => {
        if (!newSkills[cat]) {
            // @ts-ignore
            newSkills[cat] = currentState.skills[cat as keyof typeof currentState.skills] || [];
        }
    });

    newState.skills = newSkills;


    // 2. Backgrounds (Arriere-plans) Logic
    const dynamicBgCat = rules.definitions.skillCategories?.find(c => c.behavior === 'Arrière-plan')?.id || 'Col_Comp_8';
    const definedInSkills = rules.definitions.skills?.[dynamicBgCat] || [];
    const definedInBackgrounds = rules.definitions.backgrounds || [];

    const ruleBackgrounds = Array.from(new Set([...definedInBackgrounds, ...definedInSkills]));

    if (ruleBackgrounds && Array.isArray(ruleBackgrounds)) {
        const allExistingSkills = Object.values(currentState.skills).flat() as DotEntry[];
        const namesAddedToBgs = new Set<string>();

        const syncedBgs = ruleBackgrounds.flatMap(name => {
            namesAddedToBgs.add(name);

            const libBg = rules.libraries?.backgrounds?.find(b => normalizeString(b.name) === normalizeString(name));
            const definitionId = libBg?.id;
            const isVariable = libBg?.isVariable === true;
            const description = libBg?.description || "";

            // Strategy: Find ALL existing entries that match
            // 1. Match by definitionId
            // 2. Match by Name (Migration)
            let matchingExisting = allExistingSkills.filter(e =>
            (
                (definitionId && e.definitionId === definitionId) ||
                (!e.definitionId && normalizeString(e.name) === normalizeString(name))
            )
            );

            // Filter out those already consumed (if multiple definitions point to same name?? unlikely but safe)
            // Ideally we need a global consumed set but scoped per category is ok as backgrounds are special.
            // Here we just grab them.

            if (matchingExisting.length > 0) {
                return matchingExisting.map(existing => ({
                    ...existing,
                    name,
                    definitionId,
                    max: 5,
                    description: description || existing.description
                }));
            } else {
                return [{
                    id: generateId(),
                    name,
                    description,
                    value: 0,
                    creationValue: 0,
                    max: 5,
                    variant: isVariable ? "" : undefined,
                    definitionId
                }];
            }
        });

        // Add remaining custom backgrounds that were in BG cats
        const remainingBgs = allExistingSkills.filter((e: DotEntry) => {
            if (!e || !e.name || namesAddedToBgs.has(e.name)) return false;
            // Also check if we already picked it up via definitionId in syncedBgs (namesAddedToBgs might miss if name changed)
            if (e.definitionId && syncedBgs.some(s => s.id === e.id)) return false;

            // Refined Criteria
            const wasInBackgroundCat = Object.keys(currentState.skills).some(catId => {
                const catDef = rules.definitions.skillCategories?.find(c => c.id === catId);
                const isBgCat = catDef?.behavior === 'Arrière-plan' || catId === 'Col_Comp_8' || catId === 'arrieres_plans';
                // @ts-ignore
                return isBgCat && currentState.skills[catId as keyof typeof currentState.skills]?.some((s: any) => s && s.id === e.id);
            });

            if (wasInBackgroundCat && ((e.value || 0) > 0 || e.variant !== undefined)) {
                namesAddedToBgs.add(e.name);
                return true;
            }
            return false;
        });

        newState.skills[dynamicBgCat] = [...syncedBgs, ...remainingBgs];

        // Global Deduplication for Backgrounds
        // Remove backgrounds from other categories if they are now in the dynamic BG cat
        const allBgIds = new Set([...syncedBgs, ...remainingBgs].map(s => s.id));

        Object.keys(newState.skills).forEach(catId => {
            if (catId !== dynamicBgCat && Array.isArray(newState.skills[catId as keyof typeof newState.skills])) {
                // @ts-ignore
                newState.skills[catId as keyof typeof newState.skills] = newState.skills[catId as keyof typeof newState.skills].filter((s: any) =>
                    !allBgIds.has(s.id)
                );
            }
        });

        if (dynamicBgCat !== 'arrieres_plans' && newState.skills['arrieres_plans']) {
            // @ts-ignore
            newState.skills['arrieres_plans'] = [];
        }
    }
};

const reconcileCounters = (newState: CharacterSheetData, currentState: CharacterSheetData, rules: RulesData) => {
    if (!rules.definitions.counters) return;

    const newCounters: any = { custom: currentState.counters.custom || [] };

    Object.keys(rules.definitions.counters).forEach(key => {
        const def = rules.definitions.counters[key];
        const existing = currentState.counters[key];
        const libCounter = rules.libraries?.counters?.find(c => normalizeString(c.name) === normalizeString(def.name) || c.id === key);
        const description = (def as any).description || libCounter?.description || '';

        const defaultValue = (def as any).defaultValue !== undefined ? (def as any).defaultValue : ((def as any).value || 3);
        const xpCost = (def as any).xpCost ?? 0;
        const max = def.max || 10;

        const value = existing && (existing as any).value !== undefined ? (existing as any).value : defaultValue;
        const creationValue = existing && (existing as any).creationValue !== undefined ? (existing as any).creationValue : defaultValue;

        if (existing) {
            newCounters[key] = {
                ...existing,
                name: def.name,
                max,
                description: description || (existing as any).description || '',
                value,
                creationValue
            };
        } else {
            newCounters[key] = {
                id: key,
                name: def.name,
                description,
                value,
                creationValue,
                max,
                current: 0
            };
        }
    });
    newState.counters = newCounters;
};

const reconcileTraits = (newState: CharacterSheetData, currentState: CharacterSheetData, rules: RulesData) => {
    // Migrer les Avantages (avantages) et Désavantages (desavantages)
    // Le but est de lier les entrées existantes aux définitions de la bibliothèque via definitionId

    const processTraitList = (list: any[], type: 'avantage' | 'desavantage') => {
        if (!list) return [];
        return list.map(existing => {
            // Si déjà lié, on garde (on pourrait update le nom ici si besoin, mais attention aux customs)
            if (existing.definitionId) return existing;

            // Tentative de liaison par nom (Migration)
            const libMatch = rules.libraries?.traits?.find(t =>
                t.type === type &&
                normalizeString(t.name) === normalizeString(existing.name)
            );

            if (libMatch) {
                return {
                    ...existing,
                    definitionId: libMatch.id,
                    // On ne force pas le nom pour l'instant pour éviter de casser des customs proches
                    // Mais on pourrait le faire si on veut uniformiser
                };
            }

            return existing;
        });
    };

    if (newState.page2) {
        newState.page2.avantages = processTraitList(currentState.page2.avantages, 'avantage');
        newState.page2.desavantages = processTraitList(currentState.page2.desavantages, 'desavantage');
    }
};

// --- Main Function ---

export const reconcileRulesWithState = (currentState: CharacterSheetData, rules: RulesData): CharacterSheetData => {
    const newState: CharacterSheetData = JSON.parse(JSON.stringify(currentState));

    if (rules.version) {
        newState._rulesVersion = rules.version;
    }

    reconcileConfigurations(newState, rules);
    reconcileAttributes(newState, rules);
    reconcileSecondaryAttributes(newState, rules);
    reconcileSkillsAndBackgrounds(newState, currentState, rules);
    reconcileCounters(newState, currentState, rules);
    reconcileTraits(newState, currentState, rules);

    return newState;
};
