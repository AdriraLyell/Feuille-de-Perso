import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useCharacterBonuses } from '../hooks/useCharacterBonuses';
import { TraitEntry, LibraryEntry } from '../types';

describe('useCharacterBonuses Hook', () => {
    it('should return empty bonuses when no traits are provided', () => {
        const { result } = renderHook(() => useCharacterBonuses([], [], []));
        expect(result.current).toEqual({});
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
            effects: [{ id: 'e1', type: 'attribute_bonus', target: 'constitution', value: 1 }]
        }];

        const { result } = renderHook(() => useCharacterBonuses(avantages, [], library));

        expect(result.current['constitution']).toBeDefined();
        expect(result.current['constitution'].value).toBe(1);
        expect(result.current['constitution'].sources).toContain('Robuste (+1)');
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
                effects: [{ id: 'e1', type: 'attribute_bonus', target: 'dexterity', value: 1 }]
            },
            {
                id: '2',
                type: 'avantage',
                name: 'Chat',
                cost: '1',
                pointsLabel: '1',
                description: '',
                effects: [{ id: 'e2', type: 'attribute_bonus', target: 'dexterity', value: 1 }]
            }
        ];

        const { result } = renderHook(() => useCharacterBonuses(avantages, [], library));

        expect(result.current['dexterity'].value).toBe(2);
        expect(result.current['dexterity'].sources).toHaveLength(2);
    });
});
