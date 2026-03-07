import React, { useState, useEffect, lazy, Suspense } from 'react';

import { useCharacter } from '../../context/CharacterContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { CharacterSheetData, PrintSelection } from '../../types';
import { APP_VERSION } from '../../constants/app';
import { migrateData } from '../../utils/migrations';
import { useRules } from '../../context/RulesContext';

import { CampaignService } from '../../services/CampaignService';
import { ErrorService } from '../../services/ErrorService';

import { logger } from '../../utils/logger';
import { useCloudSyncCheck } from '../../hooks/useCloudSyncCheck';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';

// Static Components
import DiegeticNavigation from './DiegeticNavigation';
import CharacterSheet from '../CharacterSheet';
import CharacterSheetPage2 from '../CharacterSheetPage2';
import CharacterSheetInventaire from '../CharacterSheetInventaire';
import CharacterSheetSpecializations from '../CharacterSheetSpecializations';
import CharacterSheetXP from '../CharacterSheetXP';
import CampaignNotes from '../CampaignNotes';
import CreationHUD from '../CreationHUD';
import SafetyAlert from '../ui/SafetyAlert';

// Lazy Loaded Components
const RulesSourceSelector = lazy(() => import('../RulesSourceSelector'));
const CampaignConflictModal = lazy(() => import('../ui/CampaignConflictModal'));
const SettingsView = lazy(() => import('../SettingsView'));
import { SyncConflictModal } from '../sync/SyncConflictModal';
import { Layers, FileType, List, TrendingUp, Book, Package, Clock, X, Trash2, Check, Sparkles, Loader2 } from 'lucide-react';
import { useEditMode } from '../../hooks/sheet/useEditMode';
import { useCreationMode } from '../../hooks/useCreationMode';
import { exportCharacterAsJSON } from '../../utils/importExportUtils';
import { generateId } from '../../utils/factories';
import { reconcileRulesWithState } from '../../utils/rulesReconciler';
import { useNavigationState } from '../../hooks/layout/useNavigationState';
import { usePrintManager } from '../../hooks/layout/usePrintManager';
import { useRulesSync } from '../../hooks/layout/useRulesSync';
import PostItBoard from '../ui/PostItBoard';
import LayoutModals from './LayoutModals';
import MessageWidget from '../messaging/MessageWidget';
import { useMessagingContacts } from '../../hooks/messaging/useMessagingContacts';
import { useUnreadCount } from '../../hooks/messaging/useUnreadCount';
import { useSheetLayout } from '../../hooks/useSheetLayout';

/** Wrapper minimal pour appeler le hook au niveau composant */
const MessagingWidgetPlayer: React.FC<{
    settingId: string;
    viewerId: string;
    viewerName: string;
    isOpen: boolean;
    onToggle: (open: boolean) => void;
}> = ({ settingId, viewerId, viewerName, isOpen, onToggle }) => {
    const contacts = useMessagingContacts({ settingId, viewerId });
    return (
        <MessageWidget
            settingId={settingId}
            viewerId={viewerId}
            viewerName={viewerName}
            contacts={contacts}
            isOpen={isOpen}
            onToggle={onToggle}
        />
    );
};

const MainLayout: React.FC = () => {
    const {
        data,
        updateData: setData,
        addLog,
        importData,
        isSyncing,
        sync,
        isEditMode,
        setEditMode: setIsEditMode,
        editLayoutMode,
        setEditLayoutMode,
        clearLayout,
        autoFitLayout
    } = useCharacter();
    const { rules, updateRules, isOnlineMode, reloadRules, isLoading: isRulesLoading } = useRules();

    // Sheet Modes Hooks
    const {
        showEditWarning,
        setShowEditWarning,
        handleToggleEditMode,
        executeEditModeActivation
    } = useEditMode(isEditMode, setIsEditMode);

    const {
        showCreationWarning,
        handleToggleCreationMode,
        executeCreationActivation,
        setShowCreationWarning
    } = useCreationMode(data, (newData: CharacterSheetData) => setData(newData), addLog, () => handleSwitchMode('sheet'));

    // Custom Hooks
    const [isLandscape, setIsLandscape] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('rpg-landscape-mode');
            return saved === 'true';
        }
        return false;
    });

    useEffect(() => {
        localStorage.setItem('rpg-landscape-mode', String(isLandscape));
    }, [isLandscape]);
    const {
        mode,
        sheetTab, setSheetTab,
        showDiscardConfirm, setShowDiscardConfirm,
        confirmDiscard,
        handleSwitchMode
    } = useNavigationState();

    const {
        showPrintModal, setShowPrintModal,
        pagesToPrint,
        handlePrintConfirm
    } = usePrintManager(isLandscape);

    const {
        isSourceSelected, setIsSourceSelected,
        showConflict, setShowConflict,
        pendingRules,
        handleSourceSelect,
        handleConfirmReset
    } = useRulesSync(data, rules, setData, updateRules, addLog);

    const { hasUpdate, mjMessage } = useCloudSyncCheck(data);

    const { portraitLayout, landscapeLayout } = useSheetLayout(data, rules);

    // Bandeau de récréation MJ
    const [pendingMjUpdate, setPendingMjUpdate] = React.useState<{ data: CharacterSheetData; message: string } | null>(null);
    const [conflictData, setConflictData] = React.useState<CharacterSheetData | null>(null);

    const handleRemoteCharacterUpdate = React.useCallback(async (remoteDataRaw: Record<string, unknown>) => {
        // 0. Decompress images before applying the remote payload
        const { ImageSyncResolver } = await import('../../services/ImageSyncResolver');
        const remoteData = await ImageSyncResolver.injectImagesAfterSync(remoteDataRaw) as CharacterSheetData;

        const remoteSyncInfo = remoteData.syncInfo;
        const localSyncInfo = data?.syncInfo;

        // 1. Check for MJ Message (Direct recreation proposal)
        const message = remoteSyncInfo?.mjMessage;
        // Only show banner if it's a NEW message we don't have locally yet
        if (message && message !== data?.syncInfo?.mjMessage) {
            setPendingMjUpdate({ data: remoteData, message });
            return;
        }

        // 2. Automated Conflict Detection (Timestamps)
        if (remoteSyncInfo?.lastSynced && localSyncInfo?.lastLocalEdit) {
            // If local edit happened AFTER the last time we were in sync with server,
            // and the server version is DIFFERENT from our base, it's a conflict.
            const hasLocalChanges = !!localSyncInfo.isDirty || (localSyncInfo.lastLocalEdit > (localSyncInfo.lastSynced || 0));

            if (hasLocalChanges && remoteSyncInfo.lastSynced !== localSyncInfo.lastSynced) {
                logger.warn("[Conflict] Remote update received but local changes exist. Blocking auto-overwrite.");
                setConflictData(remoteData);
                return;
            }
        }

        // 3. No conflict or forced update: Apply remote data
        // Only apply if it's actually newer or we are "clean"
        setData(remoteData, true); // true = isSyncAction (don't mark as dirty)
        addLog("Fiche mise à jour par le serveur.", "info", "sheet", "remote-sync-silent");

    }, [data, setData, addLog]);

    const handleResolveConflict = (finalData: CharacterSheetData) => {
        setData(finalData, true);
        setConflictData(null);
        addLog("Conflit résolu.", "success", "sheet");
    };

    // Notifications temps réel : admin → joueur
    useRealtimeSync({
        settingId: rules?.settingId,
        characterId: data?.syncInfo?.syncId,
        isOnlineMode,
        reloadRules,
        addLog,
        onRemoteCharacterUpdate: handleRemoteCharacterUpdate,
    });

    // Auto-Save Logic
    const { countdown } = useAutoSave(data, false, (mode) => sync(mode));

    // Other UI States

    const [showImportExport, setShowImportExport] = useState(false);
    const [showChangelog, setShowChangelog] = useState(false);
    const [showUserGuide, setShowUserGuide] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const [historyTab, setHistoryTab] = useState<'sheet' | 'settings'>('sheet');
    const [showAppearance, setShowAppearance] = useState(false);
    const [showSync, setShowSync] = useState(false);
    const [showCampaignInfo, setShowCampaignInfo] = useState(false);
    const [isMessagingOpen, setIsMessagingOpen] = useState(false);

    const unreadMessagesCount = useUnreadCount(rules?.settingId, data.syncInfo?.syncId);

    // Guidance Logic
    const shouldHighlightMystic = React.useMemo(() => {
        const active = rules?.configurations?.creation?.mysticAbilities?.active;
        const hasTrait = data?.page2?.avantages?.some((t) => t.mysticAbilityId);
        return !!(active && !hasTrait && data?.creationConfig?.active);
    }, [rules, data]);

    // Initialize Reference State & Error Service
    useEffect(() => {

        ErrorService.init(addLog);

        // Show welcome message if available and not shown in this session
        if (rules?.showMetadataToPlayers && rules?.welcomeMessage) {
            const hasShownWelcome = sessionStorage.getItem(`welcome-shown-${rules.settingId}`);
            if (!hasShownWelcome) {
                setShowCampaignInfo(true);
                sessionStorage.setItem(`welcome-shown-${rules.settingId}`, 'true');
            }
        }
    }, [rules, addLog]);

    // Logging helpers
    const clearCurrentLogs = () => {
        setData((prev: CharacterSheetData) => ({
            ...prev,
            appLogs: prev.appLogs.filter((log) => log.category !== historyTab)
        }));
    };

    const filteredLogs = (data.appLogs || []).filter((log) => {
        if (log.category === 'both') return true;
        return log.category === historyTab;
    });

    const handlePrintRequest = () => setShowPrintModal(true);

    const handleImportSuccess = async (newData: CharacterSheetData) => {
        setIsSourceSelected(true);
        sessionStorage.setItem('rpg-source-selected', 'true');
        importData(newData);
        const migrated = migrateData(newData as unknown as import('../../utils/migrations/registry').MigratableData);

        const syncInfo = migrated.syncInfo; // Extract syncInfo for clarity

        if (syncInfo?.settingId) {
            const currentSettingId = rules?.settingId;
            try {
                const freshRules = await CampaignService.loadSetting(syncInfo.settingId);
                if (freshRules && syncInfo) {
                    updateRules({
                        ...freshRules,
                        settingId: syncInfo.settingId,
                        settingName: syncInfo.settingName
                    });

                    // Added narrowing check for TypeScript
                    if (syncInfo.settingId !== currentSettingId) {
                        addLog(`Règles de la campagne "${syncInfo.settingName}" chargées.`, 'success', 'settings');
                    }
                }
            } catch (e) {
                ErrorService.handleError(e, { context: 'MainLayout.handleImportSuccess', userMessage: "Echec de la synchro des règles." });
            }
        }

        handleSwitchMode('sheet');
    };

    useEffect(() => {
        if (hasUpdate && mjMessage && !pendingMjUpdate) {
            // Si le joueur revient après un "Plus tard" et qu'il n'y a pas de bandeau actif,
            // on garde juste l'indicateur sur le bouton Sync sans respammer le bandeau.
        } else if (hasUpdate && !mjMessage) {
            // Simple mise à jour de données sans action MJ, on loggue discrètement.
            addLog("Mise à jour disponible sur le Cloud. Ouvrez 'Sync' pour récupérer.", "info", "settings");
        }
    }, [hasUpdate, mjMessage, pendingMjUpdate, addLog]);

    const handleResetLayout = React.useCallback(() => {
        clearLayout(portraitLayout, landscapeLayout);
        addLog("Agencement réinitialisé par défaut", "info", "sheet");
    }, [clearLayout, addLog, portraitLayout, landscapeLayout]);

    const handleAutoFitLayout = React.useCallback(() => {
        const totalH = isLandscape ? 1205 : 1560;
        const fixedH = 376;
        const colCount = isLandscape ? 5 : 4;
        const availablePixels = totalH - fixedH;
        const availableRows = Math.floor(availablePixels / 24);
        autoFitLayout(colCount, availableRows);
        addLog("Agencement optimisé automatiquement", "info", "sheet");
    }, [isLandscape, autoFitLayout, addLog]);

    const handleConfirmBackup = async () => {
        await exportCharacterAsJSON(data, addLog);
    };

    const handleStartAttributeMigration = React.useCallback(() => {
        const migrationInfo = data.syncInfo?.pendingAttributeMigration;
        if (!migrationInfo) return;

        let xpToRefund = 0;
        const attrCost = migrationInfo.oldAttributeFactor || 6;

        Object.values(data.attributes).forEach(cat => {
            cat.forEach(attr => {
                const currentVal = parseInt(attr.val1) || 0;
                const creationVal = attr.creationVal1 || 0;
                if (currentVal > creationVal) {
                    xpToRefund += (currentVal - creationVal) * attrCost;
                }
            });
        });

        if (data.secondaryAttributesActive) {
            Object.values(data.secondaryAttributes || {}).forEach(cat => {
                cat.forEach(attr => {
                    const currentVal = parseInt(attr.val1) || 0;
                    const creationVal = attr.creationVal1 || 0;
                    if (currentVal > creationVal) {
                        xpToRefund += (currentVal - creationVal) * attrCost;
                    }
                });
            });
        }

        setData((prev: CharacterSheetData) => {
            let newData = { ...prev };

            if (xpToRefund > 0) {
                const refundTx = {
                    id: generateId(),
                    timestamp: new Date().toISOString(),
                    type: 'refund' as const,
                    amount: xpToRefund,
                    description: "Remboursement suite à la mise à jour des règles d'attributs",
                    source: "migration"
                };
                newData.xpTransactions = [refundTx, ...(newData.xpTransactions || [])];
                newData.experience = { ...newData.experience, rest: (parseInt(newData.experience.rest || '0') + xpToRefund).toString() };
            }

            // Prepare migration state
            newData.syncInfo = { ...newData.syncInfo };
            delete newData.syncInfo.pendingAttributeMigration;
            newData.attributeMigrationMode = true;

            // Use the official reconciler to apply new structures and costs
            if (rules) {
                newData = reconcileRulesWithState(newData, rules);
            }

            // Force all attribute values to 0 as per requirement
            Object.values(newData.attributes || {}).forEach(cat => {
                cat.forEach(attr => {
                    attr.val1 = "0";
                    attr.creationVal1 = 0;
                });
            });

            if (newData.secondaryAttributesActive && newData.secondaryAttributes) {
                Object.values(newData.secondaryAttributes).forEach(cat => {
                    cat.forEach(attr => {
                        attr.val1 = "0";
                        attr.creationVal1 = 0;
                    });
                });
            }

            return newData;
        }, true);

        addLog("Mode de migration des attributs activé. Les attributs ont été réinitialisés et l'XP a été remboursée.", "info", "sheet");
    }, [data, setData, addLog, rules]);

    if (isRulesLoading) {
        return (
            <div className="fixed inset-0 bg-[#1c1c1c] text-white flex flex-col items-center justify-center z-50 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]">
                <div className="animate-spin text-[#bfae85] mb-4">
                    <Loader2 size={48} />
                </div>
                <div className="text-[#bfae85] font-serif italic text-lg animate-pulse">
                    Synchronisation de la campagne...
                </div>
            </div>
        );
    }

    if (!rules || !isSourceSelected) {
        return (
            <div className="fixed inset-0 bg-[#1c1c1c] text-white flex items-center justify-center z-50 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]">
                <Suspense fallback={<div className="text-white animate-pulse">Chargement des règles...</div>}>
                    <RulesSourceSelector
                        isOpen={true}
                        onSelectSource={handleSourceSelect}
                    />

                    {/* Render conflict modal here too because rules are still null during conflict resolution */}
                    <CampaignConflictModal
                        isOpen={showConflict}
                        onClose={() => setShowConflict(false)}
                        characterName={data.header?.name}
                        currentCampaignName={data.syncInfo?.settingName || 'Indépendante'}
                        newCampaignName={pendingRules?.name || ''}
                        onConfirmReset={handleConfirmReset}
                        onStay={() => setShowConflict(false)}
                        onBackup={handleConfirmBackup}
                    />
                </Suspense>
            </div>
        );
    }

    return (
        <NotificationProvider value={addLog}>
            <div className={`min-h-screen bg-[#1c1c1c] text-stone-200 font-sans flex flex-col selection:bg-red-900 selection:text-white ${isLandscape ? 'landscape-mode' : ''}`}>

                {/* Background Texture (Parchemin Global) */}
                <div className="fixed inset-0 pointer-events-none z-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>

                {/* NEW: Diegetic Navigation (Styled as Classic) */}
                <DiegeticNavigation
                    currentMode={mode}
                    onModeChange={handleSwitchMode}
                    onOpenImportExport={() => setShowImportExport(true)}
                    onPrintRequest={handlePrintRequest}
                    onToggleLandscape={() => setIsLandscape(!isLandscape)}
                    isLandscape={isLandscape}
                    onShowLogs={() => setShowLogs(!showLogs)}
                    showLogs={showLogs}
                    onShowUserGuide={() => setShowUserGuide(true)}
                    onShowChangelog={() => setShowChangelog(true)}
                    onOpenAppearance={() => setShowAppearance(true)}
                    onOpenSync={() => setShowSync(true)}
                    syncStatus={
                        isSyncing ? 'pending' :
                            (hasUpdate || !!pendingMjUpdate) ? 'update-available' :
                                data.syncInfo?.isDirty ? 'pending' :
                                    data.syncInfo?.syncId ? 'synced' : 'none'
                    }
                    appVersion={APP_VERSION}
                    onShowCampaignInfo={() => setShowCampaignInfo(true)}
                    autoSaveCountdown={countdown}
                    isMessagingOpen={isMessagingOpen}
                    onToggleMessaging={() => setIsMessagingOpen(!isMessagingOpen)}
                    unreadMessagesCount={unreadMessagesCount}
                    isEditMode={isEditMode}
                    onToggleEditMode={handleToggleEditMode}
                    isEditLayoutMode={editLayoutMode}
                    onToggleEditLayoutMode={() => setEditLayoutMode(!editLayoutMode)}
                    onResetLayout={handleResetLayout}
                    onAutoFitLayout={handleAutoFitLayout}
                />

                {/* Bandeau interactif : Proposition de Récréation MJ */}
                {pendingMjUpdate && (
                    <div className="sticky top-14 z-50 no-print animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className="mx-auto max-w-4xl px-4 pt-2">
                            <div className="flex items-center gap-3 bg-[#2a1f0e] border border-amber-700/60 rounded-md px-4 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.5)] backdrop-blur-sm">
                                <div className="shrink-0 w-8 h-8 rounded-full bg-amber-900/40 border border-amber-700/50 flex items-center justify-center">
                                    <Sparkles size={16} className="text-amber-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mb-0.5">Message du Maître de Jeu</p>
                                    <p className="text-sm text-amber-100/90 leading-snug truncate">{pendingMjUpdate.message}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => {
                                            importData(pendingMjUpdate.data);
                                            setPendingMjUpdate(null);
                                            handleSwitchMode('sheet');
                                            addLog(`✨ Récréation appliquée : ${pendingMjUpdate.message}`, 'success', 'sheet');
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-xs font-bold rounded transition-colors active:scale-95"
                                    >
                                        <Check size={13} />
                                        Appliquer
                                    </button>
                                    <button
                                        onClick={() => setPendingMjUpdate(null)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-700/60 hover:bg-stone-600/60 text-stone-300 text-xs font-bold rounded transition-colors active:scale-95"
                                        title="Vous pourrez appliquer cette mise à jour plus tard via le menu Sync"
                                    >
                                        <X size={13} />
                                        Plus tard
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bandeau de migration d'attributs */}
                {data.syncInfo?.pendingAttributeMigration && !data.attributeMigrationMode && (
                    <div className="sticky top-14 z-50 no-print animate-in slide-in-from-top-2 fade-in duration-300">
                        <div className="mx-auto max-w-4xl px-4 pt-2">
                            <div className="flex items-center gap-3 bg-blue-900/80 border border-blue-500/60 rounded-md px-4 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.5)] backdrop-blur-sm">
                                <div className="shrink-0 w-8 h-8 rounded-full bg-blue-800/40 border border-blue-400/50 flex items-center justify-center">
                                    <Check size={16} className="text-blue-300" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300 mb-0.5">Mise à jour des règles</p>
                                    <p className="text-sm text-blue-100/90 leading-snug">Le MJ a modifié la structure des attributs. Une migration est nécessaire.</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={handleStartAttributeMigration}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded transition-colors active:scale-95"
                                    >
                                        Démarrer la migration
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="relative z-10 flex flex-col min-h-screen">

                    {/* Logs Panel */}
                    <aside
                        className={`fixed right-0 top-14 bottom-0 w-80 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 z-[60] flex flex-col no-print ${showLogs ? 'translate-x-0' : 'translate-x-full'}`}
                        aria-label="Historique des actions"
                    >
                        <div className="bg-gray-100 border-b border-gray-200">
                            <div className="p-3 flex justify-between items-center">
                                <h4 className="font-bold text-sm text-gray-700 flex items-center gap-2"><Clock size={16} /> Historique</h4>
                                <div className="flex items-center gap-1">
                                    {filteredLogs.length > 0 && (<button onClick={clearCurrentLogs} className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded p-1 transition-colors" title="Vider la liste actuelle"><Trash2 size={16} /></button>)}
                                    <button onClick={() => setShowLogs(false)} className="text-gray-500 hover:bg-gray-200 rounded p-1"><X size={16} /></button>
                                </div>
                            </div>
                            <div className="flex text-sm font-medium border-t border-gray-200">
                                <button onClick={() => setHistoryTab('sheet')} className={`flex-1 py-2 text-center transition-colors border-b-2 ${historyTab === 'sheet' ? 'border-blue-500 text-blue-700 bg-white' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>Fiche</button>
                                <button onClick={() => setHistoryTab('settings')} className={`flex-1 py-2 text-center transition-colors border-b-2 ${historyTab === 'settings' ? 'border-blue-500 text-blue-700 bg-white' : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}>Configuration</button>
                            </div>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-gray-50">
                            {filteredLogs.length === 0 && (<div className="text-center text-gray-400 text-xs italic mt-4 flex flex-col items-center gap-2"><Clock size={24} className="opacity-20" /><p>Aucune action enregistrée pour {historyTab === 'sheet' ? 'la fiche' : 'la configuration'}</p></div>)}
                            {filteredLogs.map((log) => (
                                <div key={log.id} className={`p-2 rounded border text-xs shadow-sm flex flex-col gap-1 animate-in slide-in-from-right-2 fade-in duration-300 ${log.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : log.type === 'danger' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-white border-gray-200 text-gray-700'}`}>
                                    <div className="flex justify-between items-center opacity-70 border-b border-black/5 pb-1 mb-1"><span className="font-mono text-[10px]">{log.timestamp}</span></div>
                                    <p>{log.message}</p>
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className={`mt-4 flex flex-col items-center gap-4 w-full main-content-area ${data.creationConfig?.active ? 'pb-40' : ''}`}>
                        <Suspense fallback={<div className="p-8 text-center text-stone-400">Chargement...</div>}>
                            {mode === 'sheet' ? (
                                <>
                                    {/* Sub Navigation for Sheets */}
                                    <nav
                                        className="sticky top-14 z-40 mb-2 no-print w-full flex justify-center pointer-events-none"
                                        aria-label="Navigation des onglets de personnage"
                                    >
                                        <div className="pointer-events-auto flex gap-4 bg-white/95 backdrop-blur-md p-2 rounded-full shadow-2xl border border-gray-200 flex-wrap justify-center items-center">
                                            {/* Primary Tabs */}
                                            <div className="flex gap-2">
                                                <button onClick={() => setSheetTab('p1')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition ${sheetTab === 'p1' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><Layers size={16} /> Personnage</button>
                                                <button
                                                    onClick={() => setSheetTab('p2')}
                                                    className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition
                                                        ${sheetTab === 'p2'
                                                            ? 'bg-blue-600 text-white shadow-md'
                                                            : shouldHighlightMystic
                                                                ? 'bg-amber-100/30 text-amber-600 border border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.2)] animate-pulse'
                                                                : 'text-gray-600 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <FileType size={16} />
                                                    Détails
                                                </button>
                                                <button onClick={() => setSheetTab('inventaire')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition ${sheetTab === 'inventaire' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><Package size={16} /> Inventaire</button>
                                                <button onClick={() => setSheetTab('specs')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition ${sheetTab === 'specs' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><List size={16} /> Spécialisations</button>
                                                <button onClick={() => setSheetTab('xp')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition ${sheetTab === 'xp' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><TrendingUp size={16} /> Gestion XP</button>
                                                <button onClick={() => setSheetTab('notes')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition ${sheetTab === 'notes' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><Book size={16} /> Journal</button>
                                            </div>
                                        </div>
                                    </nav>



                                    <div className={`w-full flex px-2 md:px-0 pb-8 ${sheetTab === 'notes' ? 'overflow-visible' : sheetTab === 'prototype' ? 'overflow-hidden' : 'overflow-x-auto'}`}>
                                        <div className={`${sheetTab === 'p1' ? 'block' : 'hidden'} mx-auto`}><CharacterSheet isLandscape={isLandscape} onToggleEditMode={handleToggleEditMode} onToggleCreationMode={handleToggleCreationMode} /></div>
                                        <div className={`${sheetTab === 'specs' ? 'block' : 'hidden'} mx-auto`}><CharacterSheetSpecializations isLandscape={isLandscape} /></div>
                                        <div className={`${sheetTab === 'p2' ? 'block' : 'hidden'} mx-auto`}><CharacterSheetPage2 isLandscape={isLandscape} /></div>
                                        <div className={`${sheetTab === 'inventaire' ? 'block' : 'hidden'} mx-auto`}><CharacterSheetInventaire isLandscape={isLandscape} /></div>
                                        <div className={`${sheetTab === 'xp' ? 'block' : 'hidden'} mx-auto`}><CharacterSheetXP isLandscape={isLandscape} /></div>
                                        <div className={`${sheetTab === 'notes' ? 'block' : 'hidden'} mx-auto`}><CampaignNotes /></div>
                                    </div>

                                    <PostItBoard currentTab={sheetTab} />

                                    {/* MessageWidget : visible uniquement en mode Online (campagne synchronisée) */}
                                    {isOnlineMode && data.syncInfo?.syncId && rules?.settingId && (
                                        <MessagingWidgetPlayer
                                            settingId={rules.settingId}
                                            viewerId={data.syncInfo.syncId}
                                            viewerName={data.header?.name || data.header?.player || 'Joueur'}
                                            isOpen={isMessagingOpen}
                                            onToggle={setIsMessagingOpen}
                                        />
                                    )}
                                </>
                            ) : (
                                <SettingsView
                                    onClose={() => handleSwitchMode('sheet')}
                                />
                            )}
                        </Suspense>
                    </main>

                    <div id="printable-area" className="hidden">
                        {pagesToPrint.p1 && (<div className="print-sheet-wrapper"><CharacterSheet isLandscape={isLandscape} /></div>)}
                        {pagesToPrint.specs && (<div className="print-sheet-wrapper"><CharacterSheetSpecializations isLandscape={isLandscape} /></div>)}
                        {pagesToPrint.p2 && (<div className="print-sheet-wrapper"><CharacterSheetPage2 isLandscape={isLandscape} /></div>)}
                        {pagesToPrint.inventaire && (<div className="print-sheet-wrapper"><CharacterSheetInventaire isLandscape={isLandscape} /></div>)}
                        {pagesToPrint.xp && (<div className="print-sheet-wrapper"><CharacterSheetXP isLandscape={isLandscape} /></div>)}
                        {pagesToPrint.notes && (<div className="print-sheet-wrapper"><CampaignNotes /></div>)}
                    </div>

                    <LayoutModals
                        data={data}
                        rules={rules}
                        setData={setData}
                        addLog={addLog}
                        mode={mode}
                        showImportExport={showImportExport}
                        setShowImportExport={setShowImportExport}
                        showPrintModal={showPrintModal}
                        setShowPrintModal={setShowPrintModal}
                        pagesToPrint={pagesToPrint}
                        handlePrintConfirm={(selection: PrintSelection) => handlePrintConfirm(selection)}
                        showChangelog={showChangelog}
                        setShowChangelog={setShowChangelog}
                        showUserGuide={showUserGuide}
                        setShowUserGuide={setShowUserGuide}
                        showAppearance={showAppearance}
                        setShowAppearance={setShowAppearance}
                        showSync={showSync}
                        setShowSync={setShowSync}
                        showCampaignInfo={showCampaignInfo}
                        setShowCampaignInfo={setShowCampaignInfo}
                        showConflict={showConflict}
                        setShowConflict={setShowConflict}
                        pendingRules={pendingRules}
                        handleConfirmReset={handleConfirmReset}
                        handleConfirmBackup={handleConfirmBackup}
                        showDiscardConfirm={showDiscardConfirm}
                        setShowDiscardConfirm={setShowDiscardConfirm}
                        confirmDiscard={confirmDiscard}
                        showEditWarning={showEditWarning}
                        setShowEditWarning={setShowEditWarning}
                        executeEditModeActivation={executeEditModeActivation}
                        showCreationWarning={showCreationWarning}
                        setShowCreationWarning={setShowCreationWarning}
                        executeCreationActivation={executeCreationActivation}
                        isEditMode={isEditMode}
                        setIsEditMode={setIsEditMode}
                        handleImportSuccess={handleImportSuccess}
                    />

                    {(data.creationConfig?.active || data.attributeMigrationMode) && (<CreationHUD />)}
                    <SafetyAlert />

                    <SyncConflictModal
                        isOpen={!!conflictData}
                        localData={data}
                        remoteData={conflictData as CharacterSheetData}
                        onResolve={handleResolveConflict}
                        onCancel={() => setConflictData(null)}
                    />
                </div>
            </div>
        </NotificationProvider>
    );
};

export default MainLayout;

