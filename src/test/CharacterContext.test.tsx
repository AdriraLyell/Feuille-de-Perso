
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { CharacterProvider, useCharacterState, useCharacterActions } from '../context/CharacterContext';
import { RulesProvider } from '../context/RulesContext';
import { INITIAL_DATA } from '../data/initialState';

// Mock dependencies
vi.mock('../services/CharacterSyncService', () => ({
    CharacterSyncService: {
        syncCharacter: vi.fn().mockResolvedValue({ success: true })
    }
}));

// Helper component
const TestComponent = () => {
    const { data } = useCharacterState();
    const { updateData } = useCharacterActions();

    return (
        <div>
            <div data-testid="char-name">{data.header.name}</div>
            <button data-testid="update-btn" onClick={() => updateData({ ...data, header: { ...data.header, name: 'New Name' } })}>
                Update
            </button>
        </div>
    );
};

describe('CharacterContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should initialize with initial data if no save exists', async () => {
        render(
            <RulesProvider>
                <CharacterProvider>
                    <TestComponent />
                </CharacterProvider>
            </RulesProvider>
        );

        expect(screen.getByTestId('char-name')).toHaveTextContent(INITIAL_DATA.header.name);
    });

    it('should load from localStorage', async () => {
        const savedData = JSON.parse(JSON.stringify(INITIAL_DATA));
        savedData.header.name = 'Saved Hero';
        localStorage.setItem('rpg-sheet-data', JSON.stringify(savedData));

        render(
            <RulesProvider>
                <CharacterProvider>
                    <TestComponent />
                </CharacterProvider>
            </RulesProvider>
        );

        expect(screen.getByTestId('char-name')).toHaveTextContent('Saved Hero');
    });

    it('should update data and persist to localStorage', async () => {
        render(
            <RulesProvider>
                <CharacterProvider>
                    <TestComponent />
                </CharacterProvider>
            </RulesProvider>
        );

        const btn = screen.getByTestId('update-btn');
        await act(async () => {
            btn.click();
        });

        expect(screen.getByTestId('char-name')).toHaveTextContent('New Name');

        const stored = JSON.parse(localStorage.getItem('rpg-sheet-data') || '{}');
        expect(stored.header.name).toBe('New Name');
    });
});
