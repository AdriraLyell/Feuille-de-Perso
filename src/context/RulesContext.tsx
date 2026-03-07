import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { RulesData } from '../types/rules';
import { loadRules } from '../services/RulesLoader';
import { migrateRulesToV2 } from '../utils/migrations';
import { ErrorService } from '../services/ErrorService';
import { OfflineStorageService } from '../services/OfflineStorageService';
import { logger } from '../utils/logger';

interface RulesContextType {
    rules: RulesData | null;
    isLoading: boolean;
    error: string | null;
    isOnlineMode: boolean;
    reloadRules: (forceId?: string) => Promise<void>;
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

    const fetchRules = async (forceId?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            // 0. Determine target setting ID before checking cache
            const urlParams = new URLSearchParams(window.location.search);
            const urlSettingId = urlParams.get('s') || urlParams.get('setting');
            const storedSettingId = localStorage.getItem('rpg-active-setting-id');
            const targetId = forceId || urlSettingId || storedSettingId || undefined;

            // 1. Try to load from cache first for instant UI
            const cached = await OfflineStorageService.getActiveRules();
            if (cached) {
                // ROBUSTNESS: Only apply generic cache if it matches the requested setting ID (or no setting ID is requested)
                const cacheMatchesTarget = !targetId || cached.settingId === targetId;
                
                if (cacheMatchesTarget) {
                    logger.log('[RulesContext] Loaded from cache (matched target)');
                    setRules(migrateRulesToV2(cached));
                    setIsLoading(false);
                } else {
                    logger.warn('[RulesContext] Cache mismatch (expected:', targetId, ', got:', cached.settingId, '). Ignoring cache.');
                    // Optionally: try to find a specific cache for this settingId
                    if (targetId) {
                        const specificCache = await OfflineStorageService.getRulesBySettingId(targetId);
                        if (specificCache) {
                            logger.log('[RulesContext] Loaded from specific campaign cache');
                            setRules(migrateRulesToV2(specificCache));
                            setIsLoading(false);
                        }
                    }
                }
            }

            // 2. Fetch fresh rules from source
            const data = await loadRules(targetId);
            if (data) {
                const migrated = migrateRulesToV2(data);
                if (migrated) {
                    setRules(migrated);
                    const online = !!migrated.settingId || migrated.source === 'database';
                    setIsOnlineMode(online);
                }

                // 3. Update cache
                await OfflineStorageService.saveRules(data);
            }
            window.rulesStatus = { loaded: true, error: null, version: data?.version, online: !!(data?.settingId || data?.source === 'database') };
        } catch (err) {
            setError('Failed to load rules');
            ErrorService.handleError(err, { context: 'RulesContext.fetchRules' });
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
        if (migrated) {
            setRules(migrated);
            // Auto-detect online mode from rules data
            const online = !!migrated.settingId || migrated.source === 'database';
            setIsOnlineMode(online);

            // PERSISTENCE FIX: Save to cache so it survives refresh
            OfflineStorageService.saveRules(newRules);

            // ROBUSTNESS: Persist the active setting ID
            if (newRules.settingId) {
                localStorage.setItem('rpg-active-setting-id', newRules.settingId);
            }

            setIsLoading(false); // Ensure loading is stopped
            logger.log('[RulesContext] Rules updated, online mode:', online);
        }
    };

    return (
        <RulesContext.Provider value={{ rules, isLoading, error, isOnlineMode, reloadRules: fetchRules, updateRules: handleUpdateRules }}>
            {children}
        </RulesContext.Provider>
    );
};
