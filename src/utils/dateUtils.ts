/**
 * Parse une date de manière flexible (FR DD/MM/YYYY, ISO YYYY-MM-DD, ou Fictif)
 */
export function parseFlexibleDate(dateStr: string) {
    if (!dateStr) return null;
    const trimmed = dateStr.trim();

    // 1. Format français : DD/MM/YYYY (accepte aussi les espaces ou tirets)
    const frMatch = trimmed.match(/^(\d{1,2})[/\s-](\d{1,2})[/\s-](\d{4,})$/);
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

/**
 * Formatage centralisé de la date de campagne/calendrier
 */
export function formatCalendarDate(calendar: any): string {
    if (!calendar) return "Non configuré";
    
    if (calendar.type === 'fictional') {
        const m = calendar.months?.[calendar.currentMonthIndex]?.name ?? `Mois ${calendar.currentMonthIndex + 1}`;
        return `Jour ${calendar.currentDay}, ${m}, An ${calendar.currentYear}`;
    } else {
        if (!calendar.currentDate) return "Date indéfinie";
        return formatSimpleDate(calendar.currentDate);
    }
}
/**
 * Formatage simple jj/mm/aaaa
 */
export function formatSimpleDate(dateStr: string | undefined): string {
    if (!dateStr) return "";
    const parsed = parseFlexibleDate(dateStr);
    if (!parsed || parsed.type !== 'standard') return dateStr;
    const d = parsed.day.toString().padStart(2, '0');
    const m = parsed.month.toString().padStart(2, '0');
    return `${d}/${m}/${parsed.year}`;
}
