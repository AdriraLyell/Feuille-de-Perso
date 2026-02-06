
import { CharacterSheetData, ExperienceData, RulesData } from '../types';
import { RuleCalculationsService } from '../services/RuleCalculationsService';

// --- XP CALCULATION LOGIC ---
export const calculateExperienceResults = (data: CharacterSheetData, rules?: RulesData): ExperienceData => {
    return RuleCalculationsService.calculateExperienceResults(data, rules);
};

// --- CARD CALCULATION LOGIC ---
export const calculateCardValue = (data: CharacterSheetData, rules?: RulesData): string | null => {
    return RuleCalculationsService.calculateCardValue(data, rules || null);
};
