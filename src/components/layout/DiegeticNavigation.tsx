import React from 'react';
import { Book, Settings, FileText, Layout, Save, Upload, Feather, LogOut, Printer, Monitor, Smartphone, History, HelpCircle, ScrollText, ArrowRightLeft, BookOpen, Download, RectangleVertical, RectangleHorizontal, Palette, UploadCloud, Info } from 'lucide-react';
import { useCharacter } from '../../context/CharacterContext';
import { useRules } from '../../context/RulesContext';
import { CharacterSheetData } from '../../types';
import RulesStatus from '../ui/RulesStatus';

interface DiegeticNavigationProps {
    currentMode: 'sheet' | 'settings';
    onModeChange: (mode: 'sheet' | 'settings') => void;
    onOpenImportExport: () => void;
    onPrintRequest: () => void;
    onToggleLandscape: () => void;
    isLandscape: boolean;
    onShowLogs: () => void;
    showLogs: boolean;
    onShowUserGuide: () => void;
    onShowChangelog: () => void;
    onOpenAppearance: () => void;
    onOpenSync: () => void;
    syncStatus?: 'none' | 'synced' | 'pending';
    appVersion: string;
    onShowCampaignInfo: () => void;
}

const DiegeticNavigation: React.FC<DiegeticNavigationProps> = ({
    currentMode, onModeChange, onOpenImportExport,
    onPrintRequest, onToggleLandscape, isLandscape,
    onShowLogs, showLogs, onShowUserGuide, onShowChangelog, onOpenAppearance, onOpenSync, syncStatus, appVersion,
    onShowCampaignInfo
}) => {
    const { data, isSyncing } = useCharacter();
    const { rules } = useRules();

    return (
        <nav className="bg-gray-800 text-white px-4 shadow-md no-print sticky top-0 z-50 h-14 flex items-center border-b border-gray-700 relative">
            <div className="max-w-[1920px] mx-auto flex justify-between items-center w-full">

                {/* Left: Toggles + Sheet Button */}
                <div className="flex items-center gap-4 mr-4 z-10">
                    <button
                        onClick={onToggleLandscape}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${isLandscape
                            ? 'bg-indigo-600 text-white border border-indigo-400'
                            : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                            }`}
                        title={isLandscape ? "Passer en Portrait" : "Passer en Paysage"}
                        aria-label={isLandscape ? "Passer en Portrait" : "Passer en Paysage"}
                    >
                        {isLandscape ? <RectangleHorizontal size={18} /> : <RectangleVertical size={18} />}
                    </button>

                    <div className="w-px h-6 bg-gray-600 hidden md:block"></div>

                    {/* Sheet Button & Setting Badge */}
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                        <button
                            onClick={() => onModeChange('sheet')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors flex items-center gap-2 ${currentMode === 'sheet'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                        >
                            <FileText size={16} /> Fiche de Personnage
                        </button>

                        {(rules as any)?.settingName && (
                            <div className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 bg-slate-700/50 border border-slate-600 rounded-full text-[10px] md:text-xs font-medium text-slate-300 animate-in fade-in slide-in-from-left-2 duration-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                <span className="uppercase tracking-wider opacity-70 mr-1 hidden sm:inline">Campagne:</span>
                                <span className="font-bold text-white truncate max-w-[120px] md:max-w-[150px]">
                                    {(rules as any).settingName}
                                </span>
                                {rules?.showMetadataToPlayers && (
                                    <button
                                        onClick={onShowCampaignInfo}
                                        className="ml-2 p-1 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all active:scale-90"
                                        title="Voir les infos de campagne"
                                        aria-label="Voir les infos de campagne"
                                    >
                                        <Info size={12} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                </div>

                {/* Center: Character Name (Absolute Centered) */}
                <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-0">
                    <span className="text-[10px] text-gray-400 uppercase font-bold leading-none text-center">Personnage</span>
                    <span className="text-sm font-bold text-gray-200 max-w-[300px] truncate leading-tight text-center">
                        {data.header?.name || 'Sans Nom'}
                    </span>
                </div>

                {/* Right: Main Navigation + Tools */}
                <div className="flex items-center gap-2 z-10">

                    {/* Navigation Buttons (Moved to Right) */}
                    <div className="hidden md:flex items-center gap-2 mr-4 border-r border-gray-600 pr-4">
                        <button
                            onClick={onOpenAppearance}
                            className="px-4 py-1.5 rounded-md text-sm font-bold transition-colors flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-700"
                            title="Changer l'apparence"
                        >
                            <Palette size={16} /> Thème
                        </button>
                        <button
                            onClick={() => onModeChange('settings')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors flex items-center gap-2 ${currentMode === 'settings'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                        >
                            <Settings size={16} /> Réglages
                        </button>
                    </div>

                    {/* Action Tools */}
                    <button
                        onClick={onOpenImportExport}
                        className="bg-amber-700/20 hover:bg-amber-700/40 text-amber-500 hover:text-amber-400 border border-amber-700/50 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all text-sm font-bold"
                        title="Sauvegarder / Charger"
                        aria-label="Sauvegarder ou Charger les données"
                    >
                        <div className="flex items-center gap-0.5" aria-hidden="true">
                            <Save size={18} />
                            <Download size={18} />
                        </div>
                    </button>

                    {/* Sync Button */}
                    <button
                        onClick={onOpenSync}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all text-sm font-bold border relative ${syncStatus === 'synced'
                            ? 'bg-green-700/20 hover:bg-green-700/40 text-green-500 border-green-700/50'
                            : 'bg-purple-700/20 hover:bg-purple-700/40 text-purple-400 border-purple-700/50'
                            } ${isSyncing ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-800' : ''}`}
                        title={isSyncing ? "Synchronisation en cours..." : (data.syncInfo?.isAutoSyncEnabled ? "Auto-Sync Actif" : "Synchroniser avec le MJ")}
                        aria-label={isSyncing ? "Synchronisation en cours" : "Ouvrir les options de synchronisation"}
                    >
                        <UploadCloud size={18} className={isSyncing ? "animate-spin-slow" : ""} aria-hidden="true" />
                        <span className="hidden lg:inline">{isSyncing ? "Sync..." : "Sync"}</span>
                        {data.syncInfo?.isAutoSyncEnabled && !isSyncing && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5" aria-hidden="true">
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                        )}
                        {isSyncing && (
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5" aria-hidden="true">
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                            </span>
                        )}
                    </button>

                    <div className="w-px h-6 bg-gray-600 mx-1"></div>

                    <button
                        onClick={onPrintRequest}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors"
                        title="Imprimer"
                        aria-label="Imprimer la fiche"
                    >
                        <Printer size={18} />
                    </button>

                    <button
                        onClick={onShowLogs}
                        className={`p-2 rounded-lg transition-colors ${showLogs ? 'bg-gray-200 text-gray-900' : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'}`}
                        title="Historique"
                        aria-label="Voir l'historique des modifications"
                    >
                        <History size={18} />
                    </button>

                    <button
                        onClick={onShowUserGuide}
                        className="bg-teal-600/20 hover:bg-teal-600/40 text-teal-400 border border-teal-600/50 p-2 rounded-lg transition-colors"
                        title="Guide Utilisateur"
                        aria-label="Lire le guide de l'utilisateur"
                    >
                        <HelpCircle size={18} />
                    </button>

                    <div className="mr-2 h-8 flex items-center border-r border-gray-600 pr-2">
                        <RulesStatus />
                    </div>

                    <button
                        onClick={onShowChangelog}
                        className="flex items-center gap-1 bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-800/50 px-2 py-1.5 rounded-lg text-xs font-mono"
                        title="Journal des versions"
                        aria-label={`Journal des versions, version actuelle ${appVersion}`}
                    >
                        <ScrollText size={16} />
                        v{appVersion}
                    </button>

                </div>
            </div>
        </nav>
    );
};

export default DiegeticNavigation;
