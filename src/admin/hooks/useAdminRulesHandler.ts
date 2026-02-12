import { useState, useCallback } from 'react';
import { RulesData } from '../../types/rules';
import { CampaignService } from '../../services/CampaignService';
import { LibraryService } from '../../services/LibraryService';
import { generateRulesJSONContent } from '../utils/rulesGenerator';
import { usePersistence } from './usePersistence';

declare global {
    interface Window {
        EXTERNAL_RULES?: RulesData;
    }
}

export const useAdminRulesHandler = () => {
    const [rules, setRules] = useState<RulesData | null>(null);
    const [currentSettingId, setCurrentSettingId] = useState<string | null>(null);
    const [currentSettingName, setCurrentSettingName] = useState<string>("");
    const [globalUsage, setGlobalUsage] = useState<Record<string, number>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [saveFeedback, setSaveFeedback] = useState<{ isOpen: boolean; success: boolean; message: string } | null>(null);

    const { hasUnsavedChanges, markAsSaved, resetPersistence } = usePersistence(rules);

    const handleSelectSetting = useCallback(async (id: string, name: string, loadedRules: RulesData) => {
        setCurrentSettingId(id);
        setCurrentSettingName(name);
        setRules(loadedRules);
        resetPersistence();

        const usage = await LibraryService.loadGlobalUsage(id);
        setGlobalUsage(usage || {});
    }, [resetPersistence]);

    const handleUpdateRules = useCallback((newRules: RulesData) => {
        setRules(newRules);
        window.EXTERNAL_RULES = newRules;
    }, []);

    const refreshRules = useCallback(async () => {
        if (!currentSettingId) return;
        const loadedRules = await CampaignService.loadSetting(currentSettingId);
        if (loadedRules) {
            setRules(loadedRules);
            resetPersistence();
        }
    }, [currentSettingId, resetPersistence]);

    const handleSaveToCloud = useCallback(async () => {
        if (!currentSettingId || !rules) return;
        setIsSaving(true);
        const result = await CampaignService.saveSetting(currentSettingId, rules);
        if (result.success) {
            markAsSaved();
            setSaveFeedback({
                isOpen: true,
                success: true,
                message: "Les règles ont été sauvegardées avec succès dans la base de données."
            });
        } else {
            setSaveFeedback({
                isOpen: true,
                success: false,
                message: result.message || "Une erreur inconnue est survenue."
            });
        }
        setIsSaving(false);
    }, [currentSettingId, markAsSaved, rules]);

    const handleExport = useCallback(() => {
        if (!rules) return;
        const ruleString = generateRulesJSONContent(rules);
        const blob = new Blob([ruleString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rules.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [rules]);

    const clearRules = useCallback(() => {
        setCurrentSettingId(null);
        setRules(null);
    }, []);

    return {
        rules,
        currentSettingId,
        currentSettingName,
        globalUsage,
        isSaving,
        saveFeedback,
        setSaveFeedback,
        hasUnsavedChanges,
        handleSelectSetting,
        handleUpdateRules,
        refreshRules,
        handleSaveToCloud,
        handleExport,
        clearRules
    };
};
