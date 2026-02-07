/**
 * Migration: Traits structure
 * - string[] → object[] for avantages/desavantages
 * - Padding to 28 elements
 */
export const migrateTraits = (parsed: any): void => {
    if (!parsed.page2) return;

    // Convert string[] to object[]
    if (parsed.page2.avantages && parsed.page2.avantages.length > 0 && typeof parsed.page2.avantages[0] === 'string') {
        parsed.page2.avantages = parsed.page2.avantages.map((s: string) => ({ name: s || '', value: '' }));
    }
    if (parsed.page2.desavantages && parsed.page2.desavantages.length > 0 && typeof parsed.page2.desavantages[0] === 'string') {
        parsed.page2.desavantages = parsed.page2.desavantages.map((s: string) => ({ name: s || '', value: '' }));
    }

    // Padding to 28 elements
    if (parsed.page2.avantages && parsed.page2.avantages.length < 28) {
        const diff = 28 - parsed.page2.avantages.length;
        parsed.page2.avantages = [...parsed.page2.avantages, ...Array(diff).fill(null).map(() => ({ name: '', value: '' }))];
    } else if (!parsed.page2.avantages) {
        parsed.page2.avantages = Array(28).fill(null).map(() => ({ name: '', value: '' }));
    }

    if (parsed.page2.desavantages && parsed.page2.desavantages.length < 28) {
        const diff = 28 - parsed.page2.desavantages.length;
        parsed.page2.desavantages = [...parsed.page2.desavantages, ...Array(diff).fill(null).map(() => ({ name: '', value: '' }))];
    } else if (!parsed.page2.desavantages) {
        parsed.page2.desavantages = Array(28).fill(null).map(() => ({ name: '', value: '' }));
    }
};
