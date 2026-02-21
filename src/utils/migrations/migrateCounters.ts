import { INITIAL_DATA } from '../../data/initialState';

/**
 * Migration: Counters structure
 * - Add id, current, creationValue properties
 * - Remove "Valets / Dames / Rois"
 */
export const migrateCounters = (parsed: any): void => {
    if (!parsed.counters) return;

    // Convert old structure to new DotEntry structure
    // We only perform the "full wipe and reset" if the structure is truly ancient (no id on volonte)
    // BUT we should be additive, not subtractive.
    if (parsed.counters.volonte && !parsed.counters.volonte.id) {
        const oldVolonte = parsed.counters.volonte;
        const oldConfiance = parsed.counters.confiance;

        // Update standard ones in place
        parsed.counters.volonte = { id: 'volonte', name: 'Volonté', value: oldVolonte.max || oldVolonte.value || 3, creationValue: 3, max: 10, current: 0 };
        parsed.counters.confiance = { id: 'confiance', name: 'Confiance', value: oldConfiance.max || oldConfiance.value || 3, creationValue: 3, max: 10, current: 0 };

        if (!parsed.counters.custom) {
            parsed.counters.custom = INITIAL_DATA.counters.custom;
        }
    }

    // Ensure counters have 'current' property
    if (parsed.counters.volonte && typeof parsed.counters.volonte.current === 'undefined') {
        parsed.counters.volonte.current = 0;
    }
    if (parsed.counters.confiance && typeof parsed.counters.confiance.current === 'undefined') {
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
