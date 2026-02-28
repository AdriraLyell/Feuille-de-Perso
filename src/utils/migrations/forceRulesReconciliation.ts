export const forceRulesReconciliation = (parsed: any): void => {
    // Supprimer la trace de la dernière version des règles pour forcer
    // le useEffect de CharacterContext à lancer reconcileRulesWithState
    if (parsed._rulesLastUpdated) {
        delete parsed._rulesLastUpdated;
    }
    if (parsed._rulesVersion) {
        delete parsed._rulesVersion;
    }
};
