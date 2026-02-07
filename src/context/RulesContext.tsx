import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RulesData } from '../types/rules';
import { loadRules } from '../services/RulesLoader';

interface RulesContextType {
    rules: RulesData | null;
    isLoading: boolean;
    error: string | null;
    isOnlineMode: boolean;
    reloadRules: () => Promise<void>;
    updateRules: (newRules: RulesData) => void;
}

const RulesContext = createContext<RulesContextType | undefined>(undefined);

export const useRules = () => {
    const context = useContext(RulesContext);
    if (!context) {
        throw new Error('useRules must be used within a RulesProvider');
    }
    return context;
};

interface RulesProviderProps {
    children: ReactNode;
}

export const RulesProvider: React.FC<RulesProviderProps> = ({ children }) => {
    const [rules, setRules] = useState<RulesData | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isOnlineMode, setIsOnlineMode] = useState<boolean>(false);

    const fetchRules = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await loadRules();
            setRules(data);
            // Determine if we're in online mode (rules came from BDD/Setting)
            // If rules have a settingId or source indicator, we're online
            const online = !!(data as any)?.settingId || (data as any)?.source === 'database';
            setIsOnlineMode(online);
            // @ts-ignore
            window.rulesStatus = { loaded: true, error: null, version: data?.version, online };
        } catch (err) {
            setError('Failed to load rules');
            console.error(err);
            setIsOnlineMode(false);
            // @ts-ignore
            window.rulesStatus = { loaded: false, error: err.toString() };
        } finally {
            setIsLoading(false);
        }
    };

    // Wrapper for updateRules that auto-detects online mode
    const handleUpdateRules = (newRules: RulesData) => {
        setRules(newRules);
        // Auto-detect online mode from rules data
        const online = !!(newRules as any)?.settingId || (newRules as any)?.source === 'database';
        setIsOnlineMode(online);
        console.log('[RulesContext] Rules updated, online mode:', online);
    };

    return (
        <RulesContext.Provider value={{ rules, isLoading, error, isOnlineMode, reloadRules: fetchRules, updateRules: handleUpdateRules }}>
            {children}
        </RulesContext.Provider>
    );
};
