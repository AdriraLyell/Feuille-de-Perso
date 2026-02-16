import { CharacterSheetData, RulesData, DotEntry, AttributeEntry } from '../../types';
import { getXPCost } from '../../utils/calculations/xpCalculator';
import { resetCharacterValues } from '../../utils/characterUtils';

/**
 * Service gérant la logique de recréation (Respec) d'un personnage.
 */
export const RecreationService = {
    /**
     * Calcule le montant total d'XP à rembourser.
     * Basé sur les dépenses enregistrées (val2 pour attributs, value > creationValue pour compétences).
     */
    calculateRefundValue(data: CharacterSheetData): number {
        let totalRefund = 0;

        // Facteurs de coût (historiques si présents, sinon défauts)
        const attributeFactor = data.xpCosts?.attributeFactor ?? 6;
        const skillFactor = data.xpCosts?.skillFactor ?? 1;

        // 1. Remboursement des Attributs (val2)
        Object.values(data.attributes).forEach(cat => {
            cat.forEach((attr: AttributeEntry) => {
                const purchased = parseInt(attr.val2) || 0;
                totalRefund += purchased * attributeFactor;
            });
        });

        // 2. Remboursement des Compétences (XP dépensée au-dessus du niveau de création)
        Object.keys(data.skills).forEach(catId => {
            const list = data.skills[catId];
            list.forEach((skill: DotEntry) => {
                // On utilise getXPCost pour calculer la différence triangulaire payée par XP
                const cost = getXPCost(skill.value, skill.creationValue || 0, skillFactor, true);
                totalRefund += cost;
            });
        });

        // 3. Remboursement des Compteurs si configurés avec XP
        if (data.counters) {
            Object.keys(data.counters).forEach(key => {
                if (key === 'custom') return;
                const counter = data.counters[key];
                if (!Array.isArray(counter)) {
                    // Pour les compteurs simples (Volonté, Confiance), on compare value et creationValue
                    // Note: Le coût des compteurs est souvent fixe (5 XP le point)
                    // On pourrait affiner mais par défaut on suit la logique de xpCalculator
                    const cost = getXPCost(counter.value, counter.creationValue || 0, 5, false);
                    totalRefund += cost;
                }
            });

            data.counters.custom.forEach(counter => {
                const cost = getXPCost(counter.value, counter.creationValue || 0, 5, false);
                totalRefund += cost;
            });
        }

        return totalRefund;
    },

    /**
     * Applique la recréation sur les données du personnage.
     * 1. Efface la création actuelle.
     * 2. Ajoute l'XP de remboursement.
     * 3. Réactive le mode création.
     */
    performRecreation(data: CharacterSheetData, refundAmount: number, currentRules: RulesData): CharacterSheetData {
        // Step 1: Reset complet des valeurs (via l'utilitaire existant qui gère aussi header, combat, etc.)
        const resetData = resetCharacterValues(data);

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

        // On s'assure que les specialisations sont vidées car invalidées par le reset compétences
        resetData.specializations = {};

        return resetData;
    }
};
