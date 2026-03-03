import { CharacterSheetData } from '../../types';
import { RulesData } from '../../types/rules';

/**
 * Synchronizes header dates with campaign calendar if available.
 */
export const reconcileHeader = (newState: CharacterSheetData, rules: RulesData) => {
    const calendar = rules.configurations?.calendar;
    if (!calendar) return;

    // Helper to format real date (YYYY-MM-DD -> DD/MM/YYYY)
    const formatRealDate = (dateStr: string) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('fr-FR');
        } catch {
            return dateStr;
        }
    };

    // Helper to format fictional date
    const formatFictionalDate = (year: number, monthIndex: number, day: number, months: { name: string }[]) => {
        const monthName = months[monthIndex]?.name || `Mois ${monthIndex + 1}`;
        return `${day} ${monthName} ${year}`;
    };

    if (calendar.type === 'real') {
        if (calendar.startDate) {
            newState.header.campaignStartDate = formatRealDate(calendar.startDate);
        }
        if (calendar.currentDate) {
            newState.header.fictionCurrentDate = formatRealDate(calendar.currentDate);
        }
    } else if (calendar.type === 'fictional') {
        const months = calendar.months || [];
        newState.header.campaignStartDate = formatFictionalDate(calendar.startYear, 0, 1, months);
        newState.header.fictionCurrentDate = formatFictionalDate(calendar.currentYear, calendar.currentMonthIndex, calendar.currentDay, months);
    }
};
