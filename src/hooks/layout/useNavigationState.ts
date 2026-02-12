import { useState, useCallback } from 'react';

export const useNavigationState = () => {
    const [mode, setMode] = useState<'sheet' | 'settings'>('sheet');
    const [sheetTab, setSheetTab] = useState<'p1' | 'specs' | 'p2' | 'xp' | 'notes'>('p1');
    const [pendingMode, setPendingMode] = useState<'sheet' | 'settings' | null>(null);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const [isSettingsDirty, setIsSettingsDirty] = useState(false);

    const handleSwitchMode = useCallback((targetMode: 'sheet' | 'settings') => {
        if (mode === targetMode) return;
        if (mode === 'settings' && isSettingsDirty) {
            setPendingMode(targetMode);
            setShowDiscardConfirm(true);
        } else {
            setMode(targetMode);
        }
    }, [mode, isSettingsDirty]);

    const confirmDiscard = useCallback(() => {
        setIsSettingsDirty(false);
        setShowDiscardConfirm(false);
        if (pendingMode) {
            setMode(pendingMode);
            setPendingMode(null);
        } else {
            setMode('sheet');
        }
    }, [pendingMode]);

    return {
        mode, setMode,
        sheetTab, setSheetTab,
        showDiscardConfirm, setShowDiscardConfirm,
        isSettingsDirty, setIsSettingsDirty,
        handleSwitchMode,
        confirmDiscard
    };
};
