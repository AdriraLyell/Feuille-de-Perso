
/**
 * Migration: Header fields
 * - Ensure campaignStartDate and fictionCurrentDate exist
 */
export const migrateHeaderDates = (parsed: any): void => {
    if (!parsed.header) {
        parsed.header = {};
    }

    if (typeof parsed.header.campaignStartDate === 'undefined') {
        parsed.header.campaignStartDate = '';
    }
    if (typeof parsed.header.fictionCurrentDate === 'undefined') {
        parsed.header.fictionCurrentDate = '';
    }
};
