
import { CharacterSheetData, ExperienceData, RulesData, CardCalculationResult } from '../types';
import { RuleCalculationsService } from '../services/RuleCalculationsService';

// --- XP CALCULATION LOGIC ---
export const calculateExperienceResults = (data: CharacterSheetData, rules?: RulesData | null): ExperienceData => {
    return RuleCalculationsService.calculateExperienceResults(data, rules || undefined);
};

// --- CARD CALCULATION LOGIC ---
export const calculateCardValue = (data: CharacterSheetData, rules?: RulesData | null): CardCalculationResult | null => {
    return RuleCalculationsService.calculateCardValue(data, rules || null);
};
