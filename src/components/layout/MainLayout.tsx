
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useCharacter } from '../../context/CharacterContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { CharacterSheetData } from '../../types';
import { APP_VERSION } from '../../constants/app';
import { migrateData } from '../../utils/migrations';
import { useRules } from '../../context/RulesContext';
import { loadRules } from '../../services/RulesLoader';
import { RulesData } from '../../types/rules';
import { CampaignService } from '../../services/CampaignService';
import { ErrorService } from '../../services/ErrorService';
import { INITIAL_DATA } from '../../data/initialState';
import { logger } from '../../utils/logger';
import { useCloudSyncCheck } from '../../hooks/useCloudSyncCheck';

// Static Components
import DiegeticNavigation from './DiegeticNavigation';
import CharacterSheet from '../CharacterSheet';
import CharacterSheetPage2 from '../CharacterSheetPage2';
import CharacterSheetSpecializations from '../CharacterSheetSpecializations';
import CharacterSheetXP from '../CharacterSheetXP';

// Lazy Loaded Components
const SettingsView = lazy(() => import('../SettingsView'));
const CampaignNotes = lazy(() => import('../CampaignNotes'));
const ImportExportModal = lazy(() => import('../ImportExportModal'));
const PrintSelectionModal = lazy(() => import('../PrintSelectionModal'));
const ChangelogModal = lazy(() => import('../ChangelogModal'));
const UserGuideModal = lazy(() => import('../UserGuideModal'));
const CreationHUD = lazy(() => import('../CreationHUD'));
const UpdateNotifier = lazy(() => import('../UpdateNotifier'));
const AppearanceModal = lazy(() => import('../AppearanceModal'));
const RulesSourceSelector = lazy(() => import('../RulesSourceSelector'));
const SyncModal = lazy(() => import('../SyncModal'));
const CampaignConflictModal = lazy(() => import('../ui/CampaignConflictModal'));
const CampaignInfoModal = lazy(() => import('../ui/CampaignInfoModal'));
import ConfirmationModal from '../ui/ConfirmationModal';

import { exportCharacterAsJSON } from '../../utils/importExportUtils';
import { useNavigationState } from '../../hooks/layout/useNavigationState';
import { usePrintManager } from '../../hooks/layout/usePrintManager';
import { useRulesSync } from '../../hooks/layout/useRulesSync';

// Icons
import { Settings, Printer, FileText, Layers, FileType, AlertTriangle, List, TrendingUp, History, Clock, X, Trash2, Save, Book, LogOut, Menu, Upload } from 'lucide-react';

const MainLayout: React.FC = () => {
    const { data, updateData: setData, addLog, importData, isSyncing } = useCharacter();
    const { rules, updateRules } = useRules();

    // Custom Hooks
    const [isLandscape, setIsLandscape] = useState(false);
    const {
        mode, setMode,
        sheetTab, setSheetTab,
        showDiscardConfirm, setShowDiscardConfirm,
        isSettingsDirty, setIsSettingsDirty,
        handleSwitchMode,
        confirmDiscard
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

    // Other UI States
    const [lastSavedState, setLastSavedState] = useState<string>("");
    const [showImportExport, setShowImportExport] = useState(false);
    const [showChangelog, setShowChangelog] = useState(false);
    const [showUserGuide, setShowUserGuide] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const [historyTab, setHistoryTab] = useState<'sheet' | 'settings'>('sheet');
    const [showAppearance, setShowAppearance] = useState(false);
    const [showSync, setShowSync] = useState(false);
    const [showCampaignInfo, setShowCampaignInfo] = useState(false);

    // Initialize Reference State & Error Service
    useEffect(() => {
        if (data) setLastSavedState(JSON.stringify(data));
        ErrorService.init(addLog);

        // Show welcome message if available and not shown in this session
        if (rules?.showMetadataToPlayers && rules?.welcomeMessage) {
            const hasShownWelcome = sessionStorage.getItem(`welcome-shown-${rules.settingId}`);
            if (!hasShownWelcome) {
                setShowCampaignInfo(true);
                sessionStorage.setItem(`welcome-shown-${rules.settingId}`, 'true');
            }
        }
    }, []);

    // Logging helpers
    const clearCurrentLogs = () => {
        setData((prev: CharacterSheetData) => ({
            ...prev,
            appLogs: prev.appLogs.filter((log: any) => log.category !== historyTab)
        }));
    };

    const filteredLogs = (data.appLogs || []).filter((log: any) => {
        if (log.category === 'both') return true;
        return log.category === historyTab;
    });

    const handlePrintRequest = () => setShowPrintModal(true);

    const handleImportSuccess = async (newData: CharacterSheetData) => {
        setIsSourceSelected(true);
        sessionStorage.setItem('rpg-source-selected', 'true');
        importData(newData);
        const migrated = migrateData(newData);

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

        setMode('sheet');
        setIsSettingsDirty(false);
        setLastSavedState(JSON.stringify(newData));
    };

    useEffect(() => {
        if (hasUpdate) {
            addLog("Mise à jour disponible sur le Cloud (Note du MJ possible). Cliquez sur 'Sync' pour voir.", "success");
            // Debug log to console if in dev
            if (import.meta.env.DEV) {
                logger.log("[Sync] Update detected:", { hasUpdate, mjMessage });
            }
        }
    }, [hasUpdate, mjMessage, addLog]);

    const handleConfirmBackup = async () => {
        await exportCharacterAsJSON(data, addLog);
    };



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
            <div className={`min-h-screen bg-[#1c1c1c] text-stone-200 font-sans selection:bg-red-900 selection:text-white ${isLandscape ? 'landscape-mode' : ''}`}>
                <Suspense fallback={null}>
                    <UpdateNotifier />
                </Suspense>

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
                            hasUpdate ? 'update-available' :
                                data.syncInfo ? 'synced' : 'none'
                    }
                    appVersion={APP_VERSION}
                    onShowCampaignInfo={() => setShowCampaignInfo(true)}
                />

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
                                        <div className="pointer-events-auto flex gap-4 bg-white/90 backdrop-blur p-1.5 rounded-full shadow-lg border border-gray-200 flex-wrap justify-center">
                                            <button onClick={() => setSheetTab('p1')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${sheetTab === 'p1' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><Layers size={16} /> Personnage</button>
                                            <button onClick={() => setSheetTab('specs')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${sheetTab === 'specs' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><List size={16} /> Spécialisations</button>
                                            <button onClick={() => setSheetTab('p2')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${sheetTab === 'p2' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><FileType size={16} /> Détails & Equipement</button>
                                            <button onClick={() => setSheetTab('xp')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${sheetTab === 'xp' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><TrendingUp size={16} /> Gestion XP</button>
                                            <button onClick={() => setSheetTab('notes')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${sheetTab === 'notes' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><Book size={16} /> Notes de Campagne</button>
                                        </div>
                                    </nav>



                                    <div className={`w-full flex px-2 md:px-0 pb-8 ${sheetTab === 'notes' ? 'overflow-visible' : sheetTab === 'prototype' ? 'overflow-hidden' : 'overflow-x-auto'}`}>
                                        <div className={`${sheetTab === 'p1' ? 'block' : 'hidden'} mx-auto`}><CharacterSheet isLandscape={isLandscape} /></div>
                                        <div className={`${sheetTab === 'specs' ? 'block' : 'hidden'} mx-auto`}><CharacterSheetSpecializations isLandscape={isLandscape} /></div>
                                        <div className={`${sheetTab === 'p2' ? 'block' : 'hidden'} mx-auto`}><CharacterSheetPage2 isLandscape={isLandscape} /></div>
                                        <div className={`${sheetTab === 'xp' ? 'block' : 'hidden'} mx-auto`}><CharacterSheetXP isLandscape={isLandscape} /></div>
                                        {sheetTab === 'notes' && (
                                            <div className="mx-auto block"><CampaignNotes /></div>
                                        )}
                                    </div>

                                    {data.creationConfig?.active && (<CreationHUD />)}
                                </>
                            ) : (
                                <SettingsView
                                    onClose={() => handleSwitchMode('sheet')}
                                    onDirtyChange={setIsSettingsDirty}
                                />
                            )}
                        </Suspense>
                    </main>

                    <div id="printable-area" className="hidden">
                        {pagesToPrint.p1 && (<div className="print-sheet-wrapper"><CharacterSheet isLandscape={isLandscape} /></div>)}
                        {pagesToPrint.specs && (<div className="print-sheet-wrapper"><CharacterSheetSpecializations isLandscape={isLandscape} /></div>)}
                        {pagesToPrint.p2 && (<div className="print-sheet-wrapper"><CharacterSheetPage2 isLandscape={isLandscape} /></div>)}
                        {pagesToPrint.xp && (<div className="print-sheet-wrapper"><CharacterSheetXP isLandscape={isLandscape} /></div>)}
                        {pagesToPrint.notes && (<div className="print-sheet-wrapper"><CampaignNotes /></div>)}
                    </div>

                    <Suspense fallback={null}>
                        <ImportExportModal
                            isOpen={showImportExport}
                            onClose={() => setShowImportExport(false)}
                            onImportSuccess={handleImportSuccess}
                            onExportSuccess={() => { setLastSavedState(JSON.stringify(data)); }}
                            variant={mode === 'settings' ? 'gm' : 'player'}
                        />
                        <PrintSelectionModal isOpen={showPrintModal} onClose={() => setShowPrintModal(false)} onConfirm={(s: Record<string, boolean>) => handlePrintConfirm(s as any)} />

                        <ChangelogModal isOpen={showChangelog} onClose={() => setShowChangelog(false)} />
                        <UserGuideModal isOpen={showUserGuide} onClose={() => setShowUserGuide(false)} />
                        <AppearanceModal
                            isOpen={showAppearance}
                            onClose={() => setShowAppearance(false)}
                            data={data}
                            rules={rules}
                            onUpdate={(newData) => setData(newData)}
                        />
                        <SyncModal
                            isOpen={showSync}
                            onClose={() => setShowSync(false)}
                            characterData={data}
                            onSyncComplete={(syncInfo: any) => {
                                setData((prev: CharacterSheetData) => ({ ...prev, syncInfo }));
                                addLog(`Fiche synchronisée avec ${syncInfo?.settingName}`, 'success', 'sheet');
                            }}
                        />

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

                        <CampaignInfoModal
                            isOpen={showCampaignInfo}
                            onClose={() => setShowCampaignInfo(false)}
                            campaignName={rules?.settingName || 'Ma Campagne'}
                            description={rules?.description}
                            welcomeMessage={rules?.welcomeMessage}
                        />

                        <ConfirmationModal
                            isOpen={showDiscardConfirm}
                            onClose={() => setShowDiscardConfirm(false)}
                            onConfirm={confirmDiscard}
                            title="Abandonner les modifications ?"
                            message="Vous avez des modifications non enregistrées. Voulez-vous vraiment quitter sans sauvegarder ?"
                            confirmLabel="Quitter sans sauvegarder"
                            cancelLabel="Rester ici"
                            type="warning"
                        />
                    </Suspense>
                </div>
            </div>
        </NotificationProvider>
    );
};

export default MainLayout;
