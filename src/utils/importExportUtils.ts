import { CharacterSheetData, LibraryEntry, LibrarySkillEntry, LibrarySpecializationEntry } from '../types';

/**
 * Interface pour la détection de conflits entre données locales et importées.
 */
export interface DataConflict {
    type: 'skill' | 'trait' | 'specialization';
    key: string;
    name: string;
    current: any;
    incoming: any;
}

/**
 * Crée un modèle vierge (template) à partir d'une structure de données existante.
 * Réinitialise toutes les valeurs personnelles du personnage tout en conservant la structure.
 */
export const createTemplateFromData = (source: CharacterSheetData): CharacterSheetData => {
    const clean = JSON.parse(JSON.stringify(source));

    // Reset Header
    Object.keys(clean.header).forEach(k => clean.header[k as keyof typeof clean.header] = "");

    // Reset XP
    clean.experience = { gain: '0', spent: '0', rest: '0' };
    clean.xpLogs = [];
    clean.appLogs = [];

    // Reset Attributes Values
    if (clean.attributes) {
        Object.keys(clean.attributes).forEach(cat => {
            if (Array.isArray(clean.attributes[cat])) {
                clean.attributes[cat].forEach((attr: any) => {
                    attr.val1 = ""; attr.val2 = ""; attr.val3 = "";
                    attr.creationVal1 = 0; attr.creationVal2 = 0; attr.creationVal3 = 0;
                });
            }
        });
    }

    // Reset Skills Values
    Object.keys(clean.skills).forEach(cat => {
        const skillList = clean.skills[cat as keyof typeof clean.skills];
        if (Array.isArray(skillList)) {
            skillList.forEach((skill: any) => {
                skill.value = 0;
                skill.creationValue = 0;
                skill.current = 0;
            });
        }
    });

    // Reset Combat
    clean.combat.weapons.forEach((w: any) => { w.weapon = ""; w.level = ""; w.init = ""; w.attack = ""; w.damage = ""; w.parry = ""; });
    clean.combat.armor.forEach((a: any) => { a.type = ""; a.protection = ""; a.weight = ""; });
    clean.combat.stats = { agility: '', dexterity: '', force: '', size: '' };

    // Reset Page 2 Details
    clean.page2.lieux_importants = "";
    clean.page2.contacts = "";
    clean.page2.reputation.fill({ reputation: '', lieu: '', valeur: '' });
    clean.page2.connaissances = "";
    clean.page2.valeurs_monetaires = "";
    clean.page2.armes_list = "";
    clean.page2.avantages.fill({ name: '', value: '' });
    clean.page2.desavantages.fill({ name: '', value: '' });
    clean.page2.equipement = "";
    clean.page2.notes = "";
    clean.page2.characterImage = "";
    clean.page2.characterImageId = undefined;

    // Reset Specializations
    clean.specializations = {};

    // Counters
    clean.counters.volonte.value = 3; clean.counters.volonte.current = 0;
    clean.counters.confiance.value = 3; clean.counters.confiance.current = 0;
    clean.counters.custom.forEach((c: any) => { c.value = 0; c.current = 0; });

    // Reset Specializations Library
    clean.specializationLibrary = [];

    // Disable creation mode
    clean.creationConfig.active = false;

    return clean;
};

/**
 * Détecte les conflits entre les bibliothèques locales et les données importées.
 */
export const detectConflicts = (
    currentSkills: LibrarySkillEntry[],
    incomingSkills: LibrarySkillEntry[],
    currentTraits: LibraryEntry[],
    incomingTraits: LibraryEntry[],
    currentSpecs: LibrarySpecializationEntry[] = [],
    incomingSpecs: LibrarySpecializationEntry[] = []
) => {
    const conflicts: DataConflict[] = [];

    // 1. Detect Skill Conflicts
    const currentSkillMap = new Map(currentSkills.map(s => [s.name.trim().toLowerCase(), s]));
    incomingSkills.forEach(newItem => {
        const normName = newItem.name.trim().toLowerCase();
        if (currentSkillMap.has(normName)) {
            const existingItem = currentSkillMap.get(normName)!;
            const desc1 = (existingItem.description || '').trim();
            const desc2 = (newItem.description || '').trim();

            if (desc1 !== desc2) {
                conflicts.push({
                    type: 'skill',
                    key: `skill_${normName}`,
                    name: existingItem.name,
                    current: existingItem,
                    incoming: newItem
                });
            }
        }
    });

    // 2. Detect Trait Conflicts
    const currentTraitMap = new Map(currentTraits.map(t => [t.name.trim().toLowerCase(), t]));
    incomingTraits.forEach(newItem => {
        const normName = newItem.name.trim().toLowerCase();
        if (currentTraitMap.has(normName)) {
            const existingItem = currentTraitMap.get(normName)!;

            const diffDesc = (existingItem.description || '').trim() !== (newItem.description || '').trim();
            const diffCost = existingItem.cost !== newItem.cost;
            const diffType = existingItem.type !== newItem.type;
            const diffEffects = JSON.stringify(existingItem.effects || []) !== JSON.stringify(newItem.effects || []);

            if (diffDesc || diffCost || diffType || diffEffects) {
                conflicts.push({
                    type: 'trait',
                    key: `trait_${normName}`,
                    name: existingItem.name,
                    current: existingItem,
                    incoming: newItem
                });
            }
        }
    });

    // 3. Detect Specialization Conflicts
    const currentSpecMap = new Map((currentSpecs || []).map(s => [s.name.trim().toLowerCase(), s]));
    (incomingSpecs || []).forEach(newItem => {
        const normName = newItem.name.trim().toLowerCase();
        if (currentSpecMap.has(normName)) {
            const existingItem = currentSpecMap.get(normName)!;

            const diffDesc = (existingItem.description || '').trim() !== (newItem.description || '').trim();
            const diffLevel = existingItem.defaultMinLevel !== newItem.defaultMinLevel;
            const diffSkills = JSON.stringify([...(existingItem.skillIds || [])].sort()) !==
                JSON.stringify([...(newItem.skillIds || [])].sort());

            if (diffDesc || diffLevel || diffSkills) {
                conflicts.push({
                    type: 'specialization',
                    key: `spec_${normName}`,
                    name: existingItem.name,
                    current: existingItem,
                    incoming: newItem
                });
            }
        }
    });

    return conflicts;
};

/**
 * Fusion intelligente de tableaux d'objets (traits ou compétences).
 */
export const smartMerge = <T extends { name: string }>(
    current: T[],
    incoming: T[],
    resolutions: Record<string, 'keep_current' | 'replace'>,
    prefix: 'skill' | 'trait' | 'specialization'
) => {
    const finalMap = new Map<string, T>();

    // 1. Add all existing
    current.forEach(s => {
        finalMap.set(s.name.trim().toLowerCase(), s);
    });

    // 2. Process incoming
    incoming.forEach(newItem => {
        const normName = newItem.name.trim().toLowerCase();
        const resolutionKey = `${prefix}_${normName}`;

        if (finalMap.has(normName)) {
            const decision = resolutions[resolutionKey];
            if (decision === 'replace') {
                finalMap.set(normName, newItem);
            }
        } else {
            finalMap.set(normName, newItem);
        }
    });

    return Array.from(finalMap.values()).sort((a, b) => a.name.localeCompare(b.name));
};
