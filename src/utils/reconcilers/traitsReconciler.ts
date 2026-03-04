import { CharacterSheetData, TraitEntry } from '../../types';
import { RulesData } from '../../types/rules';
import { normalizeString } from '../stringUtils';

/**
 * Links traits (advantages/disadvantages) to their latest library definitions.
 * Also performs property migration (legacy effects -> direct fields) during load.
 * 
 * @param newState - The current draft state
 * @param currentState - The source state
 * @param rules - The campaign rules
 */
export const reconcileTraits = (newState: CharacterSheetData, currentState: CharacterSheetData, rules: RulesData) => {
    const processTraitList = (list: TraitEntry[], type: 'avantage' | 'desavantage'): TraitEntry[] => {
        if (!list) return [];
        return list.map(existing => {
            const normalizedName = normalizeString(existing.name);
            const libMatch = existing.definitionId
                ? rules.libraries?.traits?.find(t => t.id === existing.definitionId)
                : rules.libraries?.traits?.find(t =>
                    t.type === type && normalizeString(t.name) === normalizedName
                );

            let mysticAbilityId = libMatch?.mysticAbilityId || existing.mysticAbilityId;

            // Fallback: If no mysticAbilityId is linked, try to find an official Mystic Ability with the same name
            // (Used because DB table libraries_traits doesn't host mystic_ability_id but names usually match)
            if (!mysticAbilityId && rules.libraries?.mysticAbilities) {
                const ultraName = normalizedName.split(' ').map(word => word.endsWith('s') ? word.slice(0, -1) : word).join(' ');
                const abilityMatch = rules.libraries.mysticAbilities.find(a => {
                    const normA = normalizeString(a.name);
                    const ultraA = normA.split(' ').map(word => word.endsWith('s') ? word.slice(0, -1) : word).join(' ');
                    return normA === normalizedName || ultraA === ultraName || normA === ultraName || ultraA === normalizedName;
                });

                if (abilityMatch) {
                    mysticAbilityId = abilityMatch.id;
                } else if (rules.libraries?.skills) {
                    // INDIRECT Fallback: if trait name (e.g. "Don de Cartomancie") contains a mystic skill name ("Cartomancie")
                    const skillMatch = rules.libraries.skills.find(s =>
                        s.mysticAbilityId &&
                        (normalizedName.includes(normalizeString(s.name)) || normalizeString(s.name).includes(normalizedName))
                    );
                    if (skillMatch) {
                        mysticAbilityId = skillMatch.mysticAbilityId ?? undefined;
                    }
                }
            }

            if (libMatch) {
                const isMystic = mysticAbilityId || libMatch.isMystic;

                // --- Migration Logic ---
                // We ensure the character trait has the latest flags from the library
                // and we also check if it has legacy effects that need migration.
                const _needsMigration = (libMatch.hasAutoCounter && !existing.hasAutoCounter) ||
                    (libMatch.isXPUpgradeable && !existing.isXPUpgradeable);

                return {
                    ...existing,
                    definitionId: libMatch.id,
                    mysticAbilityId: mysticAbilityId,
                    tag: isMystic ? 'Mystique' : existing.tag,
                    // Copy native properties from library if missing
                    hasAutoCounter: libMatch.hasAutoCounter ?? existing.hasAutoCounter,
                    autoCounterName: libMatch.autoCounterName ?? existing.autoCounterName,
                    isXPUpgradeable: libMatch.isXPUpgradeable ?? existing.isXPUpgradeable
                };
            }

            // Even if not in library, if we found a mystic link, preserve/inject it
            if (mysticAbilityId && mysticAbilityId !== existing.mysticAbilityId) {
                return { ...existing, mysticAbilityId, tag: 'Mystique' };
            }

            return existing;
        });
    };

    if (newState.page2) {
        newState.page2.avantages = processTraitList(currentState.page2.avantages || [], 'avantage');
        newState.page2.desavantages = processTraitList(currentState.page2.desavantages || [], 'desavantage');
    }
}

/**
 * Cleanup or Merge local library entries against official ones.
 * Implements the "Shared Authority" model: MJ forces mechanics, Player forces narration.
 */
export const reconcileCleanup = (newState: CharacterSheetData, currentState: CharacterSheetData, rules: RulesData) => {
    if (!rules.libraries) return;

    // Type-agnostic merge function for traits, skills, etc.
    const mergeAndCleanLocalList = (localList: any[], officialList: any[], isSpecialization = false) => {
        return localList.map(local => {
            const off = officialList.find(o => o.id === local.id || normalizeString(o.name) === normalizeString(local.name));
            if (!off) return local; // No official match, keep local custom item

            // Check if local has any narrative differences compared to official
            const hasDescOverride = local.description !== undefined && local.description !== off.description;

            const localTags = Array.isArray(local.tags) ? local.tags.map(normalizeString).sort() : (local.tag ? [normalizeString(local.tag)] : []);
            const offTags = Array.isArray(off.tags) ? off.tags.map(normalizeString).sort() : [];
            const hasTagsOverride = JSON.stringify(localTags) !== JSON.stringify(offTags) && localTags.length > 0;

            const localVars = Array.isArray(local.variants) ? [...local.variants].sort() : [];
            const offVars = Array.isArray(off.variants) ? [...off.variants].sort() : [];
            const hasVarsOverride = JSON.stringify(localVars) !== JSON.stringify(offVars) && localVars.length > 0;

            const hasNarrativeOverride = hasDescOverride || hasTagsOverride || hasVarsOverride || local.isCustomized;

            if (!hasNarrativeOverride) {
                return null; // Exact same narrative, can be safely purged so the game uses the official one
            }

            // Merge: Override local mechanical fields with official ones, keep local narrative ones
            const merged = { ...local };

            // Apply Narrative overrides (or fallback to official if empty)
            merged.description = local.description !== undefined ? local.description : off.description;
            merged.tags = local.tags && local.tags.length > 0 ? local.tags : off.tags;
            merged.variants = local.variants && local.variants.length > 0 ? local.variants : off.variants;

            // Apply MJ Mechanical Overrides
            const overrideMechanic = (field: string) => {
                if (off[field] !== undefined) merged[field] = off[field];
            };

            if (isSpecialization) {
                overrideMechanic('skillIds');
                overrideMechanic('defaultMinLevel');
                overrideMechanic('isActive');
                overrideMechanic('isImposed');
            } else {
                overrideMechanic('type');
                overrideMechanic('cost');
                overrideMechanic('pointsLabel');
                overrideMechanic('isVariableCost');
                overrideMechanic('effects');
                overrideMechanic('isMystic');
                overrideMechanic('mysticAbilityId');
                overrideMechanic('isVariant');
                overrideMechanic('variantOf');
                overrideMechanic('isVariable');
                overrideMechanic('hasAutoCounter');
                overrideMechanic('autoCounterName');
                overrideMechanic('isXPUpgradeable');
                overrideMechanic('defaultCategory');
            }

            return merged;
        }).filter(Boolean); // Remove nulls
    };

    // 1. Clean & Merge Traits Library
    if (currentState.library && rules.libraries.traits) {
        newState.library = mergeAndCleanLocalList(currentState.library, rules.libraries.traits);
    }

    // 2. Clean & Merge Skill Library
    if (currentState.skillLibrary && rules.libraries.skills) {
        newState.skillLibrary = mergeAndCleanLocalList(currentState.skillLibrary, rules.libraries.skills);
    }

    // 3. Clean & Merge Specialization Library
    if (currentState.specializationLibrary && rules.libraries.specializations) {
        newState.specializationLibrary = mergeAndCleanLocalList(currentState.specializationLibrary, rules.libraries.specializations, true);
    }

    // 4. Clean & Merge Background Library
    if (currentState.backgroundLibrary && rules.libraries.backgrounds) {
        newState.backgroundLibrary = mergeAndCleanLocalList(currentState.backgroundLibrary, rules.libraries.backgrounds);
    }

    // 5. Re-inject official libraries (needed by getAggregateDetails for mysticAbilityId fallback)
    if (rules.libraries.skills) {
        newState.skillLibrary = rules.libraries.skills;
    }
    if (rules.libraries.formulas) {
        newState.formulaLibrary = rules.libraries.formulas;
    }
};
