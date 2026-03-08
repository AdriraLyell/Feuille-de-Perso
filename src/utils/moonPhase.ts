/**
 * Utilitaires pour le calcul des phases de la lune (Calendrier Réel)
 */

export const MOON_PHASES = [
    { name: "Nouvelle Lune", emoji: "🌑" },
    { name: "Premier Croissant", emoji: "🌒" },
    { name: "Premier Quartier", emoji: "🌓" },
    { name: "Lune Gibbeuse Croissante", emoji: "🌔" },
    { name: "Pleine Lune", emoji: "🌕" },
    { name: "Lune Gibbeuse Décroissante", emoji: "🌖" },
    { name: "Dernier Quartier", emoji: "🌗" },
    { name: "Dernier Croissant", emoji: "🌘" }
];

/**
 * Calcule la phase de la lune pour une date donnée (Grégorien/Réel)
 * Basé sur une Nouvelle Lune de référence le 6 Janvier 2000 à 18:14 UTC
 */
export function calculateMoonPhase(dateInput: string | Date | null | undefined) {
    if (!dateInput) return null;

    try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        if (isNaN(date.getTime())) return null;

        // Nouvelle lune connue (6 Janvier 2000 à 18:14 UTC)
        const refNewMoonDate = new Date(Date.UTC(2000, 0, 6, 18, 14, 0)).getTime();
        const synodicMonth = 29.530588853; // Longueur du mois synodique en jours

        // Différence en jours entre la date demandée et la date de réf
        const diffDays = (date.getTime() - refNewMoonDate) / (1000 * 60 * 60 * 24);

        // Age de la lune (modulo mathématique)
        const moonAge = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth;

        // Index de phase (0 à 7)
        // On décale de moitié pour centrer la phase sur la phase majeure
        let phaseIndex = Math.floor((moonAge + (synodicMonth / 16)) / (synodicMonth / 8));
        if (phaseIndex >= 8) phaseIndex = 0;

        return MOON_PHASES[phaseIndex];
    } catch (e) {
        console.error("Error calculating moon phase:", e);
        return null;
    }
}
