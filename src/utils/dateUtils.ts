/**
 * Parse une date de manière flexible (FR DD/MM/YYYY, ISO YYYY-MM-DD, ou Fictif)
 */
export function parseFlexibleDate(dateStr: string) {
    if (!dateStr) return null;
    const trimmed = dateStr.trim();

    // 1. Format français : DD/MM/YYYY
    const frMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4,})$/);
    if (frMatch) {
        return { day: parseInt(frMatch[1]), month: parseInt(frMatch[2]), year: parseInt(frMatch[3]), type: 'standard' as const };
    }

    // 2. Format ISO : YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4,})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
        return { year: parseInt(isoMatch[1]), month: parseInt(isoMatch[2]), day: parseInt(isoMatch[3]), type: 'standard' as const };
    }

    // 3. Format Fictif : "Jour Mois Année" (on prend le dernier nombre comme année)
    const yearMatch = trimmed.match(/(-?\d+)$/);
    if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        const dayMatch = trimmed.match(/^(\d+)/);
        return { year, month: 1, day: dayMatch ? parseInt(dayMatch[1]) : 1, type: 'fictional' as const };
    }

    return null;
}

/**
 * Convertit un résultat de parseFlexibleDate en objet Date standard
 */
export function flexibleDateToDate(parsed: ReturnType<typeof parseFlexibleDate>): Date | null {
    if (!parsed) return null;
    // On utilise Date.UTC pour éviter les décalages de fuseau horaire
    return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, 12, 0, 0));
}
