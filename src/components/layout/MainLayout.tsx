
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useCharacter } from '../../context/CharacterContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { CharacterSheetData } from '../../types';
import { APP_VERSION } from '../../constants';
import { migrateData } from '../../utils/migrations';
import { useRules } from '../../context/RulesContext';
import { loadRules } from '../../services/RulesLoader';
import { RulesData } from '../../types/rules';
import { PlayerService } from '../../services/PlayerService';
import { ErrorService } from '../../services/ErrorService';
import { INITIAL_DATA } from '../../data/initialState';

// Static Components
import DiegeticNavigation from './DiegeticNavigation';
import CharacterSheet from '../CharacterSheet';
import CharacterSheetPage2 from '../CharacterSheetPage2';
import CharacterSheetSpecializations from '../CharacterSheetSpecializations';
import CharacterSheetXP from '../CharacterSheetXP';
import CampaignNotes from '../CampaignNotes';

// Lazy Loaded Components
const SettingsView = lazy(() => import('../SettingsView'));
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

import { exportCharacterAsJSON } from '../../utils/importExportUtils';

// Icons
import { Settings, Printer, FileText, Layers, FileType, AlertTriangle, List, TrendingUp, History, Clock, X, Trash2, Save, Book, LogOut, Menu, Upload } from 'lucide-react';

const MainLayout: React.FC = () => {
    // Consume Context
    const { data, updateData: setData, addLog, importData } = useCharacter();
    const { rules, updateRules } = useRules();

    // UI State
    const [lastSavedState, setLastSavedState] = useState<string>("");
    const [mode, setMode] = useState<'sheet' | 'settings'>('sheet');

    const [pendingMode, setPendingMode] = useState<'sheet' | 'settings' | null>(null);
    const [sheetTab, setSheetTab] = useState<'p1' | 'specs' | 'p2' | 'xp' | 'notes'>('p1');
    const [isLandscape, setIsLandscape] = useState(false);
    const [isSettingsDirty, setIsSettingsDirty] = useState(false);
    const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
    const [showImportExport, setShowImportExport] = useState(false);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [pagesToPrint, setPagesToPrint] = useState({ p1: true, specs: false, p2: true, xp: false, notes: false });
    const [showChangelog, setShowChangelog] = useState(false);
    const [showUserGuide, setShowUserGuide] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const [historyTab, setHistoryTab] = useState<'sheet' | 'settings'>('sheet');

    const [showAppearance, setShowAppearance] = useState(false);
    const [showSync, setShowSync] = useState(false);

    // Navigation state: has the user selected a source (Resume/Online/Offline) in this session?
    const [isSourceSelected, setIsSourceSelected] = useState<boolean>(() => {
        return sessionStorage.getItem('rpg-source-selected') === 'true';
    });

    // Conflict handling
    const [showConflict, setShowConflict] = useState(false);
    const [pendingRules, setPendingRules] = useState<{ rules: RulesData, id: string, name: string } | null>(null);

    // Initialize Reference State for Unsaved Indicator & Error Service
    useEffect(() => {
        if (data) {
            setLastSavedState(JSON.stringify(data));
        }
        // Initialize Centralized Error Service
        ErrorService.init(addLog);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount (or when data is first available?) 
    // Actually in App.tsx it was [], assuming data is ready. context data is ready.

    // Logging helpers
    const clearCurrentLogs = () => {
        setData(prev => ({
            ...prev,
            appLogs: prev.appLogs.filter(log => log.category !== historyTab)
        }));
    };

    const filteredLogs = (data.appLogs || []).filter(log => {
        if (log.category === 'both') return true;
        return log.category === historyTab;
    });

    // Handlers
    const handlePrintRequest = () => setShowPrintModal(true);

    const handlePrintConfirm = (selection: { p1: boolean, specs: boolean, p2: boolean, xp: boolean, notes: boolean }) => {
        setPagesToPrint(selection);
        setShowPrintModal(false);

        setTimeout(() => {
            if (isLandscape) {
                const style = document.createElement('style');
                style.innerHTML = `@page { size: landscape; margin: 0; }`;
                style.id = 'print-landscape-style';
                document.head.appendChild(style);
            } else {
                const style = document.createElement('style');
                style.innerHTML = `@page { size: A4 portrait; margin: 0; }`;
                style.id = 'print-portrait-style';
                document.head.appendChild(style);
            }
            window.print();
            document.getElementById('print-landscape-style')?.remove();
            document.getElementById('print-portrait-style')?.remove();
        }, 500);
    };

    const handleSwitchMode = (targetMode: 'sheet' | 'settings') => {
        if (mode === targetMode) return;
        if (mode === 'settings' && isSettingsDirty) {
            setPendingMode(targetMode);
            setShowDiscardConfirm(true);
        } else {
            setMode(targetMode);
        }
    };

    const confirmDiscard = () => {
        setIsSettingsDirty(false);
        setShowDiscardConfirm(false);
        if (pendingMode) {
            setMode(pendingMode);
            setPendingMode(null);
        } else {
            setMode('sheet');
        }
    };


    const handleValidateCreation = () => {
        // Cette fonction est maintenant gérer en interne par CreationHUD via le Context
        // Mais gardée si besoin de logique Layout spécifique (ex: scroll top)
        // Pour l'instant on peut la supprimer ou la laisser vide si non utilisée
    };

    const handleSourceSelect = async (sourceType: 'online' | 'offline', selectedRules?: RulesData, settingId?: string, settingName?: string) => {
        // Mark source as selected for this session
        setIsSourceSelected(true);
        sessionStorage.setItem('rpg-source-selected', 'true');

        if (sourceType === 'online' && selectedRules && settingId) {
            // Check for conflict
            const hasCharacter = data.header?.name?.trim() !== '';
            const isDifferentCampaign = data.syncInfo?.settingId !== settingId;

            if (hasCharacter && isDifferentCampaign) {
                setPendingRules({ rules: selectedRules, id: settingId, name: settingName || 'Nouvelle Campagne' });
                setShowConflict(true);
            } else {
                // No conflict, just update
                updateRules({
                    ...selectedRules,
                    // @ts-ignore - inject metadata if missing
                    settingId,
                    settingName: settingName || (selectedRules as any).settingName
                });
            }
        } else {
            // Offline Mode: Load from file (traditional way)
            const fallback = await loadRules();
            if (fallback) {
                updateRules(fallback);
            } else {
                alert("Impossible de charger les règles locales.");
            }
        }
    };

    const handleImportSuccess = async (newData: CharacterSheetData) => {
        // Mark source as selected as well when importing
        setIsSourceSelected(true);
        sessionStorage.setItem('rpg-source-selected', 'true');

        // Use the centralized importData which ensures migration + validation + reconciliation
        importData(newData);

        // We still need to migrate locally to check for rules sync info
        const migrated = migrateData(newData);

        // -- Rules Synchronization --
        // If the imported character has sync info, we should try to load the corresponding rules
        // to switch the app to "Online Mode" for that campaign.
        if (migrated.syncInfo?.settingId) {
            const currentSettingId = (rules as any)?.settingId;

            if (migrated.syncInfo.settingId !== currentSettingId) {
                console.log(`[MainLayout] New character campaign detected: ${migrated.syncInfo.settingId}. Attempting to sync rules...`);
                try {
                    const newRules = await PlayerService.loadSetting(migrated.syncInfo.settingId);
                    if (newRules) {
                        updateRules({
                            ...newRules,
                            // @ts-ignore
                            settingId: migrated.syncInfo.settingId,
                            settingName: migrated.syncInfo.settingName
                        });
                        addLog(`Règles de la campagne "${migrated.syncInfo.settingName}" chargées automatiquement.`, 'success', 'settings');
                    }
                } catch (e) {
                    ErrorService.handleError(e, { context: 'MainLayout.handleImportSuccess', userMessage: "Echec de la synchro des règles." });
                }
            } else {
                // If the setting is the same, we might still want to refresh rules 
                // just in case MJ updated them since we last loaded.
                // But the user said "works after refresh", so forcing a load here might help.
                try {
                    const freshRules = await PlayerService.loadSetting(migrated.syncInfo.settingId);
                    if (freshRules) {
                        updateRules({
                            ...freshRules,
                            // @ts-ignore
                            settingId: migrated.syncInfo.settingId,
                            settingName: migrated.syncInfo.settingName
                        });
                    }
                } catch (e) {
                    console.warn("[MainLayout] Optional rules refresh failed", e); // Keep warn or use ErrorService with silent
                    ErrorService.handleError(e, { context: 'MainLayout.handleImportSuccess.Refresh', silent: true });
                }
            }
        }

        setMode('sheet');
        setIsSettingsDirty(false);
        setLastSavedState(JSON.stringify(newData));
    };

    // 4. Synchronization Rules <-> Character (Restore Rules on Refresh)
    useEffect(() => {
        if (!data || !data.syncInfo?.settingId || !rules) return;

        const syncInfo = data.syncInfo;
        if (!syncInfo.settingId) return;

        // If we have a character linked to a campaign, but the current rules are NOT that campaign
        // (e.g. we refreshed and RulesContext loaded defaults because URL param is missing)
        if ((rules as any).settingId !== syncInfo.settingId) {
            console.log(`[MainLayout] Rules Mismatch Detected. Current: ${(rules as any).settingId}, Expected: ${syncInfo.settingId}. Restoring...`);

            PlayerService.loadSetting(syncInfo.settingId).then(restoredRules => {
                if (restoredRules) {
                    updateRules({
                        ...restoredRules,
                        // @ts-ignore
                        settingId: syncInfo.settingId,
                        settingName: syncInfo.settingName
                    });
                    addLog(`Règles de la campagne "${syncInfo.settingName}" restaurées.`, 'info', 'settings');
                }
            }).catch(err => {
                console.error("[MainLayout] Failed to restore rules", err);
            });
        }
    }, [data.syncInfo?.settingId, (rules as any)?.settingId]); // Dependency checks

    const handleConfirmReset = () => {
        if (!pendingRules) return;

        // 1. Wipe data to INITIAL_DATA
        setData(JSON.parse(JSON.stringify(INITIAL_DATA)));

        // 2. Apply rules
        updateRules({
            ...pendingRules.rules,
            // @ts-ignore
            settingId: pendingRules.id,
            settingName: pendingRules.name
        });

        setShowConflict(false);
        setPendingRules(null);
        addLog(`Nouvelle campagne chargée : ${pendingRules.name}. Fiche réinitialisée.`, 'info', 'settings');
    };

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
                    syncStatus={data.syncInfo ? 'synced' : 'none'}
                    appVersion={APP_VERSION}
                />

                <div className="relative z-10 flex flex-col min-h-screen">

                    {/* Logs Panel */}
                    <div className={`fixed right-0 top-14 bottom-0 w-80 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 z-[60] flex flex-col no-print ${showLogs ? 'translate-x-0' : 'translate-x-full'}`}>
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
                    </div>

                    {/* Main Content */}
                    <main className={`mt-4 flex flex-col items-center gap-4 w-full main-content-area ${data.creationConfig?.active ? 'pb-40' : ''}`}>
                        <Suspense fallback={<div className="p-8 text-center text-stone-400">Chargement...</div>}>
                            {mode === 'sheet' ? (
                                <>
                                    {/* Sub Navigation for Sheets */}
                                    <div className="sticky top-14 z-40 mb-2 no-print w-full flex justify-center pointer-events-none">
                                        <div className="pointer-events-auto flex gap-4 bg-white/90 backdrop-blur p-1.5 rounded-full shadow-lg border border-gray-200 flex-wrap justify-center">
                                            <button onClick={() => setSheetTab('p1')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${sheetTab === 'p1' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><Layers size={16} /> Personnage</button>
                                            <button onClick={() => setSheetTab('specs')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${sheetTab === 'specs' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><List size={16} /> Spécialisations</button>
                                            <button onClick={() => setSheetTab('p2')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${sheetTab === 'p2' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><FileType size={16} /> Détails & Equipement</button>
                                            <button onClick={() => setSheetTab('xp')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${sheetTab === 'xp' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><TrendingUp size={16} /> Gestion XP</button>
                                            <button onClick={() => setSheetTab('notes')} className={`px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transition-all ${sheetTab === 'notes' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}><Book size={16} /> Notes de Campagne</button>
                                        </div>
                                    </div>

                                    <div className="w-full overflow-x-auto flex px-2 md:px-0 pb-8">
                                        <div className={`${sheetTab === 'p1' ? 'block' : 'hidden'} mx-auto`}><CharacterSheet isLandscape={isLandscape} /></div>
                                        <div className={`${sheetTab === 'specs' ? 'block' : 'hidden'} mx-auto`}><CharacterSheetSpecializations isLandscape={isLandscape} /></div>
                                        <div className={`${sheetTab === 'p2' ? 'block' : 'hidden'} mx-auto`}><CharacterSheetPage2 isLandscape={isLandscape} /></div>
                                        <div className={`${sheetTab === 'xp' ? 'block' : 'hidden'} mx-auto`}><CharacterSheetXP isLandscape={isLandscape} /></div>
                                        <div className={`${sheetTab === 'notes' ? 'block' : 'hidden'} mx-auto`}><CampaignNotes isLandscape={isLandscape} /></div>
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
                        {pagesToPrint.notes && (<div className="print-sheet-wrapper"><CampaignNotes isLandscape={isLandscape} /></div>)}
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
                            onUpdate={(newData) => setData(newData)}
                        />
                        <SyncModal
                            isOpen={showSync}
                            onClose={() => setShowSync(false)}
                            characterData={data}
                            onSyncComplete={(syncInfo) => {
                                setData(prev => ({ ...prev, syncInfo }));
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
                    </Suspense>
                </div>
            </div>
        </NotificationProvider>
    );
};

export default MainLayout;
