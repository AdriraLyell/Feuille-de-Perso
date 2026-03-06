import { CharacterSheetData, DotEntry, LibrarySkillEntry } from '../types';
import { RulesData } from '../types/rules';

/**
 * Returns the Mystic Abilities configuration from the rules.
 */
export const getMysticRules = (rules: RulesData | null) => {
    return rules?.configurations?.creation?.mysticAbilities || {
        active: false,
        progressionWithoutTrait: false,
        skillsPerLevel: { "1": 1, "2": 2, "3": 4, "4": 7, "5": -1 }
    };
};

/**
 * Checks if a skill entry is a Mystic Skill (linked to a Mystic Ability).
 */
export const isMysticSkill = (skill: DotEntry | LibrarySkillEntry, library: LibrarySkillEntry[]): string | undefined => {
    // Check if the skill itself has the ID (Library Entry)
    if ('mysticAbilityId' in skill && skill.mysticAbilityId) {
        return skill.mysticAbilityId;
    }

    // Check if the DotEntry matches a library skill that has the ID
    const libSkill = library.find(s => s.name === skill.name);
    return libSkill?.mysticAbilityId || undefined;
};

/**
 * Finds the Trait on the character sheet that corresponds to a Mystic Ability ID.
 */
export const getLinkedTrait = (sheet: CharacterSheetData, mysticAbilityId: string) => {
    return sheet.page2.avantages.find(trait => trait.mysticAbilityId === mysticAbilityId);
};

/**
 * Calculates the maximum number of Mystic Skills allowed for a given Mystic Ability
 * based on the character's Trait level.
 */
export const getMysticCapacity = (sheet: CharacterSheetData, mysticAbilityId: string, rules: RulesData | null): { allowed: number, current: number, traitLevel: number } => {
    const config = getMysticRules(rules);
    if (!config.active) return { allowed: 999, current: 0, traitLevel: 0 };

    const trait = getLinkedTrait(sheet, mysticAbilityId);
    const traitLevel = trait ? (parseInt(trait.value, 10) || 0) : 0;

    // Get limit from config matrix
    const specificLimit = config.skillsPerLevel[traitLevel.toString()];
    // -1 usually means infinite, but we handle it safely. If undefined, default to 0.
    const allowed = (specificLimit === -1) ? 999 : (specificLimit ?? 0);

    // Count skills linked to this ability that have value > 0 (are learned)
    // We scan all skill categories
    // Count skills linked to this ability that have value > 0 (are learned)
    // We scan all skill categories
    let current = 0;
    const allSkills = Object.values(sheet.skills).flat();
    const skillLibrary = rules?.libraries?.skills || []; // Use rules library for definition source

    allSkills.forEach(skill => {
        if (skill.value > 0) {
            // Check linkage via multiple methods
            let isLinked = false;

            // 1. Direct link on skill instance (if copied)
            if ('mysticAbilityId' in skill && skill.mysticAbilityId === mysticAbilityId) {
                isLinked = true;
            }
            // 2. Link via Library definition
            else {
                const libDef = skillLibrary.find(s => s.name === skill.name);
                if (libDef && libDef.mysticAbilityId === mysticAbilityId) {
                    isLinked = true;
                }
            }

            if (isLinked) {
                current++;
            }
        }
    });

    return { allowed, current, traitLevel };
};

/**
 * Validates if a user can INCREASE a Mystic Skill's value.
 * used for existing skills.
 */
export const canIncreaseMysticSkill = (
    sheet: CharacterSheetData,
    skillName: string,
    rules: RulesData | null,
    skillId?: string
): { allowed: boolean, reason?: string } => {
    const config = getMysticRules(rules);
    if (!config.active) return { allowed: true };

    // Try to find the specific instance first to get its mysticAbilityId
    let mysticAbilityId: string | undefined;
    if (skillId) {
        const allSkills = Object.values(sheet.skills).flat();
        const instance = allSkills.find(s => s.id === skillId);
        mysticAbilityId = instance?.mysticAbilityId;
    }

    // Fallback to library if not found on instance
    if (!mysticAbilityId) {
        const libSkill = sheet.skillLibrary?.find(s => s.name === skillName);
        mysticAbilityId = libSkill?.mysticAbilityId || undefined;
    }

    if (!mysticAbilityId) return { allowed: true }; // Not a mystic skill

    // 1. Check Trait Existence
    const trait = getLinkedTrait(sheet, mysticAbilityId);
    if (!trait) {
        return { allowed: false, reason: "Vous devez posséder l'Avantage lié pour augmenter cette compétence." };
    }

    return { allowed: true };
};

/**
 * Validates if a user can LEARN (0 -> 1) a Mystic Skill.
 */
export const canLearnNewMysticSkill = (
    sheet: CharacterSheetData,
    skillName: string,
    rules: RulesData | null,
    isCreationMode: boolean,
    skillId?: string
): { allowed: boolean, reason?: string } => {
    const config = getMysticRules(rules);
    if (!config.active) return { allowed: true };

    let mysticAbilityId: string | undefined;
    if (skillId) {
        const allSkills = Object.values(sheet.skills).flat();
        const instance = allSkills.find(s => s.id === skillId);
        mysticAbilityId = instance?.mysticAbilityId;
    }

    if (!mysticAbilityId) {
        const libSkill = sheet.skillLibrary?.find(s => s.name === skillName);
        mysticAbilityId = libSkill?.mysticAbilityId || undefined;
    }

    if (!mysticAbilityId) return { allowed: true };

    const trait = getLinkedTrait(sheet, mysticAbilityId);
    if (!trait) {
        return { allowed: false, reason: "Nécessite l'Avantage lié." };
    }

    // Progression Without Trait (XP Mode Override)
    if (config.progressionWithoutTrait && !isCreationMode) {
        return { allowed: true }; // Free pass on capacity
    }

    // Strict Capacity Check
    const { allowed, current } = getMysticCapacity(sheet, mysticAbilityId, rules);

    // We are adding a new one, so check if current < allowed
    if (current >= allowed) {
        return { allowed: false, reason: `Capacité atteinte (${current}/${allowed}). Augmentez l'Avantage.` };
    }

    return { allowed: true };
};
