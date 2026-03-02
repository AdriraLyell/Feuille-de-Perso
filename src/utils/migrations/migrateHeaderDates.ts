import { MigratableData } from './registry';

/**
 * Migration: Header fields
 * - Ensure campaignStartDate and fictionCurrentDate exist
 */
export const migrateHeaderDates = (parsed: MigratableData): void => {
    if (!parsed.header) {
        parsed.header = {};
    }

    const header = parsed.header as Record<string, any>;

    if (typeof header.campaignStartDate === 'undefined') {
        header.campaignStartDate = '';
    }
    if (typeof header.fictionCurrentDate === 'undefined') {
        header.fictionCurrentDate = '';
    }
};
