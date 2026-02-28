import { LibraryFormulaEntry } from '../types';
import { RulesData } from '../types/rules';
import { isFormulaSyntaxValid, isTargetValid } from '../utils/formulaUtils';

export interface ValidationResult {
    status: 'valid' | 'warning' | 'error';
    message: string;
    isValid: boolean;
}

/**
 * Calcule le statut de validation d'une entrée de formule
 */
export const validateFormulaEntry = (
    counter: LibraryFormulaEntry,
    rules: RulesData
): ValidationResult => {
    let status: 'valid' | 'warning' | 'error' = 'valid';
    let message = "Formule complète et valide";

    // L'équation mathématique doit être analysable (sauf si c'est un agrégat auto)
    const isMathValid = counter.aggregateConfig ? true : isFormulaSyntaxValid(counter.formula);

    if (!isMathValid) {
        status = 'error';
        message = "Syntaxe mathématique invalide";
    } else if (counter.type === 'modifier' || (counter as any).type === 'effect') {
        const hasTarget = !!(counter.target && counter.target.trim() !== '');
        const hasOperator = !!(counter.operator && (counter.operator as string) !== '');
        const hasEquation = !!(counter.formula && counter.formula.trim() !== '');
        const actualEffectType = counter.effectType || 'modifier';
        const hasEffectType = !!(actualEffectType && actualEffectType !== '');

        if (!hasEffectType) {
            status = 'error';
            message = "Type d'effet manquant";
        } else if (hasTarget && !counter.forceVariant && !isTargetValid(counter.target!, rules)) {
            status = 'error';
            message = `La cible '${counter.target}' n'existe pas dans les règles`;
        } else if ((!hasTarget && !counter.forceVariant) || !hasOperator || !hasEquation) {
            status = 'warning';
            message = "Modèle incomplet (sera complété dans le trait)";
        } else if (counter.forceVariant && !hasTarget) {
            status = 'warning';
            message = "Cible vide : Le joueur devra saisir le nom manuellement.";
        }
    } else {
        // Pour une variable simple
        if (!counter.formula || counter.formula.trim() === '') {
            status = 'warning';
            message = "Équation vide (sera complétée dans le trait)";
        }
    }

    return {
        status,
        message,
        isValid: status !== 'error'
    };
};
