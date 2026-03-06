/* eslint-disable @typescript-eslint/no-explicit-any */
import { MigratableData } from './registry';

export const forceRulesReconciliation = (parsed: MigratableData): void => {
    // Supprimer la trace de la dernière version des règles pour forcer
    // le useEffect de CharacterContext à lancer reconcileRulesWithState
    if ('_rulesLastUpdated' in parsed) {
        delete (parsed as any)._rulesLastUpdated;
    }
    if ('_rulesVersion' in parsed) {
        delete (parsed as any)._rulesVersion;
    }
};

