
import React, { useState } from 'react';
import { Settings, FileText, Save, Printer, History, HelpCircle, ScrollText, Download, RectangleVertical, RectangleHorizontal, Palette, UploadCloud, Info, Menu, X, AlertTriangle } from 'lucide-react';
import { useCharacter } from '../../context/CharacterContext';
import { useRules } from '../../context/RulesContext';
import { useStorageUsage } from '../../hooks/useStorageUsage';

import RulesStatus from '../ui/RulesStatus';
import { motion, AnimatePresence } from 'framer-motion';

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
    syncStatus?: 'none' | 'synced' | 'pending' | 'update-available';
    appVersion: string;
    onShowCampaignInfo: () => void;
    autoSaveCountdown?: number;
}

const DiegeticNavigation: React.FC<DiegeticNavigationProps> = ({
    currentMode, onModeChange, onOpenImportExport,
    onPrintRequest, onToggleLandscape, isLandscape,
    onShowLogs, showLogs, onShowUserGuide, onShowChangelog, onOpenAppearance, onOpenSync, syncStatus, appVersion,
    onShowCampaignInfo, autoSaveCountdown
}) => {
    const { data, isSyncing } = useCharacter();
    const { rules } = useRules();
    const { stats } = useStorageUsage();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const menuItems = [
        { label: 'Thème', icon: <Palette size={18} />, onClick: onOpenAppearance },
        {
            label: 'Réglages',
            icon: (
                <div className="relative">
                    <Settings size={18} />
                    {(stats?.isCritical || stats?.isWarning) && (
                        <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-gray-900 ${stats.isCritical ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                    )}
                </div>
            ),
            onClick: () => { onModeChange('settings'); setIsMobileMenuOpen(false); },
            active: currentMode === 'settings',
            isWarning: stats?.isCritical || stats?.isWarning
        },
        { label: 'Import/Export', icon: <Download size={18} />, onClick: onOpenImportExport },
        {
            label: 'Synchro',
            icon: (
                <div className="relative">
                    <UploadCloud size={18} />
                    {syncStatus === 'update-available' && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-gray-900 animate-pulse" />
                    )}
                </div>
            ),
            onClick: onOpenSync,
            highlight: data.syncInfo?.isAutoSyncEnabled || syncStatus === 'update-available'
        },
        { label: 'Imprimer', icon: <Printer size={18} />, onClick: onPrintRequest },
        { label: 'Historique', icon: <History size={18} />, onClick: onShowLogs, active: showLogs },
        { label: 'Guide', icon: <HelpCircle size={18} />, onClick: onShowUserGuide },
        { label: 'Changelog', icon: <ScrollText size={18} />, onClick: onShowChangelog },
    ];

    return (
        <nav className="bg-gray-800 text-white px-4 shadow-md no-print sticky top-0 z-50 h-14 flex items-center border-b border-gray-700 relative">
            <div className="max-w-[1920px] mx-auto flex justify-between items-center w-full">

                {/* Left: Toggles + Sheet Button */}
                <div className="flex items-center gap-2 md:gap-4 mr-4 z-10">
                    <button
                        onClick={onToggleLandscape}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition ${isLandscape
                            ? 'bg-indigo-600 text-white border border-indigo-400'
                            : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                            }`}
                        title={isLandscape ? "Passer en Portrait" : "Passer en Paysage"}
                        aria-label={isLandscape ? "Passer en Portrait" : "Passer en Paysage"}
                    >
                        {isLandscape ? <RectangleHorizontal size={18} /> : <RectangleVertical size={18} />}
                    </button>

                    <button
                        onClick={onOpenAppearance}
                        className="px-3 py-1.5 rounded-lg flex items-center gap-2 transition bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 hover:text-white"
                        title="Changer l'apparence"
                        aria-label="Changer l'apparence"
                    >
                        <Palette size={18} />
                    </button>

                    <div className="w-px h-6 bg-gray-600 hidden md:block"></div>

                    {/* Sheet Button & Setting Badge */}
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                        <button
                            onClick={() => onModeChange('sheet')}
                            className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-bold transition-colors flex items-center gap-2 ${currentMode === 'sheet'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                        >
                            <FileText size={16} /> <span className="hidden sm:inline">Fiche</span>
                        </button>

                        {rules?.settingName && (
                            <div className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 bg-slate-700/50 border border-slate-600 rounded-full text-[10px] md:text-xs font-medium text-slate-300 animate-in fade-in slide-in-from-left-2 duration-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                                <span className="font-bold text-white truncate max-w-[80px] md:max-w-[150px]">
                                    {rules.settingName}
                                </span>
                                {rules?.showMetadataToPlayers && (
                                    <button
                                        onClick={onShowCampaignInfo}
                                        className="ml-2 p-1 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition active:scale-90"
                                        title="Voir les infos de campagne"
                                        aria-label="Voir les infos de campagne"
                                    >
                                        <Info size={10} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                </div>

                {/* Center: Character Name (Compact & Impactful Typography) */}
                <div className="absolute inset-0 hidden sm:flex items-center justify-center pointer-events-none z-0 px-4">
                    <span className="text-2xl md:text-3xl lg:text-4xl font-black font-serif tracking-tighter uppercase select-none
                        bg-gradient-to-b from-white via-white to-gray-400 bg-clip-text text-transparent
                        drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] text-center leading-none whitespace-nowrap">
                        {data.header?.name || 'Sans Nom'}
                    </span>
                </div>

                {/* Right: Main Navigation + Tools */}
                <div className="flex items-center gap-1 md:gap-2 z-10">

                    {/* Desktop Tools */}
                    <div className="hidden md:flex items-center gap-2">
                        <div className="flex items-center gap-2 mr-4 border-r border-gray-600 pr-4">
                            <button
                                onClick={() => onModeChange('settings')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition flex items-center gap-2 relative ${currentMode === 'settings'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                                title="Réglages"
                            >
                                <div className="relative">
                                    <Settings size={16} />
                                    {(stats?.isCritical || stats?.isWarning) && (
                                        <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center">
                                            {stats.isCritical && <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-red-400 opacity-75"></span>}
                                            <span className={`relative inline-flex rounded-full h-2 w-2 border border-gray-900 ${stats.isCritical ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                                        </div>
                                    )}
                                </div>
                                {stats?.isCritical && (
                                    <AlertTriangle size={14} className="text-red-400 animate-pulse ml-0.5" />
                                )}
                                {stats?.isWarning && !stats?.isCritical && (
                                    <AlertTriangle size={14} className="text-amber-400 ml-0.5" />
                                )}
                            </button>
                        </div>

                        <button
                            onClick={onOpenImportExport}
                            className="bg-amber-700/20 hover:bg-amber-700/40 text-amber-500 hover:text-amber-400 border border-amber-700/50 px-3 py-1.5 rounded-lg flex items-center gap-2 transition text-sm font-bold"
                            title="Sauvegarder / Charger"
                        >
                            <Save size={18} />
                        </button>

                        <button
                            onClick={onOpenSync}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition text-sm font-bold border relative ${syncStatus === 'synced'
                                ? 'bg-green-700/20 text-green-500 border-green-700/50'
                                : syncStatus === 'update-available'
                                    ? 'bg-amber-700/30 text-amber-400 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-pulse'
                                    : 'bg-purple-700/20 text-purple-400 border-purple-700/50'
                                }`}
                        >
                            <UploadCloud size={18} className={isSyncing ? "animate-spin-slow" : ""} />
                            <span className="hidden lg:inline">Sync</span>
                            {syncStatus === 'update-available' && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border border-gray-900"></span>
                                </span>
                            )}
                            {/* Auto-Save Countdown Badge */}
                            {typeof autoSaveCountdown === 'number' && (
                                <span className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[10px] font-mono font-bold w-5 h-5 flex items-center justify-center rounded-full shadow border-2 border-gray-800 z-10">
                                    {autoSaveCountdown}
                                </span>
                            )}
                        </button>

                        <button onClick={onPrintRequest} className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg"><Printer size={18} /></button>
                        <button onClick={onShowLogs} className={`p-2 rounded-lg ${showLogs ? 'bg-gray-200 text-gray-900' : 'bg-gray-700 text-gray-300'}`}><History size={18} /></button>
                    </div>

                    <div className="h-8 flex items-center border-l md:border-r border-gray-600 px-2">
                        <RulesStatus />
                    </div>

                    <button
                        onClick={onShowChangelog}
                        className="hidden md:flex items-center gap-1 bg-indigo-900/30 text-indigo-300 border border-indigo-800/50 px-2 py-1.5 rounded-lg text-xs font-mono"
                    >
                        v{appVersion}
                    </button>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={toggleMobileMenu}
                        className="md:hidden p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600"
                        aria-label="Menu"
                    >
                        {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        className="fixed inset-0 top-14 bg-gray-900/95 backdrop-blur-md z-[100] md:hidden overflow-y-auto"
                    >
                        <div className="p-6 grid grid-cols-2 gap-4">
                            {menuItems.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { item.onClick(); setIsMobileMenuOpen(false); }}
                                    className={`flex flex-col items-center justify-center p-6 rounded-xl border transition gap-3 ${item.active
                                        ? 'bg-blue-600 border-blue-400 text-white'
                                        : 'bg-gray-800 border-gray-700 text-gray-300 active:bg-gray-700'
                                        } ${item.highlight ? 'ring-2 ring-purple-500' : ''}`}
                                >
                                    <div className={`${item.active ? 'text-white' : 'text-amber-500'}`}>
                                        {item.icon}
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
                                </button>
                            ))}

                            <div className="col-span-2 pt-6 border-t border-gray-800 flex justify-between items-center text-[10px] text-gray-500 font-mono uppercase">
                                <span>Version {appVersion}</span>
                                <span className="text-gray-600 italic">"Les ombres attendent"</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default DiegeticNavigation;
