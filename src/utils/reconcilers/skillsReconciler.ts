import { CharacterSheetData, DotEntry } from '../../types';
import { RulesData } from '../../types/rules';
import { generateId } from '../factories';
import { normalizeString } from '../stringUtils';
import { getSkillCategory } from '../stateAccessors';

/**
 * Synchronizes skills and backgrounds with rule definitions.
 * Simplified for Phase 2: Metadata (descriptions, names) are resolved at runtime.
 * This reconciler only handles structural presence and ID mapping.
 */

/**
 * Phase 1: Processing standard skill categories
 */
function processSkillCategories(
    currentState: CharacterSheetData,
    rules: RulesData
): Record<string, DotEntry[]> {
    const ruleSkills = rules.definitions.skills || {};
    const newSkills: Record<string, DotEntry[]> = {};

    Object.keys(ruleSkills).forEach(category => {
        const definedNames = ruleSkills[category] || [];
        const existingEntries: DotEntry[] = getSkillCategory(currentState, category);

        const processedNames = new Set<string>();
        const consumedIds = new Set<string>();

        // A. Handle defined skills (Rules)
        const syncedSkills = definedNames.flatMap(name => {
            // Spacer
            if (!name || name.trim() === "") {
                const spacerCandidate = existingEntries.find(e => !consumedIds.has(e.id) && (!e.name || e.name.trim() === ""));
                if (spacerCandidate) {
                    consumedIds.add(spacerCandidate.id);
                    return [spacerCandidate];
                }
                return [{ id: generateId(), name: "", value: 0, creationValue: 0, max: 0, variant: "" } as DotEntry];
            }

            processedNames.add(name.toLowerCase());

            const catDef = rules.definitions.skillCategories?.find(c => c.id === category);
            const isCounterCat = catDef?.behavior === 'Compteur';
            const isBgCat = catDef?.behavior === 'Arrière-plan';

            // Find definition in libraries for ID mapping
            const libSkill = (rules.libraries?.skills?.find(s => s && normalizeString(s.name) === normalizeString(name)))
                || (rules.libraries?.mysticAbilities?.find(s => s && normalizeString(s.name) === normalizeString(name)))
                || (isCounterCat ? rules.libraries?.counters?.find(s => s && normalizeString(s.name) === normalizeString(name)) : undefined);
            const definitionId = libSkill?.id;

            // Matching logic: definitionId preferred, name fallback
            const matchingExisting = existingEntries.filter(e =>
                !consumedIds.has(e.id) && (
                    (definitionId && e.definitionId === definitionId) ||
                    (!e.definitionId && normalizeString(e.name) === normalizeString(name))
                )
            );

            const max = isBgCat ? 5 : (rules.configurations?.global?.maxSkillScore || 10);
            const libSkillObj = libSkill as Record<string, unknown> | undefined;
            const libMax = Number(libSkillObj?.maxValue || libSkillObj?.max || max);

            if (matchingExisting.length > 0) {
                return matchingExisting.map(existing => {
                    consumedIds.add(existing.id);
                    
                    // Specific logic for counters: ID must match rule key if possible
                    let targetId = existing.id as string;
                    if (isCounterCat && rules.definitions.counters) {
                        const counterKey = Object.keys(rules.definitions.counters).find(k => normalizeString(rules.definitions.counters[k].name) === normalizeString(name));
                        if (counterKey) targetId = counterKey;
                    }

                    return {
                        ...existing,
                        id: targetId,
                        name, // Keep official name
                        definitionId,
                        max: libMax // Sync max from library if present
                    } as DotEntry;
                });
            } else {
                // New skill from rules
                const targetId = generateId();
                if (isCounterCat && rules.definitions.counters) {
                    const counterKey = Object.keys(rules.definitions.counters).find(k => normalizeString(rules.definitions.counters[k].name) === normalizeString(name));
                    if (counterKey) {
                        return [{
                            id: counterKey,
                            name,
                            value: 0,
                            creationValue: 0,
                            max: libMax,
                            definitionId
                        }] as DotEntry[];
                    }
                }

                return [{
                    id: targetId,
                    name,
                    value: 0,
                    creationValue: 0,
                    max: libMax,
                    definitionId
                }] as DotEntry[];
            }
        });

        // B. Keep remaining skills that are player-added, library-linked, or have value
        const remainingSkills = existingEntries.filter(e =>
            !consumedIds.has(e.id) &&
            ((e.value || 0) > 0 || e.variant !== undefined || e.playerAdded || e.definitionId || e.mysticAbilityId)
        );

        newSkills[category] = [...syncedSkills, ...remainingSkills];
    });

    // Handle legacy categories not defined in ruleSkills but present in state
    const allKnownCats = new Set([...Object.keys(ruleSkills), ...Object.keys(currentState.skills)]);
    allKnownCats.forEach(cat => {
        if (!newSkills[cat]) {
            newSkills[cat] = currentState.skills[cat] || [];
        }
    });

    return newSkills;
}

/**
 * Phase 2: Backgrounds Logic & Deduping
 */
function processBackgrounds(
    currentState: CharacterSheetData,
    rules: RulesData,
    newSkills: Record<string, DotEntry[]>
): void {
    const dynamicBgCat = rules.definitions.skillCategories?.find(c => c.behavior === 'Arrière-plan')?.id || 'Col_Comp_8';
    const definedInSkills = rules.definitions.skills?.[dynamicBgCat] || [];
    const definedInBackgrounds = rules.definitions.backgrounds || [];

    const ruleBackgrounds = Array.from(new Set([...definedInBackgrounds, ...definedInSkills]));

    if (ruleBackgrounds && Array.isArray(ruleBackgrounds) && ruleBackgrounds.length > 0) {
        // Find existing backgrounds in any category
        const allExistingSkills = Object.values(currentState.skills).flat() as DotEntry[];
        const consumedIds = new Set<string>();

        const syncedBgs: DotEntry[] = (ruleBackgrounds as string[]).flatMap(name => {
            const libBg = rules.libraries?.backgrounds?.find(b => normalizeString(b.name) === normalizeString(name));
            const definitionId = libBg?.id;

            const matchingExisting = allExistingSkills.filter(e =>
                !consumedIds.has(e.id) && (
                    (definitionId && e.definitionId === definitionId) ||
                    (!e.definitionId && normalizeString(e.name) === normalizeString(name))
                )
            );

            if (matchingExisting.length > 0) {
                return matchingExisting.map(existing => {
                    consumedIds.add(existing.id);
                    return {
                        ...existing,
                        name,
                        definitionId
                    };
                });
            } else {
                return [{
                    id: generateId(),
                    name,
                    value: 0,
                    creationValue: 0,
                    max: 5,
                    definitionId
                }];
            }
        });

        // Keep remaining backgrounds that are player-added, library-linked, or have value
        const remainingBgs = allExistingSkills.filter(e =>
            !consumedIds.has(e.id) &&
            ((e.value || 0) > 0 || e.variant !== undefined || e.playerAdded || e.definitionId || e.mysticAbilityId) &&
            // Check if it was in a background-like category
            Object.keys(currentState.skills).some(catId => {
                const catDef = rules.definitions.skillCategories?.find(c => c.id === catId);
                return (catDef?.behavior === 'Arrière-plan' || catId === 'arrieres_plans') && 
                       currentState.skills[catId].some(s => s.id === e.id);
            })
        );

        newSkills[dynamicBgCat] = [...syncedBgs, ...remainingBgs];
        
        // Remove these from other categories to avoid duplicates
        const allBgIds = new Set([...syncedBgs, ...remainingBgs].map(s => s.id));
        Object.keys(newSkills).forEach(catId => {
            if (catId !== dynamicBgCat) {
                newSkills[catId] = newSkills[catId].filter(s => !allBgIds.has(s.id));
            }
        });
    }
}

/**
 * Main entry point for skill reconciliation
 */
export const reconcileSkillsAndBackgrounds = (newState: CharacterSheetData, currentState: CharacterSheetData, rules: RulesData) => {
    const newSkills = processSkillCategories(currentState, rules);
    processBackgrounds(currentState, rules, newSkills);

    newState.skills = newSkills;
};
