import { INITIAL_DATA } from '../../data/initialState';

/**
 * Migration: Counters structure
 * - Add id, current, creationValue properties
 * - Remove "Valets / Dames / Rois"
 */
export const migrateCounters = (parsed: any): void => {
    if (!parsed.counters) return;

    // Convert old structure to new DotEntry structure
    if (parsed.counters.volonte && !parsed.counters.volonte.id) {
        const oldCounters = parsed.counters;
        parsed.counters = {
            volonte: { id: 'volonte', name: 'Volonté', value: oldCounters.volonte.max || 3, creationValue: 3, max: 10, current: 0 },
            confiance: { id: 'confiance', name: 'Confiance', value: oldCounters.confiance.max || 3, creationValue: 3, max: 10, current: 0 },
            custom: INITIAL_DATA.counters.custom
        };
    }

    // Ensure counters have 'current' property
    if (typeof parsed.counters.volonte?.current === 'undefined') {
        parsed.counters.volonte.current = 0;
    }
    if (typeof parsed.counters.confiance?.current === 'undefined') {
        parsed.counters.confiance.current = 0;
    }
    if (parsed.counters.custom) {
        parsed.counters.custom = parsed.counters.custom.map((c: any) => ({
            ...c,
            current: typeof c.current !== 'undefined' ? c.current : 0
        }));
    }

    // Remove "Valets / Dames / Rois"
    if (Array.isArray(parsed.counters.custom)) {
        parsed.counters.custom = parsed.counters.custom.filter((c: any) =>
            c && c.name !== "Valets / Dames / Rois"
        );
    }
};
