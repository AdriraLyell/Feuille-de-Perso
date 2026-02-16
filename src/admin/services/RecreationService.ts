import { CharacterSheetData, RulesData } from '../../types';
import { recreateCharacterStats } from '../../utils/characterUtils';
import { normalizeString } from '../../utils/stringUtils';
import { generateId } from '../../utils/factories';

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

        // Step 1.5: Reconstruction stricte des compétences (Suppression des variantes et hors-piste)
        // On reconstruit la liste pour matcher EXACTEMENT les règles, sans surplus.
        const definedSkills = currentRules.definitions.skills || {};

        Object.keys(definedSkills).forEach(cat => {
            const ruleNames = definedSkills[cat] || [];
            const existingSkills = resetData.skills[cat] || [];
            const consumedIds = new Set<string>();

            // On crée une nouvelle liste basée strictement sur les règles
            const newSkillList = ruleNames.map(ruleName => {
                // Déterminer si la compétence est variable (ex: "Artisanat : ...")
                const libSkill = currentRules.libraries?.skills?.find(s => normalizeString(s.name) === normalizeString(ruleName));
                const isVariable = libSkill?.isVariable === true;
                // Si variable => variant: "" (attente input utilisateur), sinon undefined (pas de variant)
                const targetVariant = isVariable ? "" : undefined;

                // Tenter de trouver une compétence existante correspondante pour garder l'ID (logs, etc.)
                const match = existingSkills.find(s =>
                    s.name === ruleName && !consumedIds.has(s.id)
                );

                if (match) {
                    consumedIds.add(match.id);
                    // On garde l'ID mais on reset le reste
                    return {
                        ...match,
                        value: 0,
                        creationValue: 0,
                        variant: targetVariant, // Reset correct selon la définition
                        current: 0
                    };
                } else {
                    // Création d'une entrée vierge
                    return {
                        id: generateId(),
                        name: ruleName,
                        value: 0,
                        creationValue: 0,
                        max: 0,
                        variant: targetVariant
                    };
                }
            });

            resetData.skills[cat] = newSkillList;
        });

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
