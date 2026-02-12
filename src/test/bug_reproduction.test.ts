
import { describe, it, expect } from 'vitest';
import { CharacterSheetData, DotEntry } from '../types';

describe('Bug Reproduction: Counter Sync Logic', () => {

    // Mimic the FIXED logic found in CharacterSheet.tsx updateCounter
    function updateCounterLogic(
        prev: CharacterSheetData,
        id: string,
        value: number,
        isCreationMode: boolean,
        // We need rules for the fix to work (to check category behavior)
        rules: any
    ): CharacterSheetData {
        const updatedState = JSON.parse(JSON.stringify(prev)); // Deep copy

        // Counter Key Lookup
        const counterKey = Object.keys(prev.counters).find(k => k === id) || id;
        const currentRaw = prev.counters[counterKey];
        const current = Array.isArray(currentRaw) ? currentRaw[0] : (currentRaw as DotEntry | undefined);

        if (current) {
            // BLOCKING LOGIC
            const def = rules?.definitions?.counters?.[id] || rules?.definitions?.counters?.[counterKey];
            if (!isCreationMode && def && (def.xpCost <= 0)) {
                if (value > current.value) return prev; // BLOCKED
            }


            const newItem = { ...current };
            newItem.value = value;

            // Logic from lines 284-289: creationValue is NOT updated for counters
            if ((newItem.current || 0) > value) newItem.current = value;

            updatedState.counters[counterKey] = newItem;
        }

        // SYNC LOGIC (Lines 298-316)
        if (prev.skills) {
            const newSkills = { ...updatedState.skills }; // Using updatedState.skills
            Object.keys(newSkills).forEach(catId => {
                const list = newSkills[catId];
                if (Array.isArray(list)) {
                    // Identify if valid Category for Counters
                    const catDef = rules?.definitions?.skillCategories?.find((c: any) => c.id === catId);
                    const isCounterCat = catDef?.behavior === 'Compteur';

                    const idx = list.findIndex((s: DotEntry) => s.id === id);
                    if (idx !== -1) {
                        const newList = [...list];

                        // FIX LOGIC:
                        const shouldUpdateCreation = isCreationMode && !isCounterCat;

                        newList[idx] = {
                            ...newList[idx],
                            value,
                            creationValue: shouldUpdateCreation ? value : newList[idx].creationValue
                        };
                        newSkills[catId] = newList;
                    }
                }
            });
            updatedState.skills = newSkills;
        }

        return updatedState;
    }

    const mockRules = {
        definitions: {
            skillCategories: [
                { id: 'cat_counter', behavior: 'Compteur' },
                { id: 'cat_skill', behavior: 'Compétence' }
            ],
            counters: {
                'volonte': { xpCost: 5 },
                'sante': { xpCost: 0 }
            }
        }
    };

    it('should PRESERVE skill creationValue when updating counter in creation mode (Fixed)', () => {
        const initialState: CharacterSheetData = {
            counters: {
                'volonte': { id: 'volonte', name: 'Volonté', value: 3, creationValue: 3, current: 0 }
            },
            skills: {
                'cat_counter': [
                    { id: 'volonte', name: 'Volonté', value: 3, creationValue: 3 }
                ]
            },
            creationConfig: { active: true } // Creation Mode Active
        } as any;

        // User increases Volonté to 5
        const newState = updateCounterLogic(initialState, 'volonte', 5, true, mockRules);

        // Counter creationValue should remain 3
        // @ts-ignore
        expect(newState.counters['volonte'].creationValue).toBe(3);

        // Skill creationValue SHOULD now be 3 (FIXED)
        expect(newState.skills['cat_counter'][0].creationValue).toBe(3);
        // Value updated
        expect(newState.skills['cat_counter'][0].value).toBe(5);
    });

    it('should BLOCK update if counter is blocked (xpCost <= 0) and not in creation mode', () => {
        const initialState: CharacterSheetData = {
            counters: {
                'sante': { id: 'sante', name: 'Santé', value: 7, creationValue: 7, current: 0 }
            },
            skills: {},
            creationConfig: { active: false }
        } as any;

        // Try to increase Sante to 8 (Should be blocked)
        const newState = updateCounterLogic(initialState, 'sante', 8, false, mockRules);

        // Should remain 7
        // @ts-ignore
        expect(newState.counters['sante'].value).toBe(7);
    });
});
