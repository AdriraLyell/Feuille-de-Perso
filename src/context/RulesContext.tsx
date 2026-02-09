import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { RulesData } from '../types/rules';
import { loadRules } from '../services/RulesLoader';
import { migrateRulesToV2 } from '../utils/migrations';
import { ErrorService } from '../services/ErrorService';
import { get as getCache, set as setCache } from 'idb-keyval';

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
            // 1. Try to load from cache first for instant UI
            const cached = await getCache('rpg-rules-cache');
            if (cached) {
                console.log('[RulesContext] Loaded from cache');
                setRules(migrateRulesToV2(cached));
                setIsLoading(false);
            }

            // 2. Fetch fresh rules from source
            const urlParams = new URLSearchParams(window.location.search);
            const urlSettingId = urlParams.get('s') || urlParams.get('setting');
            const data = await loadRules(urlSettingId || undefined);
            if (data) {
                const migrated = migrateRulesToV2(data);
                setRules(migrated);
                const online = !!migrated.settingId || migrated.source === 'database';
                setIsOnlineMode(online);

                // 3. Update cache
                await setCache('rpg-rules-cache', data);
            }
            window.rulesStatus = { loaded: true, error: null, version: data?.version, online: !!(data?.settingId || data?.source === 'database') };
        } catch (err) {
            setError('Failed to load rules');
            ErrorService.handleError(err, { context: 'RulesContext.fetchRules' });
            setIsOnlineMode(false);
            setIsOnlineMode(false);
            window.rulesStatus = { loaded: false, error: err instanceof Error ? err.toString() : String(err) };
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    // Wrapper for updateRules that auto-detects online mode
    const handleUpdateRules = (newRules: RulesData) => {
        const migrated = migrateRulesToV2(newRules);
        setRules(migrated);
        // Auto-detect online mode from rules data
        const online = !!migrated.settingId || migrated.source === 'database';
        setIsOnlineMode(online);
        setIsLoading(false); // Ensure loading is stopped
        console.log('[RulesContext] Rules updated, online mode:', online);
    };

    return (
        <RulesContext.Provider value={{ rules, isLoading, error, isOnlineMode, reloadRules: fetchRules, updateRules: handleUpdateRules }}>
            {children}
        </RulesContext.Provider>
    );
};
