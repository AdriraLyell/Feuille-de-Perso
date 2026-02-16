import { CharacterSheetData, RulesData } from '../../types';
import { recreateCharacterStats } from '../../utils/characterUtils';

/**
 * Service gérant la logique de recréation (Respec) d'un personnage.
 */
export const RecreationService = {
    /**
     * Calcule le montant total d'XP à rembourser.
     * Basé sur les dépenses enregistrées (val2 pour attributs, value > creationValue pour compétences).
     */
    calculateRefundValue(data: CharacterSheetData): number {
        // Le MJ souhaite un remboursement de toute l'XP gagnée en partie (logs).
        // L'XP des traits sera gérée par le maintien des traits sur la fiche (recalculée dynamiquement).
        if (!data.xpLogs || !Array.isArray(data.xpLogs)) return 0;

        return data.xpLogs.reduce((sum, log) => sum + (log.amount || 0), 0);
    },

    /**
     * Applique la recréation sur les données du personnage.
     * 1. Efface la création actuelle.
     * 2. Ajoute l'XP de remboursement.
     * 3. Réactive le mode création.
     */
    performRecreation(data: CharacterSheetData, refundAmount: number, currentRules: RulesData): CharacterSheetData {
        // Step 1: Reset chirurgical (garde identité, social, équipement, traits, image)
        const resetData = recreateCharacterStats(data);

        // Step 2: Injecter le remboursement d'XP
        if (refundAmount > 0) {
            const recreationLog = {
                id: crypto.randomUUID(),
                date: new Date().toLocaleDateString('fr-FR'),
                scenario: "Remboursement Progression (Recréation)",
                amount: refundAmount,
                mj: "Système (Admin)"
            };

            if (!resetData.xpLogs) resetData.xpLogs = [];
            resetData.xpLogs.push(recreationLog);
        }

        // Step 3: Configurer le mode création selon les règles actuelles de la campagne
        const creationRule = currentRules.configurations.creation;

        resetData.creationConfig = {
            ...resetData.creationConfig,
            active: true,
            mode: creationRule.mode,
            startingXP: creationRule.startingXP,
            pointsDistributionMode: creationRule.pointsDistributionMode,
            pointsBuckets: creationRule.pointsBuckets,
            attributePoints: creationRule.attributePoints ?? 0,
            attributeCost: creationRule.attributeCost ?? 6,
            attributeMin: creationRule.attributeMin,
            attributeMax: creationRule.attributeMax,
            backgroundPoints: creationRule.backgroundPoints ?? 0,
            rankSlots: creationRule.rankSlots,
            backgroundCost: creationRule.backgroundCost ?? 2
        };

        return resetData;
    }
};
