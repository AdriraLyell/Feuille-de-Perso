import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { RulesData } from '../types/rules';
import { loadRules } from '../services/RulesLoader';

interface RulesContextType {
    rules: RulesData | null;
    isLoading: boolean;
    error: string | null;
    reloadRules: () => Promise<void>;
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

    const fetchRules = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await loadRules();
            setRules(data);
            // @ts-ignore
            window.rulesStatus = { loaded: true, error: null, version: data?.version };
        } catch (err) {
            setError('Failed to load rules');
            console.error(err);
            // @ts-ignore
            window.rulesStatus = { loaded: false, error: err.toString() };
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    return (
        <RulesContext.Provider value={{ rules, isLoading, error, reloadRules: fetchRules }}>
            {children}
        </RulesContext.Provider>
    );
};
