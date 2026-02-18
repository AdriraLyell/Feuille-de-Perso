import { CharacterSheetData, DotEntry } from '../../types';
import { RulesData } from '../../types/rules';
import { generateId } from '../factories';
import { normalizeString } from '../stringUtils';
import { getSkillCategory } from '../stateAccessors';

/**
 * Synchronizes skills and backgrounds with rule definitions.
 * Extracted from rulesReconciler.ts for better maintainability.
 */
/**
 * Phase 1: Processing standard skill categories
 */
function processSkillCategories(
    newState: CharacterSheetData,
    currentState: CharacterSheetData,
    rules: RulesData
): Record<string, DotEntry[]> {
    const ruleSkills = rules.definitions.skills || {};
    const newSkills: Record<string, DotEntry[]> = {};
    const processedNamesGlobal = new Set<string>();

    Object.keys(ruleSkills).forEach(category => {
        const definedNames = ruleSkills[category] || [];
        const existingEntries: DotEntry[] = getSkillCategory(currentState, category);

        const catDef = rules.definitions.skillCategories?.find(c => c.id === category);
        const behavior = catDef?.behavior;
        const isCounterCat = behavior === 'Compteur';
        const isBgCat = behavior === 'Arrière-plan';

        const processedNames = new Set<string>();
        const consumedIds = new Set<string>();

        // A. Handle defined skills (Rules)
        const syncedSkills = definedNames.flatMap(name => {
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

            const libSkill = rules.libraries?.skills?.find(s => s && normalizeString(s.name) === normalizeString(name));
            const definitionId = libSkill?.id;
            const isVariable = libSkill?.isVariable === true;
            const description = libSkill?.description || "";
            const max = isBgCat ? 5 : (rules.configurations?.global?.maxSkillScore || 10);

            let matchingExisting = existingEntries.filter(e =>
                !consumedIds.has(e.id) && (
                    (definitionId && e.definitionId === definitionId) ||
                    (!e.definitionId && normalizeString(e.name) === normalizeString(name))
                )
            );

            if (matchingExisting.length === 0 && definitionId && name && name.trim() !== "") {
                matchingExisting = existingEntries.filter(e =>
                    !consumedIds.has(e.id) &&
                    normalizeString(e.name) === normalizeString(name)
                );
            }

            if (isVariable) {
                if (matchingExisting.length > 0) {
                    return matchingExisting.map(existing => {
                        consumedIds.add(existing.id);
                        return {
                            ...existing,
                            name,
                            definitionId,
                            max,
                            description: description || existing.description
                        };
                    });
                } else {
                    return [{
                        id: generateId(),
                        name,
                        description,
                        value: 0,
                        creationValue: 0,
                        max,
                        variant: "",
                        definitionId
                    }];
                }
            } else {
                const existing = matchingExisting[0];
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
                        definitionId,
                        variant: (existing.variant === "" || existing.variant === undefined) ? undefined : existing.variant
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

        const remainingSkills = existingEntries.filter(e =>
            !consumedIds.has(e.id) &&
            !processedNames.has(e.name) &&
            ((e.value || 0) > 0 || e.variant !== undefined || (e.definitionId && rules.libraries?.skills?.find(s => s.id === e.definitionId)?.isVariable))
        ).map(e => {
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

    const standardCats = [
        'Col_Comp_1', 'Col_Comp_2', 'Col_Comp_3', 'Col_Comp_4',
        'Col_Comp_5', 'Col_Comp_6', 'Col_Comp_7', 'Col_Comp_8', 'Col_Comp_9',
        'competences', 'talents', 'connaissances', 'langues', 'arrieres_plans', 'counters'
    ];
    standardCats.forEach(cat => {
        if (!newSkills[cat]) {
            newSkills[cat] = getSkillCategory(currentState, cat);
        }
    });

    return newSkills;
}

/**
 * Phase 2: Backgrounds Logic & Deduping
 */
function processBackgrounds(
    newState: CharacterSheetData,
    currentState: CharacterSheetData,
    rules: RulesData,
    newSkills: Record<string, DotEntry[]>
): void {
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

            const matchingExisting = allExistingSkills.filter(e =>
            (
                (definitionId && e.definitionId === definitionId) ||
                (!e.definitionId && normalizeString(e.name) === normalizeString(name))
            )
            );

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

        const remainingBgs = allExistingSkills.filter((e: DotEntry) => {
            if (!e || !e.name || namesAddedToBgs.has(e.name)) return false;
            if (e.definitionId && syncedBgs.some(s => s.id === e.id)) return false;

            const wasInBackgroundCat = Object.keys(currentState.skills).some(catId => {
                const catDef = rules.definitions.skillCategories?.find(c => c.id === catId);
                const isBgCat = catDef?.behavior === 'Arrière-plan' || catId === 'Col_Comp_8' || catId === 'arrieres_plans';
                return isBgCat && getSkillCategory(currentState, catId).some((s: DotEntry) => s && s.id === e.id);
            });

            if (wasInBackgroundCat && ((e.value || 0) > 0 || e.variant !== undefined)) {
                namesAddedToBgs.add(e.name);
                return true;
            }
            return false;
        });

        newSkills[dynamicBgCat] = [...syncedBgs, ...remainingBgs];

        const allBgIds = new Set([...syncedBgs, ...remainingBgs].map(s => s.id));

        Object.keys(newSkills).forEach(catId => {
            if (catId !== dynamicBgCat && Array.isArray(newSkills[catId])) {
                newSkills[catId] = newSkills[catId].filter((s: DotEntry) =>
                    !allBgIds.has(s.id)
                );
            }
        });

        if (dynamicBgCat !== 'arrieres_plans' && newSkills['arrieres_plans']) {
            newSkills['arrieres_plans'] = [];
        }
    }
}

/**
 * Synchronizes skills and backgrounds with rule definitions.
 * Extracted from rulesReconciler.ts for better maintainability.
 */
export const reconcileSkillsAndBackgrounds = (newState: CharacterSheetData, currentState: CharacterSheetData, rules: RulesData) => {
    const ruleSkills = rules.definitions.skills;
    if (!ruleSkills) return;

    const newSkills = processSkillCategories(newState, currentState, rules);
    processBackgrounds(newState, currentState, rules, newSkills);

    newState.skills = newSkills;
};
