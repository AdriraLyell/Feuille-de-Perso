import { CharacterSheetData } from '../../types';
import { normalizeString } from '../stringUtils';

/**
 * Migration V6: Restaure les liens mysticAbilityId qui ont pu être perdus 
 * lors de la réconciliation trop agressive.
 * 
 * Stratégie :
 * - La skillLibrary du personnage est la source de vérité pour savoir quels 
 *   skills mystiques ont un mysticAbilityId.
 * - Les instances de compétences sur la fiche sont re-linkées depuis la skillLibrary
 *   (par id ou par nom normalisé).
 * - Les traits Avantages/Désavantages liés à une mysticAbility (via le chemin
 *   mysticAbilityId OU un tag "Mystique") sont aussi restaurés.
 */
export const restoreMysticLinks = (data: CharacterSheetData): void => {

    // 1. Construire la map skillLibrary : nom normalisé → mysticAbilityId
    //    et defId → mysticAbilityId
    const libByName = new Map<string, string>();
    const libById = new Map<string, string>();

    if (data.skillLibrary && Array.isArray(data.skillLibrary)) {
        data.skillLibrary.forEach(libSkill => {
            if (libSkill.mysticAbilityId) {
                if (libSkill.name) {
                    libByName.set(normalizeString(libSkill.name), libSkill.mysticAbilityId);
                }
                libById.set(libSkill.id, libSkill.mysticAbilityId);
            }
        });
    }

    // 2. Réparer les instances de compétences sur la fiche depuis la skillLibrary
    if (data.skills && (libByName.size > 0 || libById.size > 0)) {
        Object.values(data.skills).forEach(skillList => {
            if (Array.isArray(skillList)) {
                skillList.forEach((skill: any) => {
                    if (skill.mysticAbilityId) return; // déjà linké

                    // Priorité 1 : match par definitionId
                    if (skill.definitionId && libById.has(skill.definitionId)) {
                        skill.mysticAbilityId = libById.get(skill.definitionId);
                        return;
                    }

                    // Priorité 2 : match par nom normalisé
                    if (skill.name) {
                        const norm = normalizeString(skill.name);
                        if (libByName.has(norm)) {
                            skill.mysticAbilityId = libByName.get(norm);
                        }
                    }
                });
            }
        });
    }

    // 3. Construire la map abilities (id mysticAbility → true) 
    //    pour valider les liens mystiques des traits
    const validAbilityIds = new Set<string>();
    if (data.mysticAbilities && Array.isArray(data.mysticAbilities)) {
        data.mysticAbilities.forEach(ability => {
            if (ability.id) validAbilityIds.add(ability.id);
        });
    }

    // 4. Réparer les Avantages — s'assurer que tag = 'Mystique' si mysticAbilityId est présent
    if (data.page2?.avantages && Array.isArray(data.page2.avantages)) {
        data.page2.avantages.forEach(trait => {
            if (trait.mysticAbilityId && validAbilityIds.has(trait.mysticAbilityId)) {
                if (!trait.tag || trait.tag === '') {
                    trait.tag = 'Mystique';
                }
            }
        });
    }

    // 5. Idem pour les Désavantages
    if (data.page2?.desavantages && Array.isArray(data.page2.desavantages)) {
        data.page2.desavantages.forEach(trait => {
            if (trait.mysticAbilityId && validAbilityIds.has(trait.mysticAbilityId)) {
                if (!trait.tag || trait.tag === '') {
                    trait.tag = 'Mystique';
                }
            }
        });
    }
};
