import { useState, useEffect, useCallback } from 'react';
import { CharacterSheetData } from '../../types';
import { RulesData } from '../../types/rules';
import { CampaignService } from '../../services/CampaignService';
import { ErrorService } from '../../services/ErrorService';
import { loadRules } from '../../services/RulesLoader';
import { logger } from '../../utils/logger';
import { INITIAL_DATA } from '../../data/initialState';

export const useRulesSync = (
    data: CharacterSheetData,
    rules: RulesData | null,
    setData: (newData: CharacterSheetData | ((prev: CharacterSheetData) => CharacterSheetData)) => void,
    updateRules: (rules: RulesData) => void,
    addLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both') => void
) => {
    const [isSourceSelected, setIsSourceSelected] = useState<boolean>(() => {
        return sessionStorage.getItem('rpg-source-selected') === 'true';
    });
    const [showConflict, setShowConflict] = useState(false);
    const [pendingRules, setPendingRules] = useState<{ rules: RulesData, id: string, name: string } | null>(null);

    // Initial Source Selection Helper
    const handleSourceSelect = useCallback(async (sourceType: 'online' | 'offline', selectedRules?: RulesData, settingId?: string, settingName?: string) => {
        setIsSourceSelected(true);
        sessionStorage.setItem('rpg-source-selected', 'true');

        if (sourceType === 'online' && selectedRules && settingId) {
            const hasCharacter = data.header?.name?.trim() !== '';
            const isDifferentCampaign = data.syncInfo?.settingId !== settingId;

            if (hasCharacter && isDifferentCampaign) {
                setPendingRules({ rules: selectedRules, id: settingId, name: settingName || 'Nouvelle Campagne' });
                setShowConflict(true);
            } else {
                updateRules({
                    ...selectedRules,
                    settingId,
                    settingName: settingName || (selectedRules.settingName as string)
                });
            }
        } else {
            const fallback = await loadRules();
            if (fallback) updateRules(fallback);
            else alert("Impossible de charger les règles locales.");
        }
    }, [data, updateRules]);

    // Restore Rules on Refresh if linked to campaign
    useEffect(() => {
        const syncInfo = data?.syncInfo;
        if (!syncInfo?.settingId || !rules || isSourceSelected === false) return;

        if (rules?.settingId !== syncInfo.settingId) {
            logger.log(`[useRulesSync] Rules Mismatch Detected. Restoring ${syncInfo.settingId}...`);
            CampaignService.loadSetting(syncInfo.settingId).then(restoredRules => {
                if (restoredRules) {
                    updateRules({
                        ...restoredRules,
                        settingId: syncInfo.settingId as string,
                        settingName: syncInfo.settingName || 'Inconnue'
                    });
                    addLog(`Règles de la campagne "${syncInfo.settingName}" restaurées.`, 'info', 'settings');
                }
            }).catch(err => logger.error("[useRulesSync] Failed to restore rules", err));
        }
    }, [data.syncInfo, rules?.settingId, isSourceSelected, updateRules, addLog]);

    const handleConfirmReset = useCallback(() => {
        if (!pendingRules) return;
        setData(JSON.parse(JSON.stringify(INITIAL_DATA)));
        updateRules({ ...pendingRules.rules, settingId: pendingRules.id, settingName: pendingRules.name });
        setShowConflict(false);
        setPendingRules(null);
        addLog(`Nouvelle campagne chargée : ${pendingRules.name}. Fiche réinitialisée.`, 'info', 'settings');
    }, [pendingRules, setData, updateRules, addLog]);

    return {
        isSourceSelected, setIsSourceSelected,
        showConflict, setShowConflict,
        pendingRules, setPendingRules,
        handleSourceSelect,
        handleConfirmReset
    };
};
