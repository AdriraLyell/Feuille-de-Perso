
import { RulesData } from '../../types/rules';

export interface FieldDifference {
    field: string;
    label: string;
    prev: unknown;
    next: unknown;
}

export interface LibraryConflict {
    id: string; // Ensure ID is present for field exclusion tracking
    name: string;
    type: string;
    differences: FieldDifference[]; // Structured differences
    current: unknown;
    candidate: unknown;
}

export interface DiffReport {
    hasChanges: boolean;
    details: {
        general: string[];
        attributes: string[];
        skills: string[];
        backgrounds: string[];
        counters: string[];
        libraries: {
            traits: { new: number, conflict: number, identical: number, newItems: { id: string, name: string }[], conflicts: LibraryConflict[] };
            skills: { new: number, conflict: number, identical: number, newItems: { id: string, name: string }[], conflicts: LibraryConflict[] };
            specializations: { new: number, conflict: number, identical: number, newItems: { id: string, name: string }[], conflicts: LibraryConflict[] };
            backgrounds: { new: number, conflict: number, identical: number, newItems: { id: string, name: string }[], conflicts: LibraryConflict[] };
            counters: { new: number, conflict: number, identical: number, newItems: { id: string, name: string }[], conflicts: LibraryConflict[] };
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
    excludedIds?: string[]; // IDs of items to ignore during specific category merge
    fieldExclusions?: Record<string, string[]>; // ItemID -> Fields (names) to KEEP from CURRENT
}

const isDifferent = (a: unknown, b: unknown) => JSON.stringify(a) !== JSON.stringify(b);

const normalizeString = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    return String(val).trim().replace(/\r\n/g, '\n');
};

/**
 * Compares two library items and returns a list of human-readable differences.
 */
const getDetailedDifferences = (currRaw: unknown, candRaw: unknown): FieldDifference[] => {
    const diffs: FieldDifference[] = [];
    const curr = currRaw as Record<string, unknown>;
    const cand = candRaw as Record<string, unknown>;

    if (normalizeString(curr.name) !== normalizeString(cand.name)) diffs.push({ field: 'name', label: 'Nom', prev: curr.name, next: cand.name });
    if (normalizeString(curr.type) !== normalizeString(cand.type)) diffs.push({ field: 'type', label: 'Type', prev: curr.type, next: cand.type });
    if (Number(curr.cost || 0) !== Number(cand.cost || 0)) diffs.push({ field: 'cost', label: 'Coût', prev: curr.cost, next: cand.cost });
    if (normalizeString(curr.pointsLabel) !== normalizeString(cand.pointsLabel)) diffs.push({ field: 'pointsLabel', label: 'Label', prev: curr.pointsLabel, next: cand.pointsLabel });
    if (normalizeString(curr.description) !== normalizeString(cand.description)) diffs.push({ field: 'description', label: 'Description', prev: curr.description, next: cand.description });

    // Compare tags
    if (isDifferent(curr.tags || [], cand.tags || [])) {
        diffs.push({ field: 'tags', label: 'Tags', prev: curr.tags, next: cand.tags });
    }

    // Compare effects
    if (isDifferent(curr.effects || [], cand.effects || [])) {
        diffs.push({ field: 'effects', label: 'Effets', prev: curr.effects, next: cand.effects });
    }

    return diffs;
};

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
                traits: { new: 0, conflict: 0, identical: 0, newItems: [], conflicts: [] },
                skills: { new: 0, conflict: 0, identical: 0, newItems: [], conflicts: [] },
                specializations: { new: 0, conflict: 0, identical: 0, newItems: [], conflicts: [] },
                backgrounds: { new: 0, conflict: 0, identical: 0, newItems: [], conflicts: [] },
                counters: { new: 0, conflict: 0, identical: 0, newItems: [], conflicts: [] }
            }
        }
    };

    // 1. General Config
    if (isDifferent(current.configurations.creation, candidate.configurations.creation)) {
        const curr = current.configurations.creation as unknown as Record<string, unknown>;
        const cand = candidate.configurations.creation as unknown as Record<string, unknown>;
        const changes = Object.keys(cand).filter(k => isDifferent(curr[k], cand[k]));
        if (changes.length > 0) {
            const details = changes.map(k => {
                const prevVal = curr[k] !== undefined ? JSON.stringify(curr[k]) : 'non défini';
                const nextVal = cand[k] !== undefined ? JSON.stringify(cand[k]) : 'non défini';
                // Trim long JSON for rankSlots or similar
                const displayNext = nextVal.length > 30 ? '{...}' : nextVal;
                const displayPrev = prevVal.length > 30 ? '{...}' : prevVal;
                return `"${k}" (${displayPrev} → ${displayNext})`;
            }).join(', ');
            report.details.general.push(`Création modifiée : ${details}`);
        } else {
            report.details.general.push("Configuration de création modifiée");
        }
    }
    if (isDifferent(current.configurations.xpCosts, candidate.configurations.xpCosts)) {
        const curr = (current.configurations.xpCosts || {}) as unknown as Record<string, unknown>;
        const cand = (candidate.configurations.xpCosts || {}) as unknown as Record<string, unknown>;
        const changes = Object.keys(cand).filter(k => isDifferent(curr[k], cand[k]));
        if (changes.length > 0) {
            const details = changes.map(k => `"${k}" (${curr[k]} → ${cand[k]})`).join(', ');
            report.details.general.push(`Coûts XP modifiés : ${details}`);
        } else {
            report.details.general.push("Coûts XP modifiés");
        }
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
            const catDef = current.definitions.skillCategories?.find(c => c.id === k);
            const label = catDef ? catDef.label : k;
            
            const currList = current.definitions.skills[k] || [];
            const candList = candidate.definitions.skills[k] || [];
            
            const added = candList.filter(s => !currList.includes(s) && s.trim() !== "");
            const removed = currList.filter(s => !candList.includes(s) && s.trim() !== "");
            
            let details = `Catégorie "${label}" modifiée`;
            if (added.length > 0 && removed.length > 0) {
                details += ` : Ajouts [${added.join(', ')}], Retraits [${removed.join(', ')}]`;
            } else if (added.length > 0) {
                details += ` : Ajouts [${added.join(', ')}]`;
            } else if (removed.length > 0) {
                details += ` : Retraits [${removed.join(', ')}]`;
            } else {
                details += ` : Ordre ou format modifié`;
            }
            
            report.details.skills.push(details);
        }
    });

    // 4. Libraries Analysis
    const analyzeLib = <T extends { id: string, name?: string }>(curr: T[], cand: T[]) => {
        const stats = {
            new: 0,
            conflict: 0,
            identical: 0,
            newItems: [] as { id: string, name: string }[],
            conflicts: [] as LibraryConflict[]
        };
        const currIdMap = new Map(curr.map(i => [i.id, i]));
        const currNameMap = new Map(curr.filter(i => i.name).map(i => [i.name?.trim().toLowerCase(), i]));

        cand.forEach(item => {
            const trimmedName = item.name?.trim().toLowerCase();
            const existingById = currIdMap.get(item.id);
            const existingByName = trimmedName ? currNameMap.get(trimmedName) : undefined;

            const existing = existingById || existingByName;

            if (!existing) {
                stats.new++;
                stats.newItems.push({ id: item.id, name: item.name || "Sans nom" });
            } else {
                if (isDifferent(existing, item)) {
                    const diffs = getDetailedDifferences(existing, item);
                    if (diffs.length > 0) {
                        stats.conflict++;
                        stats.conflicts.push({
                            id: existing.id, // Store ID for exclusion tracking
                            name: item.name || "Sans nom",
                            type: (item as Record<string, unknown>).type as string || "item",
                            differences: diffs,
                            current: existing,
                            candidate: item
                        });
                    } else {
                        stats.identical++;
                    }
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
    if (candidate.libraries?.backgrounds) {
        report.details.libraries.backgrounds = analyzeLib(current.libraries?.backgrounds || [], candidate.libraries.backgrounds);
    }
    if (candidate.libraries?.counters) {
        report.details.libraries.counters = analyzeLib(current.libraries?.counters || [], candidate.libraries.counters);
    }
    if (candidate.libraries?.specializations) {
        report.details.libraries.specializations = analyzeLib(current.libraries?.specializations || [], candidate.libraries.specializations);
    }

    // Calculate Global Change Flag
    report.hasChanges =
        report.details.general.length > 0 ||
        report.details.attributes.length > 0 ||
        report.details.skills.length > 0 ||
        report.details.backgrounds.length > 0 ||
        report.details.counters.length > 0 ||
        report.details.libraries.traits.new > 0 ||
        report.details.libraries.traits.conflict > 0 ||
        report.details.libraries.skills.new > 0 ||
        report.details.libraries.skills.conflict > 0 ||
        report.details.libraries.backgrounds.new > 0 ||
        report.details.libraries.backgrounds.conflict > 0 ||
        report.details.libraries.specializations.new > 0 ||
        report.details.libraries.specializations.conflict > 0;

    return report;
};

export const mergeRules = (current: RulesData, candidate: RulesData, options: ImportOptions): RulesData => {
    // Deep clone current to start
    const result: RulesData = JSON.parse(JSON.stringify(current));

    if (options.sections.general) {
        if (candidate.configurations.creation) result.configurations.creation = candidate.configurations.creation;
        if (candidate.configurations.xpCosts) result.configurations.xpCosts = candidate.configurations.xpCosts;
        if (candidate.configurations.cards) result.configurations.cards = candidate.configurations.cards;
    }

    if (options.sections.attributes) {
        if (candidate.definitions.attributes) {
            result.definitions.attributes = {
                ...result.definitions.attributes,
                ...candidate.definitions.attributes
            };
        }
        if (candidate.definitions.secondaryAttributes) {
            result.definitions.secondaryAttributes = {
                ...result.definitions.secondaryAttributes,
                ...candidate.definitions.secondaryAttributes
            };
        }
        if (candidate.configurations.global) {
            result.configurations.global.secondaryAttributes = candidate.configurations.global.secondaryAttributes;
            result.configurations.global.maxAttributeScore = candidate.configurations.global.maxAttributeScore;
        }
    }

    if (options.sections.skills) {
        if (candidate.definitions.skills) {
            result.definitions.skills = {
                ...result.definitions.skills,
                ...candidate.definitions.skills
            };
        }
        if (candidate.definitions.labels) {
            result.definitions.labels = {
                ...result.definitions.labels,
                ...candidate.definitions.labels
            };
        }
    }

    if (options.sections.backgrounds) {
        if (candidate.definitions.backgrounds) result.definitions.backgrounds = candidate.definitions.backgrounds;
    }

    if (options.sections.counters) {
        if (candidate.definitions.counters) result.definitions.counters = candidate.definitions.counters;
    }

    // Library Merge Logic
    if (options.sections.libraries) {
        // Ensure library buckets exist
        if (!result.libraries) result.libraries = { traits: [], skills: [], specializations: [], backgrounds: [], counters: [], mysticAbilities: [] };

        const mergeLibList = <T extends { id: string, name?: string }>(curr: T[], cand: T[]) => {
            const map = new Map(curr.map(i => [i.id, i]));
            const nameMap = new Map(curr.filter(i => i.name).map(i => [i.name?.trim().toLowerCase(), i]));
            const excluded = new Set(options.excludedIds || []);

            cand.forEach(item => {
                if (excluded.has(item.id)) return; // Skip individually excluded items

                const trimmedName = item.name?.trim().toLowerCase();
                const existingById = map.get(item.id);
                const existingByName = trimmedName ? nameMap.get(trimmedName) : undefined;

                if (!existingById && !existingByName) {
                    // New item
                    map.set(item.id, item);
                } else {
                    // Conflict (either same ID or same Name)
                    const existing = existingById || existingByName;
                    const targetId = existing?.id || item.id;

                    if (options.libraryStrategy === 'overwrite') {
                        // CHECK FOR FIELD EXCLUSIONS
                        const itemFieldExclusions = options.fieldExclusions?.[targetId];

                        if (itemFieldExclusions && itemFieldExclusions.length > 0) {
                            // Granular Merge
                            const currentItem = map.get(targetId);
                            if (currentItem) {
                                const mergedItem = { ...item };
                                // For each excluded field, RESTORE value from current
                                itemFieldExclusions.forEach(field => {
                                    if (currentItem && field in currentItem) {
                                        const fieldName = field as keyof T;
                                        (mergedItem as Record<keyof T, T[keyof T]>)[fieldName] = currentItem[fieldName];
                                    }
                                });
                                map.set(targetId, mergedItem);
                            } else {
                                map.set(targetId, item);
                            }
                        } else {
                            // Classic overwrite
                            map.set(targetId, item);
                        }
                    } else if (options.libraryStrategy === 'copy') {
                        // Create copy with new ID even if name matches
                        const safeUUID = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `copy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        const copy = { ...item, id: safeUUID };
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
        if (candidate.libraries?.backgrounds) {
            result.libraries.backgrounds = mergeLibList(current.libraries?.backgrounds || [], candidate.libraries.backgrounds);
        }
        if (candidate.libraries?.counters) {
            result.libraries.counters = mergeLibList(current.libraries?.counters || [], candidate.libraries.counters);
        }
        if (candidate.libraries?.specializations) {
            result.libraries.specializations = mergeLibList(current.libraries?.specializations || [], candidate.libraries.specializations);
        }
    }


    return result;
};
