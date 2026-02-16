import { INITIAL_DATA } from '../../data/initialState';
import { LibrarySkillEntry } from '../../types';

/**
 * Migration: Libraries (skills, traits)
 * - Fix typo skilllibrary → skillLibrary
 * - Pre-fill skillLibrary from INITIAL_DATA
 * - Harvest skills from existing sheet data
 * - Migrate library type names (vertu → avantage)
 * - Ensure isVariable flag is set correctly
 */
export const migrateLibrary = (parsed: any): void => {
    // Fix key casing typo
    if (parsed.skilllibrary && !parsed.skillLibrary) {
        parsed.skillLibrary = parsed.skilllibrary;
        delete parsed.skilllibrary;
    }

    // Pre-fill skillLibrary
    if (!parsed.skillLibrary || parsed.skillLibrary.length === 0) {
        const initialSkillList: LibrarySkillEntry[] = [...INITIAL_DATA.skillLibrary];
        const seenNames = new Set<string>(initialSkillList.map(s => s.name.trim().toLowerCase()));

        // Harvest skills from sheet data
        if (parsed.skills) {
            Object.keys(parsed.skills).forEach(cat => {
                if (cat === 'arrieres_plans') return;
                const skills = parsed.skills[cat] || [];
                skills.forEach((skill: any) => {
                    if (skill.name && skill.name.trim() !== '') {
                        const normalized = skill.name.trim().toLowerCase();
                        if (!seenNames.has(normalized)) {
                            seenNames.add(normalized);
                            initialSkillList.push({
                                id: Math.random().toString(36).substr(2, 9),
                                name: skill.name,
                                defaultCategory: cat,
                                description: "",
                                isVariable: false
                            });
                        }
                    }
                });
            });
        }
        initialSkillList.sort((a, b) => a.name.localeCompare(b.name));
        parsed.skillLibrary = initialSkillList;
    }

    // Update isVariable flag from INITIAL_DATA
    if (parsed.skillLibrary) {
        const defaultVariableStatus = new Map<string, boolean>();
        INITIAL_DATA.skillLibrary.forEach(s => {
            if (s.isVariable) {
                defaultVariableStatus.set(s.name.trim().toLowerCase(), true);
            }
        });

        parsed.skillLibrary.forEach((s: any) => {
            const normalized = s.name.trim().toLowerCase();
            if (defaultVariableStatus.has(normalized) && typeof s.isVariable === 'undefined') {
                s.isVariable = true;
            }
        });
    }

    // Initialize traits library
    if (!parsed.library) {
        parsed.library = [];
    }

    // Migrate library type names
    if (parsed.library) {
        parsed.library = parsed.library.map((l: any) => ({
            ...l,
            type: l.type === 'vertu' ? 'avantage' : (l.type === 'defaut' ? 'desavantage' : l.type),
            tags: Array.isArray(l.tags) ? l.tags : [],
            effects: Array.isArray(l.effects) ? l.effects : []
        }));
    }

    // Initialize mysticAbilities library
    if (!parsed.mysticAbilities) {
        const initialMystic: LibrarySkillEntry[] = (INITIAL_DATA as any).mysticAbilities || [];
        parsed.mysticAbilities = initialMystic.map(m => ({ ...m }));
    }
};
