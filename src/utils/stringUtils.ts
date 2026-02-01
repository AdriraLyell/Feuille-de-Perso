
/**
 * Normalise un texte pour faciliter la recherche insensible aux accents et à la casse.
 * @param text Le texte à normaliser
 * @returns Le texte sans accents, en minuscules et trimé.
 */
export const normalizeText = (text: string): string => {
    if (!text) return "";
    return text
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};

/**
 * Vérifie si un texte contient un terme de recherche, de manière intelligente.
 * @param haystack Le texte dans lequel chercher (original)
 * @param needle Le terme recherché
 * @returns true si le terme est trouvé après normalisation réciproque.
 */
export const smartIncludes = (haystack: string, needle: string): boolean => {
    if (!needle) return true;
    const normHaystack = normalizeText(haystack);
    const normNeedle = normalizeText(needle);
    return normHaystack.includes(normNeedle);
};
