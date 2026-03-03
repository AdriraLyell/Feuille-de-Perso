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
                const isMystic = mysticAbilityId || libMatch.tags?.some(tag => normalizeString(tag) === 'mystique');

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
 * Cleanup redundant local library entries that are exact matches of official ones.
 */
export const reconcileCleanup = (newState: CharacterSheetData, currentState: CharacterSheetData, rules: RulesData) => {
    if (!rules.libraries) return;

    const isRedundant = (local: any, officialList: any[]) => {
        // Un élément explicitement marqué comme "customisé" ne doit jamais être supprimé
        if (local.isCustomized) return false;

        return officialList.some(off => {
            if (normalizeString(off.name) !== normalizeString(local.name)) return false;

            // Types mapping: vertu == avantage, tare == desavantage
            if (off.type && local.type) {
                const mapType = (t: string) => {
                    const low = t.toLowerCase();
                    if (low === 'vertu') return 'avantage';
                    if (low === 'tare' || low === 'défaut' || low === 'defaut') return 'desavantage';
                    return low;
                };
                if (mapType(off.type) !== mapType(local.type)) return false;
            }

            // Robust cost/value match (treat '2' and 2 as equal, fallback to string if NaN)
            const offCostVal = off.cost !== undefined ? off.cost : off.value;
            const locCostVal = local.cost !== undefined ? local.cost : local.value;
            const offCostNum = Number(offCostVal);
            const locCostNum = Number(locCostVal);

            if (!isNaN(offCostNum) && !isNaN(locCostNum)) {
                if (offCostNum !== locCostNum) return false;
            } else {
                // If either is NaN (e.g. "1-3 pts"), fallback to stripped string comparison
                const stripText = (s: string | number | null | undefined) => String(s || '').replace(/\s|pts?/gi, '').toLowerCase();
                if (stripText(offCostVal) !== stripText(locCostVal)) return false;
            }

            // Normalise traits tags into a sorted array for comparison
            const offTagsList = (Array.isArray(off.tags) ? off.tags.map(normalizeString).sort() : []) as string[];
            const locTagsList = (Array.isArray(local.tags)
                ? local.tags.map(normalizeString).sort()
                : (local.tag ? [normalizeString(local.tag)] : [])) as string[];

            if (JSON.stringify(offTagsList) !== JSON.stringify(locTagsList)) return false;

            // Robust pointsLabel match (strip non-digits to handle "2 pts" vs "2")
            const normalizeLabel = (l?: string) => String(l || '').replace(/\D/g, '');
            if (normalizeLabel(off.pointsLabel) !== normalizeLabel(local.pointsLabel)) return false;

            // Robust Effects Comparison (ignore IDs, ignore property order, drop empty)
            const simplifyEffects = (effects: any[]) => (effects || []).map(eff => {
                const { id: _id, definitionId: _definitionId, formulaId: _formulaId, ...rest } = eff; // skip IDs
                return JSON.stringify(Object.keys(rest).sort().reduce((obj: Record<string, string>, key) => {
                    const typedRest = rest as Record<string, any>;
                    // Only keep properties that have real value
                    if (typedRest[key] !== '' && typedRest[key] !== undefined && typedRest[key] !== null) {
                        obj[key] = String(typedRest[key]); // Force string to bypass 1 vs "1"
                    }
                    return obj;
                }, {} as Record<string, string>));
            }).sort();

            const offEff = simplifyEffects(off.effects);
            const locEff = simplifyEffects(local.effects);

            // Protect metadata: if local has mysticAbilityId or isVariable, and official doesn't match, keep it
            if (local.mysticAbilityId && off.mysticAbilityId !== local.mysticAbilityId) return false;
            if (Boolean(local.isVariable) !== Boolean(off.isVariable)) return false;

            return JSON.stringify(offEff) === JSON.stringify(locEff);
        });
    };

    // 1. Clean Traits Library
    if (currentState.library && rules.libraries.traits) {
        newState.library = currentState.library.filter(l => !isRedundant(l, rules.libraries.traits!));
    }

    // 2. Clean Skill Library (remove local copies of official skills)
    if (currentState.skillLibrary && rules.libraries.skills) {
        newState.skillLibrary = currentState.skillLibrary.filter(l => !isRedundant(l, rules.libraries.skills!));
    }

    // 3. Clean Specialization Library
    if (currentState.specializationLibrary && rules.libraries.specializations) {
        newState.specializationLibrary = currentState.specializationLibrary.filter(l => !isRedundant(l, rules.libraries.specializations!));
    }

    // 4. Clean Background Library
    if (currentState.backgroundLibrary && rules.libraries.backgrounds) {
        newState.backgroundLibrary = currentState.backgroundLibrary.filter(l => !isRedundant(l, rules.libraries.backgrounds!));
    }

    // 5. Re-inject official libraries (needed by getAggregateDetails for mysticAbilityId fallback)
    if (rules.libraries.skills) {
        newState.skillLibrary = rules.libraries.skills;
    }
    if (rules.libraries.formulas) {
        newState.formulaLibrary = rules.libraries.formulas;
    }
};
