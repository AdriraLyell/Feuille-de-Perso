import { INITIAL_DATA } from '../../data/initialState';
import { MigratableData } from './registry';

/**
 * Migration: Counters structure
 * - Add id, current, creationValue properties
 * - Remove "Valets / Dames / Rois"
 */
export const migrateCounters = (parsed: MigratableData): void => {
    if (!parsed.counters) {
        parsed.counters = {
            volonte: { id: 'volonte', name: 'Volonté', value: 3, creationValue: 3, max: 10, current: 0 },
            confiance: { id: 'confiance', name: 'Confiance', value: 3, creationValue: 3, max: 10, current: 0 },
            custom: []
        };
        return;
    }

    const counters = parsed.counters as Record<string, any>;

    // Convert old structure to new DotEntry structure
    if (!counters.volonte || !counters.volonte.id) {
        const oldVolonte = counters.volonte || {};
        const oldConfiance = counters.confiance || {};

        // Update standard ones in place
        counters.volonte = { id: 'volonte', name: 'Volonté', value: oldVolonte.max || oldVolonte.value || 3, creationValue: 3, max: 10, current: 0 };
        counters.confiance = { id: 'confiance', name: 'Confiance', value: oldConfiance.max || oldConfiance.value || 3, creationValue: 3, max: 10, current: 0 };

        if (!counters.custom) {
            counters.custom = INITIAL_DATA.counters.custom || [];
        }
    }

    // Ensure counters have 'current' property
    if (counters.volonte && typeof counters.volonte.current === 'undefined') {
        counters.volonte.current = 0;
    }
    if (counters.confiance && typeof counters.confiance.current === 'undefined') {
        counters.confiance.current = 0;
    }

    if (Array.isArray(counters.custom)) {
        counters.custom = counters.custom
            .filter((c: any) => c && c.name !== "Valets / Dames / Rois")
            .map((c: any) => ({
                ...c,
                current: typeof c.current !== 'undefined' ? c.current : 0
            }));
    }
};
