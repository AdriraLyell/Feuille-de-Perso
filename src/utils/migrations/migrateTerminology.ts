import { MigratableData } from './registry';

/**
 * Migration: Terminology renaming
 * - vertus → avantages
 * - defauts → desavantages
 */
export const migrateTerminology = (parsed: MigratableData): void => {
    const page2 = parsed.page2 as Record<string, unknown> | undefined;
    if (!page2) return;

    if ('vertus' in page2 && !('avantages' in page2)) {
        page2.avantages = page2.vertus;
        delete page2.vertus;
    }
    if ('defauts' in page2 && !('desavantages' in page2)) {
        page2.desavantages = page2.defauts;
        delete page2.defauts;
    }
};
