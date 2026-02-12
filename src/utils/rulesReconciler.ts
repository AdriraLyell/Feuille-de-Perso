
import { CharacterSheetData, DotEntry, AttributeEntry, TraitEntry } from '../types';
import { RulesData } from '../types/rules';
import { generateId } from './factories';
import { normalizeString } from './stringUtils';
import { getSkillCategory, getCounter, setCounter } from './stateAccessors';
import { reconcileSkillsAndBackgrounds } from './reconcilers/skillsReconciler';

// --- Sub-functions ---

/**
 * Synchronizes metadata and global configurations from rules.
 * Updates character info, XP costs, and creation rules.
 * 
 * @param newState - The current draft state being updated
 * @param rules - The new rules to apply
 */
const reconcileConfigurations = (newState: CharacterSheetData, rules: RulesData) => {
    // 1. Sync Info
    const ruleSettingId = rules.settingId;
    if (ruleSettingId) {
        newState.syncInfo = {
            ...newState.syncInfo,
            settingId: ruleSettingId,
            settingName: rules.settingName || newState.syncInfo?.settingName || 'Inconnue',
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
            rankSlots: rules.configurations.creation.rankSlots
        };
    }

    // 4. Secondary Attributes Toggle
    if (rules.configurations?.global?.secondaryAttributes !== undefined) {
        newState.secondaryAttributesActive = rules.configurations.global.secondaryAttributes;
    }
};

/**
 * Reconstructs main attributes based on rules definitions.
 * Preserves dots and values while attaching correct rules-based properties.
 * 
 * @param newState - The current draft state
 * @param rules - The rules containing attribute definitions
 */
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

/**
 * Reconstructs secondary attributes categorized by their type.
 * 
 * @param newState - The current draft state
 * @param rules - The rules containing secondary attribute definitions
 */
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

// --- Sub-functions --- (Note: reconcileSkillsAndBackgrounds is now in reconcilers/skillsReconciler.ts)

/**
 * Synchronizes custom counters with their library definitions.
 * 
 * @param newState - The current draft state
 * @param currentState - The source state
 * @param rules - The campaign rules
 */
const reconcileCounters = (newState: CharacterSheetData, currentState: CharacterSheetData, rules: RulesData) => {
    if (!rules.definitions.counters) return;

    const newCounters: CharacterSheetData['counters'] = {
        custom: currentState.counters.custom || []
    };

    Object.keys(rules.definitions.counters).forEach(key => {
        const def = rules.definitions.counters[key];
        const existingRaw = currentState.counters[key];
        const existing = Array.isArray(existingRaw) ? existingRaw[0] : (existingRaw as DotEntry | undefined);

        const libCounter = rules.libraries?.counters?.find(c => normalizeString(c.name) === normalizeString(def.name) || c.id === key);
        const description = def.description || libCounter?.description || '';

        const defaultValue = def.defaultValue !== undefined ? def.defaultValue : (def.value || 3);
        const max = def.max || 10;

        const value = existing?.value !== undefined ? existing.value : defaultValue;
        const creationValue = existing?.creationValue !== undefined ? existing.creationValue : defaultValue;

        if (existing) {
            newCounters[key] = {
                ...existing,
                name: def.name,
                max,
                description: description || existing.description || '',
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

/**
 * Links traits (advantages/disadvantages) to their latest library definitions.
 * 
 * @param newState - The current draft state
 * @param currentState - The source state
 * @param rules - The campaign rules
 */
const reconcileTraits = (newState: CharacterSheetData, currentState: CharacterSheetData, rules: RulesData) => {
    // Migrer les Avantages (avantages) et Désavantages (desavantages)
    // Le but est de lier les entrées existantes aux définitions de la bibliothèque via definitionId

    const processTraitList = (list: TraitEntry[], type: 'avantage' | 'desavantage'): TraitEntry[] => {
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
                };
            }

            return existing;
        });
    };

    if (newState.page2) {
        newState.page2.avantages = processTraitList(currentState.page2.avantages || [], 'avantage');
        newState.page2.desavantages = processTraitList(currentState.page2.desavantages || [], 'desavantage');
    }
}

// --- Main Function ---

/**
 * Main function to reconcile a character state with a set of rules.
 * Creates a deep clone of the current state and sequentially applies all sub-reconcilers.
 * 
 * @param currentState - Current character sheet data
 * @param rules - New ruleset to apply
 * @returns A new reconciled character sheet state
 */
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
