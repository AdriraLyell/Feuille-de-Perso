/**
 * Migration: Terminology renaming
 * - vertus → avantages
 * - defauts → desavantages
 */
export const migrateTerminology = (parsed: any): void => {
    if (!parsed.page2) return;

    if (parsed.page2.vertus && !parsed.page2.avantages) {
        parsed.page2.avantages = parsed.page2.vertus;
        delete parsed.page2.vertus;
    }
    if (parsed.page2.defauts && !parsed.page2.desavantages) {
        parsed.page2.desavantages = parsed.page2.defauts;
        delete parsed.page2.defauts;
    }
};
