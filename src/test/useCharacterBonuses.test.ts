import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCharacterBonuses } from '../hooks/useCharacterBonuses';
import { TraitEntry, LibraryEntry } from '../types';

describe('useCharacterBonuses Hook', () => {
    it('should return empty bonuses when no traits are provided', () => {
        const { result } = renderHook(() => useCharacterBonuses([], [], []));
        expect(result.current.attributeBonuses).toEqual({});
    });

    it('should calculate bonuses from library effects', () => {
        const avantages: TraitEntry[] = [{ name: 'Robuste', value: '' }];
        const library: LibraryEntry[] = [{
            id: '1',
            type: 'avantage',
            name: 'Robuste',
            cost: '1',
            pointsLabel: '1',
            description: '',
            effects: [{ id: 'e1', type: 'formula', formula: '1', target: 'constitution', value: 0 }]
        }];

        const { result } = renderHook(() => useCharacterBonuses(avantages, [], library));

        expect(result.current.attributeBonuses['constitution']).toBeDefined();
        expect(result.current.attributeBonuses['constitution'].value).toBe(1);
        expect(result.current.attributeBonuses['constitution'].sources).toContain('Robuste (+1)');
    });

    it('should handle multiple traits affecting the same attribute', () => {
        const avantages: TraitEntry[] = [
            { name: 'Agile', value: '' },
            { name: 'Chat', value: '' }
        ];
        const library: LibraryEntry[] = [
            {
                id: '1',
                type: 'avantage',
                name: 'Agile',
                cost: '1',
                pointsLabel: '1',
                description: '',
                effects: [{ id: 'e1', type: 'formula', formula: '1', target: 'dexterity', value: 0 }]
            },
            {
                id: '2',
                type: 'avantage',
                name: 'Chat',
                cost: '1',
                pointsLabel: '1',
                description: '',
                effects: [{ id: 'e2', type: 'formula', formula: '1', target: 'dexterity', value: 0 }]
            }
        ];

        const { result } = renderHook(() => useCharacterBonuses(avantages, [], library));

        expect(result.current.attributeBonuses['dexterity'].value).toBe(2);
        expect(result.current.attributeBonuses['dexterity'].sources).toHaveLength(2);
    });
});
