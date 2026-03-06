import { MigratableData } from './registry';
import { normalizeString } from '../stringUtils';

// Helper for fuzzy plural mapping: removes all 's' at end of words
const ultraNormalize = (name: string): string => {
    return normalizeString(name).split(' ').map(word => word.endsWith('s') ? word.slice(0, -1) : word).join(' ');
};

/**
 * Migration V7: Restaure les liens mysticAbilityId qui ont pu etre perdus.
 * Version amelioree pour gerer les Talents Exceptionnels et les erreurs d'encodage.
 */
export const restoreMysticLinks = (data: MigratableData): void => {
    if (!data) return;

    // 1. Map des habilites par nom normalise (ultra-fuzzy)
    const abilityByName = new Map<string, string>();
    const mysticAbilities = data.mysticAbilities as any[];
    if (mysticAbilities && Array.isArray(mysticAbilities)) {
        mysticAbilities.forEach(ability => {
            if (typeof ability !== 'string' && ability.id && ability.name) {
                const norm = normalizeString(ability.name);
                const ultra = ultraNormalize(ability.name);
                abilityByName.set(norm, ability.id);
                abilityByName.set(ultra, ability.id);
            }
        });
    }

    // 2. Maps de la bibliotheque (Skill Name -> Mystic Ability ID)
    const skillLibByName = new Map<string, string>();
    const skillLibrary = data.skillLibrary as any[];
    if (skillLibrary && Array.isArray(skillLibrary)) {
        skillLibrary.forEach(libSkill => {
            if (libSkill.mysticAbilityId) {
                skillLibByName.set(normalizeString(libSkill.name), libSkill.mysticAbilityId);
            }
        });
    }

    // 3. Reparer les competences
    const skills = data.skills as Record<string, any[]>;
    if (skills) {
        Object.values(skills).forEach(skillList => {
            if (Array.isArray(skillList)) {
                skillList.forEach((skill) => {
                    if (skill && !skill.mysticAbilityId && skill.name) {
                        const norm = normalizeString(skill.name);
                        if (skillLibByName.has(norm)) {
                            skill.mysticAbilityId = skillLibByName.get(norm);
                        }
                    }
                });
            }
        });
    }

    // 4. Reparer les traits (Avantages)
    const repairTraits = (traitList: any[]) => {
        if (!traitList || !Array.isArray(traitList)) return;

        traitList.forEach(trait => {
            if (!trait || !trait.name) return;
            const norm = normalizeString(trait.name);
            const ultra = ultraNormalize(trait.name);

            // Match avec l'habilite (ex: "Talent(s) Exceptionnel(s)")
            if (!trait.mysticAbilityId) {
                if (abilityByName.has(norm)) {
                    trait.mysticAbilityId = abilityByName.get(norm);
                } else if (abilityByName.has(ultra)) {
                    trait.mysticAbilityId = abilityByName.get(ultra);
                }
            }

            // Match indirect avec un skill (ex: "Art de la Cartomancie" -> "Cartomancie")
            if (!trait.mysticAbilityId) {
                for (const [skillName, abilityId] of skillLibByName.entries()) {
                    if (norm.includes(skillName)) {
                        trait.mysticAbilityId = abilityId;
                        break;
                    }
                }
            }

            // Assurer le tag
            if (trait.mysticAbilityId && (!trait.tag || trait.tag === '')) {
                trait.tag = 'Mystique';
            }
        });
    };

    const page2 = data.page2 as Record<string, any[]>;
    if (page2) {
        repairTraits(page2.avantages || []);
        repairTraits(page2.desavantages || []);
    }
};

