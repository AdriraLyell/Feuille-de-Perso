
import { RulesData } from '../../types/rules';
import { LibraryEntry, LibrarySkillEntry, LibrarySpecializationEntry } from '../../types/system';

export interface DiffReport {
    hasChanges: boolean;
    details: {
        general: string[];
        attributes: string[];
        skills: string[];
        backgrounds: string[];
        counters: string[];
        libraries: {
            traits: { new: number, conflict: number, identical: number };
            skills: { new: number, conflict: number, identical: number };
            specializations: { new: number, conflict: number, identical: number };
            backgrounds: { new: number, conflict: number, identical: number };
            counters: { new: number, conflict: number, identical: number };
        };
    };
}

export interface ImportOptions {
    sections: {
        general: boolean; // Config creation, xp, theme
        attributes: boolean; // Definitions
        skills: boolean; // Definitions
        backgrounds: boolean; // Definitions
        counters: boolean; // Definitions
        libraries: boolean; // Content
    };
    libraryStrategy: 'ignore' | 'overwrite' | 'copy';
}

const isDifferent = (a: any, b: any) => JSON.stringify(a) !== JSON.stringify(b);

export const calculateDiff = (current: RulesData, candidate: RulesData): DiffReport => {
    const report: DiffReport = {
        hasChanges: false,
        details: {
            general: [],
            attributes: [],
            skills: [],
            backgrounds: [],
            counters: [],
            libraries: {
                traits: { new: 0, conflict: 0, identical: 0 },
                skills: { new: 0, conflict: 0, identical: 0 },
                specializations: { new: 0, conflict: 0, identical: 0 },
                backgrounds: { new: 0, conflict: 0, identical: 0 },
                counters: { new: 0, conflict: 0, identical: 0 }
            }
        }
    };

    // 1. General Config
    if (isDifferent(current.configurations.creation, candidate.configurations.creation)) {
        report.details.general.push("Configuration de création modifiée");
    }
    if (isDifferent(current.configurations.xpCosts, candidate.configurations.xpCosts)) {
        report.details.general.push("Coûts XP modifiés");
    }


    // 2. Attributes
    const attrKeys = new Set([...Object.keys(current.definitions.attributes), ...Object.keys(candidate.definitions.attributes)]);
    attrKeys.forEach(k => {
        if (isDifferent(current.definitions.attributes[k], candidate.definitions.attributes[k])) {
            report.details.attributes.push(`Pavé "${k}" modifié`);
        }
    });

    // 3. Skills
    const skillKeys = new Set([...Object.keys(current.definitions.skills), ...Object.keys(candidate.definitions.skills)]);
    skillKeys.forEach(k => {
        if (isDifferent(current.definitions.skills[k], candidate.definitions.skills[k])) {
            report.details.skills.push(`Catégorie "${k}" modifiée`);
        }
    });

    // 4. Libraries Analysis
    const analyzeLib = <T extends { id: string }>(curr: T[], cand: T[]) => {
        const stats = { new: 0, conflict: 0, identical: 0 };
        const currMap = new Map(curr.map(i => [i.id, i]));

        cand.forEach(item => {
            if (!currMap.has(item.id)) {
                stats.new++;
            } else {
                if (isDifferent(currMap.get(item.id), item)) {
                    stats.conflict++;
                } else {
                    stats.identical++;
                }
            }
        });
        return stats;
    };

    if (candidate.libraries?.traits) {
        report.details.libraries.traits = analyzeLib(current.libraries?.traits || [], candidate.libraries.traits);
    }
    if (candidate.libraries?.skills) {
        report.details.libraries.skills = analyzeLib(current.libraries?.skills || [], candidate.libraries.skills);
    }

    // Calculate Global Change Flag
    report.hasChanges =
        report.details.general.length > 0 ||
        report.details.attributes.length > 0 ||
        report.details.skills.length > 0 ||
        report.details.libraries.traits.new > 0 ||
        report.details.libraries.traits.conflict > 0;
    // ... (add others)

    return report;
};

export const mergeRules = (current: RulesData, candidate: RulesData, options: ImportOptions): RulesData => {
    // Deep clone current to start
    const result: RulesData = JSON.parse(JSON.stringify(current));

    if (options.sections.general) {
        result.configurations.creation = candidate.configurations.creation;
        result.configurations.xpCosts = candidate.configurations.xpCosts;

        // Also card config if present? Assuming included in general
        result.configurations.cards = candidate.configurations.cards;
    }

    if (options.sections.attributes) {
        result.definitions.attributes = candidate.definitions.attributes;
        result.definitions.secondaryAttributes = candidate.definitions.secondaryAttributes;
        result.configurations.global.secondaryAttributes = candidate.configurations.global.secondaryAttributes;
        result.configurations.global.maxAttributeScore = candidate.configurations.global.maxAttributeScore;
    }

    if (options.sections.skills) {
        result.definitions.skills = candidate.definitions.skills;
        result.definitions.labels = candidate.definitions.labels; // Labels usually go with skills definitions
    }

    if (options.sections.backgrounds) {
        result.definitions.backgrounds = candidate.definitions.backgrounds;
    }

    if (options.sections.counters) {
        result.definitions.counters = candidate.definitions.counters;
    }

    // Library Merge Logic
    if (options.sections.libraries) {
        // Ensure library buckets exist
        if (!result.libraries) result.libraries = { traits: [], skills: [], specializations: [], backgrounds: [], counters: [] };

        const mergeLibList = <T extends { id: string }>(curr: T[], cand: T[]) => {
            const map = new Map(curr.map(i => [i.id, i]));

            cand.forEach(item => {
                if (!map.has(item.id)) {
                    // New item
                    map.set(item.id, item);
                } else {
                    // Conflict
                    if (options.libraryStrategy === 'overwrite') {
                        map.set(item.id, item);
                    } else if (options.libraryStrategy === 'copy') {
                        // Create copy with new ID
                        const copy = { ...item, id: crypto.randomUUID() };
                        map.set(copy.id, copy);
                    }
                    // if 'ignore', do nothing
                }
            });
            return Array.from(map.values());
        };

        if (candidate.libraries?.traits) {
            result.libraries.traits = mergeLibList(current.libraries?.traits || [], candidate.libraries.traits);
        }
        if (candidate.libraries?.skills) {
            result.libraries.skills = mergeLibList(current.libraries?.skills || [], candidate.libraries.skills);
        }
    }

    return result;
};
