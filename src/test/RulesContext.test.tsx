
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import React from 'react';
import { RulesProvider, useRules } from '../context/RulesContext';
import * as RulesLoader from '../services/RulesLoader';
import * as idbKeyval from 'idb-keyval';

// Mock dependencies
vi.mock('../services/RulesLoader', () => ({
    loadRules: vi.fn()
}));

vi.mock('idb-keyval', () => ({
    get: vi.fn(),
    set: vi.fn()
}));

// Helper component to test context
const TestComponent = () => {
    const { rules, isLoading, error } = useRules();
    return (
        <div>
            <div data-testid="loading">{isLoading ? 'Loading' : 'Loaded'}</div>
            {error && <div data-testid="error">{error}</div>}
            {rules && <div data-testid="rules-version">{rules.version}</div>}
        </div>
    );
};

describe('RulesContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
    });

    it('should load rules from cache initially', async () => {
        const mockCachedRules = { version: '1.0.0-cached', definitions: {}, libraries: {}, configurations: {} };
        vi.mocked(idbKeyval.get).mockResolvedValue(mockCachedRules);
        vi.mocked(RulesLoader.loadRules).mockResolvedValue(null);

        render(
            <RulesProvider>
                <TestComponent />
            </RulesProvider>
        );

        expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

        await waitFor(() => {
            expect(screen.getByTestId('rules-version')).toHaveTextContent('1.0.0-cached');
        });
    });

    it('should load fresh rules and update cache', async () => {
        const mockFreshRules = { version: '2.0.0-fresh', definitions: {}, libraries: {}, configurations: {} };
        vi.mocked(idbKeyval.get).mockResolvedValue(null);
        vi.mocked(RulesLoader.loadRules).mockResolvedValue(mockFreshRules as any);

        render(
            <RulesProvider>
                <TestComponent />
            </RulesProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('rules-version')).toHaveTextContent('2.0.0-fresh');
        });

        expect(idbKeyval.set).toHaveBeenCalledWith('rpg-rules-cache', mockFreshRules);
    });

    it('should handle load errors', async () => {
        vi.mocked(idbKeyval.get).mockResolvedValue(null);
        vi.mocked(RulesLoader.loadRules).mockRejectedValue(new Error('Network Error'));

        render(
            <RulesProvider>
                <TestComponent />
            </RulesProvider>
        );

        await waitFor(() => {
            expect(screen.getByTestId('error')).toHaveTextContent('Failed to load rules');
        });
        expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });
});
