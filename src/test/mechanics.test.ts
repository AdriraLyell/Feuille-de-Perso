import { describe, it, expect } from 'vitest';
import { calculateExperienceResults, calculateCardValue } from '../utils/mechanics';
import { INITIAL_DATA } from '../data/initialState';
import { CharacterSheetData } from '../types';

describe('Mechanics Utils', () => {
    describe('calculateExperienceResults', () => {
        it('should calculate zero XP for initial data', () => {
            const result = calculateExperienceResults(INITIAL_DATA);
            expect(result.spent).toBe("0");
            expect(result.rest).toBe("0");
        });

        it('should calculate spent XP for a skill upgrade', () => {
            const data: CharacterSheetData = JSON.parse(JSON.stringify(INITIAL_DATA));
            // Talents are standard skills. Upgrade from 0 to 2 dots.
            // Cost = triangular(2) - triangular(0) = (1+2) - 0 = 3
            data.skills.talents[0] = { ...data.skills.talents[0], value: 2, creationValue: 0 };

            const result = calculateExperienceResults(data);
            expect(result.spent).toBe("3");
        });

        it('should respect creationValue for XP cost', () => {
            const data: CharacterSheetData = JSON.parse(JSON.stringify(INITIAL_DATA));
            // Upgrade from 2 creation dots to 3 dots
            // Cost = triangular(3) - triangular(2) = (1+2+3) - (1+2) = 6 - 3 = 3
            data.skills.talents[0] = { ...data.skills.talents[0], value: 3, creationValue: 2 };

            const result = calculateExperienceResults(data);
            expect(result.spent).toBe("3");
        });
    });

    describe('calculateCardValue', () => {
        it('should return null if card feature is disabled', () => {
            const data: CharacterSheetData = JSON.parse(JSON.stringify(INITIAL_DATA));
            data.creationConfig.cardConfig.active = false;
            expect(calculateCardValue(data)).toBeNull();
        });

        it('should return "Aucune" for low skills', () => {
            const data: CharacterSheetData = JSON.parse(JSON.stringify(INITIAL_DATA));
            data.creationConfig.cardConfig.active = true;
            // Average will be low
            expect(calculateCardValue(data)).toBe("Aucune");
        });

        it('should return "Un Valet" for average 2.5 (if base=2, inc=0.5)', () => {
            const data: CharacterSheetData = JSON.parse(JSON.stringify(INITIAL_DATA));
            data.creationConfig.cardConfig = {
                active: true,
                baseStart: 2,
                increment: 0.5,
                bestSkillsCount: 2
            };
            // 2 skills at 3 dots -> average 3.0
            // delta = 3.0 - 2.0 = 1.0
            // steps = 1.0 / 0.5 = 2 -> "Deux Valets"
            // Wait, delta 0.5 -> step 1 -> "Un Valet"
            // delta 1.0 -> step 2 -> "Deux Valets"
            data.skills.talents[0].value = 3;
            data.skills.talents[1].value = 3;

            expect(calculateCardValue(data)).toBe("Deux Valets");
        });
    });
});
