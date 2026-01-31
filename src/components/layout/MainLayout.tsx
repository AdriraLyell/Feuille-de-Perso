import React, { useState, useEffect } from 'react';
import { useNotification } from '../../context/NotificationContext';
import { useCharacter } from '../../context/CharacterContext';
import { NotificationProvider } from '../../context/NotificationContext';
import { CharacterSheetData } from '../../types';
import { APP_VERSION } from '../../constants';
import { migrateData } from '../../utils/migrations';

// Components
import CharacterSheet from '../CharacterSheet';
import CharacterSheetPage2 from '../CharacterSheetPage2';
import CharacterSheetSpecializations from '../CharacterSheetSpecializations';
import CharacterSheetXP from '../CharacterSheetXP';
import CampaignNotes from '../CampaignNotes';
import SettingsView from '../SettingsView';
import ImportExportModal from '../ImportExportModal';
import PrintSelectionModal from '../PrintSelectionModal';
import ChangelogModal from '../ChangelogModal';
import UserGuideModal from '../UserGuideModal';
import CreationHUD from '../CreationHUD';
import LibraryView from '../LibraryView';
import UpdateNotifier from '../UpdateNotifier';
import DiegeticNavigation from './DiegeticNavigation';

// Icons
import { Settings, Printer, FileText, Layers, FileType, AlertTriangle, List, TrendingUp, History, Clock, X, Trash2, Save, Book, LogOut, Menu, Upload } from 'lucide-react';

const MainLayout: React.FC = () => {
    // Consume Context
    const { data, updateData: setData, addLog } = useCharacter();

    // UI State
    const [lastSavedState, setLastSavedState] = useState<string>("");
    const [mode, setMode] = useState<'sheet' | 'settings' | 'library'>('sheet');
    const [pendingMode, setPendingMode] = useState<'sheet' | 'settings' | 'library' | null>(null);
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

    // Initialize Reference State for Unsaved Indicator
    useEffect(() => {
        if (data) {
            setLastSavedState(JSON.stringify(data));
        }
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

    const handleSwitchMode = (targetMode: 'sheet' | 'settings' | 'library') => {
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

    return (
        <NotificationProvider value={addLog}>
            <div className={`min-h-screen bg-[#1c1c1c] text-stone-200 font-sans selection:bg-red-900 selection:text-white ${isLandscape ? 'landscape-mode' : ''}`}>
                <UpdateNotifier />

                {/* Background Texture (Parchemin Global) */}
                <div className="fixed inset-0 pointer-events-none z-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]"></div>

                {/* NEW: Diegetic Navigation (Styled as Classic) */}
                <DiegeticNavigation
                    currentMode={mode}
                    setMode={setMode}
                    onOpenImportExport={() => setShowImportExport(true)}
                    onPrintRequest={handlePrintRequest}
                    onToggleLandscape={() => setIsLandscape(!isLandscape)}
                    isLandscape={isLandscape}
                    onShowLogs={() => setShowLogs(!showLogs)}
                    showLogs={showLogs}
                    onShowUserGuide={() => setShowUserGuide(true)}
                    onShowChangelog={() => setShowChangelog(true)}
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
                        ) : mode === 'library' ? (
                            <div className="max-w-5xl mx-auto w-full p-4 h-[calc(100vh-80px)]">
                                {/* NEW: Using LibraryView instead of TraitLibrary directly */}
                                <LibraryView />
                            </div>
                        ) : (
                            <SettingsView
                                onClose={() => setMode('sheet')}
                                onDirtyChange={setIsSettingsDirty}
                            />
                        )}
                    </main>

                    <div id="printable-area" className="hidden">
                        {pagesToPrint.p1 && (<div className="print-sheet-wrapper"><CharacterSheet isLandscape={isLandscape} /></div>)}
                        {pagesToPrint.specs && (<div className="print-sheet-wrapper"><CharacterSheetSpecializations isLandscape={isLandscape} /></div>)}
                        {pagesToPrint.p2 && (<div className="print-sheet-wrapper"><CharacterSheetPage2 isLandscape={isLandscape} /></div>)}
                        {pagesToPrint.xp && (<div className="print-sheet-wrapper"><CharacterSheetXP isLandscape={isLandscape} /></div>)}
                        {pagesToPrint.notes && (<div className="print-sheet-wrapper"><CampaignNotes isLandscape={isLandscape} /></div>)}
                    </div>

                    <ImportExportModal
                        isOpen={showImportExport}
                        onClose={() => setShowImportExport(false)}
                        onImportSuccess={(newData) => { const migrated = migrateData(newData); setData(migrated); setShowImportExport(false); setMode('sheet'); setIsSettingsDirty(false); setLastSavedState(JSON.stringify(newData)); }}
                        onExportSuccess={() => { setLastSavedState(JSON.stringify(data)); }}
                        variant={mode === 'settings' ? 'gm' : 'player'}
                    />
                    <PrintSelectionModal isOpen={showPrintModal} onClose={() => setShowPrintModal(false)} onConfirm={handlePrintConfirm} />
                    {showDiscardConfirm && (
                        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
                                <div className="flex flex-col items-center text-center gap-4">
                                    <div className="bg-amber-100 p-3 rounded-full text-amber-600"><AlertTriangle size={32} /></div>
                                    <h3 className="text-xl font-bold text-gray-900">Modifications non sauvegardées</h3>
                                    <p className="text-gray-600 text-sm">Vous avez modifié la structure de la fiche sans sauvegarder. Si vous quittez maintenant, ces changements seront perdus.</p>
                                    <div className="flex gap-3 w-full mt-2">
                                        <button onClick={() => setShowDiscardConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50">Annuler</button>
                                        <button onClick={confirmDiscard} className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700">Quitter sans sauver</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <ChangelogModal isOpen={showChangelog} onClose={() => setShowChangelog(false)} />
                    <UserGuideModal isOpen={showUserGuide} onClose={() => setShowUserGuide(false)} />
                </div>
            </div>
        </NotificationProvider>
    );
};

export default MainLayout;
