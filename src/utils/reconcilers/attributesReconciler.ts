import { CharacterSheetData, AttributeEntry } from '../../types';
import { RulesData } from '../../types/rules';
import { generateId } from '../factories';

/**
 * Reconstructs main attributes based on rules definitions.
 * Preserves dots and values while attaching correct rules-based properties.
 * 
 * @param newState - The current draft state
 * @param rules - The rules containing attribute definitions
 */
export const reconcileAttributes = (newState: CharacterSheetData, rules: RulesData) => {
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
export const reconcileSecondaryAttributes = (newState: CharacterSheetData, rules: RulesData) => {
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
