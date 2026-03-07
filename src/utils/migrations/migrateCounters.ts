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

    const counters = parsed.counters as Record<string, unknown>;

    // Convert old structure to new DotEntry structure
    const volonte = counters.volonte as { id?: string; name?: string; value?: number; max?: number; current?: number } | undefined;
    if (!volonte || !volonte.id) {
        const oldVolonte = volonte || {};
        const oldConfiance = (counters.confiance as { value?: number; max?: number }) || {};

        // Update standard ones in place
        counters.volonte = { id: 'volonte', name: 'Volonté', value: oldVolonte.max || oldVolonte.value || 3, creationValue: 3, max: 10, current: 0 };
        counters.confiance = { id: 'confiance', name: 'Confiance', value: oldConfiance.max || oldConfiance.value || 3, creationValue: 3, max: 10, current: 0 };

        if (!counters.custom) {
            counters.custom = INITIAL_DATA.counters.custom || [];
        }
    }

    // Ensure counters have 'current' property
    const finalVolonte = counters.volonte as { current?: number };
    if (finalVolonte && typeof finalVolonte.current === 'undefined') {
        finalVolonte.current = 0;
    }
    const finalConfiance = counters.confiance as { current?: number };
    if (finalConfiance && typeof finalConfiance.current === 'undefined') {
        finalConfiance.current = 0;
    }

    if (Array.isArray(counters.custom)) {
        counters.custom = counters.custom
            .filter(cRaw => {
                const c = cRaw as { name?: string };
                return c && c.name !== "Valets / Dames / Rois";
            })
            .map(cRaw => {
                const c = cRaw as { current?: number };
                return {
                    ...c,
                    current: typeof c.current !== 'undefined' ? c.current : 0
                };
            });
    }
};
