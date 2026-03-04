import { MigratableData } from './registry';

/**
 * Migration: Specializations
 * - Initialize specializations object
 * - Convert string specializations to objects with minLevel
 * - Build specializationLibrary from existing data
 */
export const migrateSpecializations = (parsed: MigratableData): void => {
    // Initialize specializations
    if (!parsed.specializations) {
        parsed.specializations = {};
    }

    const imposedSpecializations = parsed.imposedSpecializations as Record<string, any> | undefined;

    // Convert string array to object array in imposedSpecializations
    if (imposedSpecializations) {
        Object.keys(imposedSpecializations).forEach(skillId => {
            const list = imposedSpecializations[skillId];
            if (Array.isArray(list) && list.length > 0 && typeof list[0] === 'string') {
                imposedSpecializations[skillId] = list.map((s: string) => ({
                    name: s,
                    minLevel: 0
                }));
            }
        });
    }

    // Build specializationLibrary from existing data
    if (!parsed.specializationLibrary || !Array.isArray(parsed.specializationLibrary) || parsed.specializationLibrary.length === 0) {
        const initialSpecList: any[] = [];
        const seenSpecNames = new Set<string>();

        // 1. Harvest from specializations Record
        const specializations = parsed.specializations as Record<string, string[]> | undefined;
        if (specializations) {
            Object.keys(specializations).forEach(skillId => {
                const specs = specializations[skillId];
                if (Array.isArray(specs)) {
                    specs.forEach(s => {
                        if (s && typeof s === 'string' && s.trim() !== '') {
                            const name = s.trim();
                            const normalized = name.toLowerCase();
                            if (!seenSpecNames.has(normalized)) {
                                seenSpecNames.add(normalized);
                                initialSpecList.push({
                                    id: Math.random().toString(36).substring(2, 11),
                                    name: name,
                                    skillIds: [skillId],
                                    defaultMinLevel: 0,
                                    description: ""
                                });
                            } else {
                                const existing = initialSpecList.find(e => e.name.trim().toLowerCase() === normalized);
                                if (existing && Array.isArray(existing.skillIds) && !existing.skillIds.includes(skillId)) {
                                    existing.skillIds.push(skillId);
                                }
                            }
                        }
                    });
                }
            });
        }

        // 2. Harvest from imposedSpecializations
        if (imposedSpecializations) {
            Object.keys(imposedSpecializations).forEach(skillId => {
                const specs = imposedSpecializations[skillId];
                if (Array.isArray(specs)) {
                    specs.forEach(s => {
                        const name = (typeof s === 'string' ? s : s?.name) as string | undefined;
                        if (name && name.trim() !== '') {
                            const trimmedName = name.trim();
                            const normalized = trimmedName.toLowerCase();
                            if (!seenSpecNames.has(normalized)) {
                                seenSpecNames.add(normalized);
                                initialSpecList.push({
                                    id: Math.random().toString(36).substring(2, 11),
                                    name: trimmedName,
                                    skillIds: [skillId],
                                    defaultMinLevel: typeof s === 'object' ? (s.minLevel || 0) : 0,
                                    description: ""
                                });
                            } else {
                                const existing = initialSpecList.find(e => e.name.trim().toLowerCase() === normalized);
                                if (existing && Array.isArray(existing.skillIds) && !existing.skillIds.includes(skillId)) {
                                    existing.skillIds.push(skillId);
                                }
                            }
                        }
                    });
                }
            });
        }

        initialSpecList.sort((a, b) => a.name.localeCompare(b.name));
        parsed.specializationLibrary = initialSpecList;
    }
};
