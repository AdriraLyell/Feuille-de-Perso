export const getCategoryColor = (catName: string) => {
    const lower = catName.toLowerCase();
    if (lower.includes('physique')) return '#fb923c'; // orange-400
    if (lower.includes('mental')) return '#38bdf8';   // sky-400
    if (lower.includes('social')) return '#34d399';   // emerald-400
    return '#d97706'; // amber-600
};

export const getCategoryBgColor = (catName: string) => {
    const lower = catName.toLowerCase();
    if (lower.includes('physique')) return 'rgba(251, 146, 60, 0.03)'; // orange-400 @ 3%
    if (lower.includes('mental')) return 'rgba(56, 189, 248, 0.03)';   // sky-400 @ 3%
    if (lower.includes('social')) return 'rgba(52, 211, 153, 0.03)';   // emerald-400 @ 3%
    return 'rgba(217, 119, 6, 0.03)'; // amber-600 @ 3%
};
