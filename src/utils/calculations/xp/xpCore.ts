/**
 * Calcule la somme triangulaire : n + (n-1) + ... + 1
 */
export const triangular = (n: number): number => {
    return (n * (n + 1)) / 2;
};

/**
 * Calcule le coût en XP pour passer d'un niveau de création à un niveau actuel
 */
export const getXPCost = (currentValue: number, creationValue: number = 0, factor: number = 1.0, useTriangular: boolean = true): number => {
    if (currentValue === 0 || currentValue <= creationValue) return 0;

    if (useTriangular) {
        const baseCost = triangular(currentValue) - triangular(creationValue);
        return baseCost * factor;
    } else {
        // Coût linéaire
        const diff = Math.max(0, currentValue - creationValue);
        return diff * factor;
    }
};
