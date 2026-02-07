/**
 * Migration: Specializations
 * - Initialize specializations object
 * - Convert string specializations to objects with minLevel
 * - Build specializationLibrary from existing data
 */
export const migrateSpecializations = (parsed: any): void => {
    // Initialize specializations
    if (!parsed.specializations) {
        parsed.specializations = {};
    }

    // Convert string array to object array in imposedSpecializations
    if (parsed.imposedSpecializations) {
        Object.keys(parsed.imposedSpecializations).forEach(skillId => {
            const list = parsed.imposedSpecializations[skillId];
            if (Array.isArray(list) && list.length > 0 && typeof list[0] === 'string') {
                parsed.imposedSpecializations[skillId] = list.map((s: string) => ({
                    name: s,
                    minLevel: 0
                }));
            }
        });
    }

    // Build specializationLibrary from existing data
    if (!parsed.specializationLibrary) {
        parsed.specializationLibrary = [];
        const initialSpecList: any[] = [];
        const seenSpecNames = new Set<string>();

        // 1. Harvest from specializations Record
        if (parsed.specializations) {
            Object.keys(parsed.specializations).forEach(skillId => {
                const specs = parsed.specializations[skillId];
                if (Array.isArray(specs)) {
                    specs.forEach(s => {
                        if (s && s.trim() !== '') {
                            const normalized = s.trim().toLowerCase();
                            if (!seenSpecNames.has(normalized)) {
                                seenSpecNames.add(normalized);
                                initialSpecList.push({
                                    id: Math.random().toString(36).substr(2, 9),
                                    name: s.trim(),
                                    skillIds: [skillId],
                                    defaultMinLevel: 0,
                                    description: ""
                                });
                            } else {
                                const existing = initialSpecList.find(e => e.name.trim().toLowerCase() === normalized);
                                if (existing && !existing.skillIds.includes(skillId)) {
                                    existing.skillIds.push(skillId);
                                }
                            }
                        }
                    });
                }
            });
        }

        // 2. Harvest from imposedSpecializations
        if (parsed.imposedSpecializations) {
            Object.keys(parsed.imposedSpecializations).forEach(skillId => {
                const specs = parsed.imposedSpecializations[skillId];
                if (Array.isArray(specs)) {
                    specs.forEach(s => {
                        const name = typeof s === 'string' ? s : s.name;
                        if (name && name.trim() !== '') {
                            const normalized = name.trim().toLowerCase();
                            if (!seenSpecNames.has(normalized)) {
                                seenSpecNames.add(normalized);
                                initialSpecList.push({
                                    id: Math.random().toString(36).substr(2, 9),
                                    name: name.trim(),
                                    skillIds: [skillId],
                                    defaultMinLevel: typeof s === 'object' ? (s.minLevel || 0) : 0,
                                    description: ""
                                });
                            } else {
                                const existing = initialSpecList.find(e => e.name.trim().toLowerCase() === normalized);
                                if (existing && !existing.skillIds.includes(skillId)) {
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
