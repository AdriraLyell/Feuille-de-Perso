import { CharacterSheetData, AttributeEntry } from '../../types';
import { RulesData } from '../../types/rules';
import { generateId } from '../factories';

/**
 * Checks for structural or cost differences in attributes and sets up a migration if needed.
 * Returns true if a migration is pending/triggered, false otherwise.
 */
export const checkAndTriggerAttributeMigration = (newState: CharacterSheetData, rules: RulesData): boolean => {
    const ruleAttributes = rules.definitions.attributes;
    if (!ruleAttributes) return false;

    let hasStructuralDifference = false;
    const currentCategories = Object.keys(newState.attributes || {});
    const ruleCategories = Object.keys(ruleAttributes);

    // 1. Check Primary Categories
    if (currentCategories.length !== ruleCategories.length || !currentCategories.every(c => ruleCategories.includes(c))) {
        hasStructuralDifference = true;
    } else {
        // 2. Check Primary Attribute Names
        for (const cat of ruleCategories) {
            // Important: consistent name filtering (ignore empty strings/spacers for comparison)
            const currentNames = (newState.attributes[cat] || []).map(a => a.name).filter(n => n && n.trim() !== "").sort();
            const ruleNames = (ruleAttributes[cat] || []).filter(n => n && n.trim() !== "").sort();
            if (currentNames.length !== ruleNames.length || !currentNames.every((val, index) => val === ruleNames[index])) {
                hasStructuralDifference = true;
                break;
            }
        }
    }

    // 3. Check Secondary Attributes (only if primary match and secondary rules exist)
    if (!hasStructuralDifference && rules.definitions.secondaryAttributes) {
        const ruleSecAttributes = rules.definitions.secondaryAttributes;
        // Only consider secondary categories that are valid (exist in primary attributes)
        // to match applyRulesToState and reconcileSecondaryAttributes logic.
        const validRuleSecCategories = Object.keys(ruleSecAttributes).filter(cat => ruleCategories.includes(cat));
        const currentSecCategories = Object.keys(newState.secondaryAttributes || {}).filter(cat => (newState.secondaryAttributes[cat] || []).length > 0);

        if (currentSecCategories.length !== validRuleSecCategories.length || !validRuleSecCategories.every(c => currentSecCategories.includes(c))) {
            hasStructuralDifference = true;
        } else {
            for (const cat of validRuleSecCategories) {
                const currentNames = (newState.secondaryAttributes[cat] || []).map(a => a.name).filter(n => n && n.trim() !== "").sort();
                const ruleNames = (ruleSecAttributes[cat] || []).filter(n => n && n.trim() !== "").sort();
                if (currentNames.length !== ruleNames.length || !currentNames.every((val, index) => val === ruleNames[index])) {
                    hasStructuralDifference = true;
                    break;
                }
            }
        }
    }

    const currentCost = newState.xpCosts?.attributeFactor || 6;

    // Only trigger migration if:
    // - There is a structural difference (names, categories)
    // - Character is NOT in creation mode
    // - Character is NOT already in migration mode
    // - Character is NOT "empty/new" (has spent some XP or has non-zero attribute values)
    //   -> If it's a fresh character, we should just apply the rules silently.
    
    const hasSpentXP = (parseInt(newState.experience.spent) || 0) > 0;
    const hasAttributeValues = Object.values(newState.attributes).some(cat => cat.some(a => (parseInt(a.val1) || 0) > 0 || (parseInt(a.val2) || 0) > 0));
    const isFreshCharacter = !hasSpentXP && !hasAttributeValues;

    if (hasStructuralDifference && !newState.creationConfig?.active && !newState.attributeMigrationMode && !isFreshCharacter) {
        if (!newState.syncInfo) newState.syncInfo = {};
        newState.syncInfo.pendingAttributeMigration = {
            newRulesAttributes: JSON.parse(JSON.stringify(ruleAttributes)),
            newRulesSecondary: rules.definitions.secondaryAttributes ? JSON.parse(JSON.stringify(rules.definitions.secondaryAttributes)) : {},
            oldAttributeFactor: currentCost
        };
        return true;
    } else if (hasStructuralDifference && (newState.creationConfig?.active || isFreshCharacter)) {
        // For fresh characters or during creation, we don't trigger a "pending" migration, 
        // we allow reconcileAttributes to just do its job.
        if (newState.syncInfo?.pendingAttributeMigration) {
            delete newState.syncInfo.pendingAttributeMigration;
        }
        return false; 
    } else if (!hasStructuralDifference && newState.syncInfo?.pendingAttributeMigration) {
        delete newState.syncInfo.pendingAttributeMigration;
    }

    return false;
};

/**
 * Reconstructs main attributes based on rules definitions.
 * Preserves dots and values while attaching correct rules-based properties.
 * 
 * @param newState - The current draft state
 * @param rules - The rules containing attribute definitions
 */
export const reconcileAttributes = (newState: CharacterSheetData, rules: RulesData) => {
    if (newState.syncInfo?.pendingAttributeMigration) {
        return; // Skip updating attributes and categories while migration is pending
    }

    const ruleAttributes = rules.definitions.attributes;
    if (!ruleAttributes) return;

    // Build a global pool of existing attributes to handle moves between categories
    const attributePool: { entry: AttributeEntry; originalCategory: string }[] = [];
    Object.keys(newState.attributes || {}).forEach(cat => {
        (newState.attributes[cat] || []).forEach(entry => {
            attributePool.push({ entry, originalCategory: cat });
        });
    });

    const isMigrationMode = !!newState.attributeMigrationMode;

    // A. Main Attributes Reconciliation
    const newAttributes: Record<string, AttributeEntry[]> = {};
    const consumedIds = new Set<string>();

    Object.keys(ruleAttributes).forEach(category => {
        const definedNames = ruleAttributes[category];
        
        const syncedAttributes = definedNames.map(name => {
            // Find in pool (across ALL categories)
            const poolIndex = attributePool.findIndex(p => p.entry.name === name && !consumedIds.has(p.entry.id));

            if (poolIndex !== -1) {
                const found = attributePool[poolIndex];
                consumedIds.add(found.entry.id);
                // Remove from pool so it's not reused or kept as "remaining"
                attributePool.splice(poolIndex, 1);
                return { ...found.entry, name };
            } else {
                return {
                    id: generateId(), name, val1: "0", val2: "", val3: "",
                    creationVal1: 0, creationVal2: 0, creationVal3: 0
                };
            }
        });

        newAttributes[category] = syncedAttributes;
    });

    // If NOT in migration mode, keep remaining attributes in their respective categories
    if (!isMigrationMode) {
        attributePool.forEach(item => {
            if (!newAttributes[item.originalCategory]) {
                newAttributes[item.originalCategory] = [];
            }
            newAttributes[item.originalCategory].push(item.entry);
        });
    }

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
    if (newState.syncInfo?.pendingAttributeMigration) {
        // Skip updating secondary attributes while a migration is pending
        return;
    }

    const ruleSecondary = rules.definitions.secondaryAttributes || {};
    
    // Build a global pool of existing secondary attributes
    const secondaryPool: { entry: AttributeEntry; originalCategory: string }[] = [];
    Object.keys(newState.secondaryAttributes || {}).forEach(cat => {
        (newState.secondaryAttributes[cat] || []).forEach(entry => {
            secondaryPool.push({ entry, originalCategory: cat });
        });
    });

    const isMigrationMode = !!newState.attributeMigrationMode;

    const newSecondary: Record<string, AttributeEntry[]> = {};
    const consumedIds = new Set<string>();

    const allCategories = new Set([
        ...Object.keys(rules.definitions.attributes || {}),
        ...Object.keys(newState.secondaryAttributes || {})
    ]);

    allCategories.forEach(category => {
        const definedNames = ruleSecondary[category] || [];
        
        const syncedSecondary = definedNames.map(name => {
            // Find in pool (across ALL categories)
            const poolIndex = secondaryPool.findIndex(p => p.entry.name === name && !consumedIds.has(p.entry.id));

            if (poolIndex !== -1) {
                const found = secondaryPool[poolIndex];
                consumedIds.add(found.entry.id);
                secondaryPool.splice(poolIndex, 1);
                return { ...found.entry, name };
            } else {
                return { id: generateId(), name, val1: "0", val2: "", val3: "", creationVal1: 0, creationVal2: 0, creationVal3: 0 };
            }
        });

        newSecondary[category] = syncedSecondary;
    });

    // If NOT in migration mode, keep remaining secondary attributes
    if (!isMigrationMode) {
        secondaryPool.forEach(item => {
            if (!newSecondary[item.originalCategory]) {
                newSecondary[item.originalCategory] = [];
            }
            newSecondary[item.originalCategory].push(item.entry);
        });
    }

    newState.secondaryAttributes = newSecondary;
};
