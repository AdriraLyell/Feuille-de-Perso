import { CharacterSheetData, ExperienceData, RulesData } from '../types';
import {
    triangular,
    getXPCost,
    calculateExperienceResults
} from '../utils/calculations/xpCalculator';
import { calculateCardValue } from '../utils/calculations/cardCalculator';

/**
 * Service centralisant les formules de calcul des règles du jeu.
 * Utilisé par la feuille de personnage (Joueur) et l'éditeur de règles (Admin).
 * 
 * Ce service agit désormais comme une façade déléguant aux calculateurs spécialisés.
 */
export const RuleCalculationsService = {
    /**
     * Calcule la somme triangulaire : n + (n-1) + ... + 1
     */
    triangular,

    /**
     * Calcule le coût en XP pour passer d'un niveau de création à un niveau actuel
     */
    getXPCost,

    /**
     * Calcule le bilan d'XP complet pour un personnage
     */
    calculateExperienceResults,

    /**
     * Calcule la valeur de la carte de tarot basée sur les meilleures compétences
     */
    calculateCardValue
};
