import { CharacterSheetData } from '../../types';
import { RulesData } from '../../types/rules';
import { normalizeString } from '../stringUtils';
import { mergeLibraries } from '../libraryMerger';
import { logger } from '../logger';

/**
 * Automatically injects imposed specializations from the campaign library
 * if the character meets the skill requirements.
 */
export const reconcileImposedSpecializations = (newState: CharacterSheetData, rules: RulesData) => {
    const hybridSpecs = mergeLibraries(newState.specializationLibrary || [], rules.libraries?.specializations || []);
    const imposedLibrarySpecs = hybridSpecs
        .filter(m => m.entry.isImposed && m.entry.isActive !== false)
        .map(m => m.entry);

    // Always clear and rebuild to avoid stale data
    newState.imposedSpecializations = {};
    if (imposedLibrarySpecs.length === 0) return;

    const flatSkills = Object.values(newState.skills).flat().filter(s => s && s.name);
    const librarySkills = rules.libraries?.skills || [];

    logger.log(`[Reconciler] Reconciling ${imposedLibrarySpecs.length} imposed specs against ${flatSkills.length} skills`);

    imposedLibrarySpecs.forEach(ls => {
        // Resolve target skill names from the library if they are provided as IDs
        const targetSkillNamesNormal = librarySkills
            .filter(s => ls.skillIds.includes(s.id))
            .map(s => normalizeString(s.name));

        // Also include any IDs that might be names directly (legacy/manual)
        const targetIdsAndNamesNormal = [
            ...ls.skillIds.map(id => normalizeString(id)),
            ...targetSkillNamesNormal
        ];

        const matchingCharacterSkills = flatSkills.filter(cs => {
            const normalizedCSName = normalizeString(cs.name);
            const normalizedCSVariant = cs.variant ? normalizeString(cs.variant) : '';

            return ls.skillIds.includes(cs.id) ||
                (cs.definitionId && ls.skillIds.includes(cs.definitionId)) ||
                targetIdsAndNamesNormal.includes(normalizedCSName) ||
                (normalizedCSVariant && targetIdsAndNamesNormal.includes(normalizedCSVariant));
        });

        matchingCharacterSkills.forEach(skill => {
            const level = skill.value || 0;
            if (level >= ls.defaultMinLevel) {
                if (!newState.imposedSpecializations![skill.id]) {
                    newState.imposedSpecializations![skill.id] = [];
                }

                // Double check for duplicates (shouldn't happen with fresh reset but to be safe with name aliases)
                const alreadyPresent = newState.imposedSpecializations![skill.id].some(
                    ci => normalizeString(ci.name) === normalizeString(ls.name)
                );

                if (!alreadyPresent) {
                    newState.imposedSpecializations![skill.id].push({
                        name: ls.name,
                        minLevel: ls.defaultMinLevel
                    });
                }
            }
        });
    });
};
