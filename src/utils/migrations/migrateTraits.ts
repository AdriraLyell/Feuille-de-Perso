import { MigratableData } from './registry';

/**
 * Migration: Traits structure
 * - string[] → object[] for avantages/desavantages
 * - Padding to 28 elements
 */
export const migrateTraits = (parsed: MigratableData): void => {
    const page2 = parsed.page2 as Record<string, unknown> | undefined;
    if (!page2) return;

    // Convert string[] to object[]
    if (Array.isArray(page2.avantages) && page2.avantages.length > 0 && typeof page2.avantages[0] === 'string') {
        page2.avantages = (page2.avantages as string[]).map((s: string) => ({ name: s || '', value: '' }));
    }
    if (Array.isArray(page2.desavantages) && page2.desavantages.length > 0 && typeof page2.desavantages[0] === 'string') {
        page2.desavantages = (page2.desavantages as string[]).map((s: string) => ({ name: s || '', value: '' }));
    }

    // Padding to 28 elements
    const ensurePadding = (list: unknown[] | undefined) => {
        const current = list || [];
        if (current.length < 28) {
            const diff = 28 - current.length;
            return [...current, ...Array(diff).fill(null).map(() => ({ name: '', value: '' }))];
        }
        return current;
    };

    page2.avantages = ensurePadding(page2.avantages as unknown[] | undefined);
    page2.desavantages = ensurePadding(page2.desavantages as unknown[] | undefined);
};

