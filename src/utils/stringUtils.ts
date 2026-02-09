
/**
 * Normalizes a string for comparison:
 * - Trims whitespace
 * - Converts to lowercase
 * - Removes accents (NFD normalization)
 */
export const normalizeString = (str: string): string => {
    if (!str) return '';
    return str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

/**
 * Checks if text includes query using normalized strings (case & accent insensitive)
 */
export const smartIncludes = (text: string, query: string): boolean => {
    if (!query) return true;
    if (!text) return false;
    return normalizeString(text).includes(normalizeString(query));
};
