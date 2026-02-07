
/**
 * Processes a list of categories and appends "(suite)" to duplicate labels
 * to help distinguish them in selection menus.
 */
export const disambiguateCategories = <T extends { label: string }>(categories: T[]): T[] => {
    const seenLabels: Record<string, number> = {};

    return categories.map(cat => {
        const label = cat.label;
        if (seenLabels[label] !== undefined) {
            seenLabels[label]++;
            const suffix = seenLabels[label] === 1 ? " (suite)" : ` (suite ${seenLabels[label]})`;
            return {
                ...cat,
                label: `${label}${suffix}`
            };
        } else {
            seenLabels[label] = 0;
            return cat;
        }
    });
};
