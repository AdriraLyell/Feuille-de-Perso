
import React, { useState } from 'react';
import { Settings, FileText, Save, Printer, History, HelpCircle, ScrollText, Download, RectangleVertical, RectangleHorizontal, Palette, UploadCloud, Info, Menu, X, AlertTriangle, MessageSquare, Layout, PencilLine, RotateCcw, Maximize2 } from 'lucide-react';
import { useCharacterState } from '../../context/CharacterContext';
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
    isMessagingOpen?: boolean;
    onToggleMessaging?: () => void;
    unreadMessagesCount?: number;
    isEditMode?: boolean;
    onToggleEditMode?: () => void;
    isEditLayoutMode?: boolean;
    onToggleEditLayoutMode?: () => void;
    onResetLayout?: () => void;
    onAutoFitLayout?: () => void;
}

const DiegeticNavigation: React.FC<DiegeticNavigationProps> = ({
    currentMode, onModeChange, onOpenImportExport,
    onPrintRequest, onToggleLandscape, isLandscape,
    onShowLogs, showLogs, onShowUserGuide, onShowChangelog, onOpenAppearance, onOpenSync, syncStatus, appVersion,
    onShowCampaignInfo, autoSaveCountdown,
    isMessagingOpen, onToggleMessaging, unreadMessagesCount,
    isEditMode, onToggleEditMode, isEditLayoutMode, onToggleEditLayoutMode,
    onResetLayout, onAutoFitLayout
}) => {
    const { data, isSyncing } = useCharacterState();
    const { rules } = useRules();
    const { stats } = useStorageUsage();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

    const [isOnline, setIsOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
    React.useEffect(() => {
        const hO = () => setIsOnline(true);
        const hF = () => setIsOnline(false);
        window.addEventListener('online', hO);
        window.addEventListener('offline', hF);
        return () => {
            window.removeEventListener('online', hO);
            window.removeEventListener('offline', hF);
        };
    }, []);

    const getSyncConfig = () => {
        if (!isOnline) return { color: 'text-red-500 border-red-900/50 bg-red-900/10', tooltip: 'Mode Hors-ligne - Les modifications sont enregistrées localement uniquement' };
        if (isSyncing) return { color: 'text-blue-400 border-blue-900/50 bg-blue-900/10', tooltip: 'Synchronisation en cours...' };
        if (syncStatus === 'update-available') return { color: 'text-amber-400 border-amber-500 bg-amber-900/20', tooltip: 'Mise à jour disponible ! Le MJ a modifié votre fiche.' };
        if (data.syncInfo?.isDirty) {
            const tooltip = 'Modifications locales en attente d\'envoi';
            return { color: 'text-amber-500/80 border-amber-900/30 bg-amber-900/10', tooltip };
        }
        if (data.syncInfo?.syncId) return { color: 'text-emerald-500 border-emerald-900/50 bg-emerald-900/10', tooltip: 'Connecté - Fiche à jour sur le Cloud' };
        return { color: 'text-gray-400 border-gray-700 bg-gray-800/50', tooltip: 'Synchronisation non configurée' };
    };

    const syncConfig = getSyncConfig();

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
        {
            label: 'Messages',
            icon: (
                <div className="relative">
                    <MessageSquare size={18} />
                    {unreadMessagesCount ? unreadMessagesCount > 0 && (
                        <div className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 border border-gray-900 shadow-sm">
                            {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                        </div>
                    ) : null}
                </div>
            ),
            onClick: () => { onToggleMessaging?.(); setIsMobileMenuOpen(false); },
            active: isMessagingOpen,
            highlight: unreadMessagesCount ? unreadMessagesCount > 0 : false
        }
    ];

    return (
        <nav className="bg-gray-800 text-white px-4 shadow-md no-print fixed top-0 left-0 right-0 w-full z-50 h-14 flex items-center border-b border-gray-700">
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

                    <div className="relative">
                        <button
                            onClick={() => setIsEditMenuOpen(!isEditMenuOpen)}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition ${isEditMenuOpen || isEditLayoutMode || isEditMode
                                ? 'bg-amber-600 text-white shadow-sm border border-amber-400'
                                : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 hover:text-white'
                                }`}
                            title="Menu Édition"
                        >
                            <Palette size={18} />
                            <span className="hidden lg:inline text-xs font-black uppercase tracking-wider">Édition</span>
                        </button>

                        <AnimatePresence>
                            {isEditMenuOpen && (
                                <>
                                    <button
                                        type="button"
                                        className="fixed inset-0 z-[90] bg-transparent cursor-default w-full h-full border-none p-0"
                                        onClick={() => setIsEditMenuOpen(false)}
                                        aria-label="Fermer le menu"
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="absolute left-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl overflow-hidden z-[100] backdrop-blur-xl"
                                    >
                                        <div className="p-2 border-b border-gray-800 bg-gray-800/50 flex flex-col gap-0.5">
                                            <p className="px-2 py-1 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Modes de modification</p>
                                        </div>
                                        <div className="p-1.5 space-y-1">
                                            <button
                                                onClick={() => { onOpenAppearance(); setIsEditMenuOpen(false); }}
                                                className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold hover:bg-gray-800 rounded-md text-gray-300 transition-all hover:translate-x-1"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Palette size={16} className="text-amber-500" />
                                                    <span>Apparence</span>
                                                </div>
                                            </button>

                                            <button
                                                onClick={() => { onToggleEditLayoutMode?.(); setIsEditMenuOpen(false); }}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-md transition-all hover:translate-x-1 ${isEditLayoutMode
                                                    ? 'bg-indigo-600 text-white shadow-lg'
                                                    : 'text-gray-300 hover:bg-gray-800'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Layout size={16} className={isEditLayoutMode ? 'text-white' : 'text-indigo-400'} />
                                                    <span>Agencement</span>
                                                </div>
                                                {isEditLayoutMode && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                            </button>

                                            <button
                                                onClick={() => { onToggleEditMode?.(); setIsEditMenuOpen(false); }}
                                                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-md transition-all hover:translate-x-1 ${isEditMode
                                                    ? 'bg-red-600 text-white shadow-lg'
                                                    : 'text-gray-300 hover:bg-gray-800'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <PencilLine size={16} className={isEditMode ? 'text-white' : 'text-red-400'} />
                                                    <span>Compétences</span>
                                                </div>
                                                {isEditMode && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                            </button>
                                        </div>

                                        {isEditLayoutMode && (
                                            <>
                                                <div className="p-2 border-t border-gray-800 bg-gray-800/50 flex flex-col gap-0.5 mt-1">
                                                    <p className="px-2 py-1 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Outils Agencement</p>
                                                </div>
                                                <div className="p-1.5 space-y-1">
                                                    <button
                                                        onClick={() => { onAutoFitLayout?.(); setIsEditMenuOpen(false); }}
                                                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-indigo-400 hover:bg-gray-800 rounded-md transition-all hover:translate-x-1"
                                                    >
                                                        <Maximize2 size={16} />
                                                        <span>Ajustement Auto</span>
                                                    </button>
                                                    <button
                                                        onClick={() => { onResetLayout?.(); setIsEditMenuOpen(false); }}
                                                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-gray-400 hover:bg-gray-800 rounded-md transition-all hover:translate-x-1"
                                                    >
                                                        <RotateCcw size={16} />
                                                        <span>Réinitialiser</span>
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>

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
                                onClick={onToggleMessaging}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition flex items-center gap-2 relative ${isMessagingOpen
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                                title="Messagerie"
                            >
                                <div className="relative">
                                    <MessageSquare size={16} />
                                    {unreadMessagesCount ? unreadMessagesCount > 0 && (
                                        <div className="absolute -top-2.5 -right-2 bg-rose-600 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 border border-gray-900 shadow-sm animate-pulse">
                                            {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                                        </div>
                                    ) : null}
                                </div>
                            </button>
                        </div>

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

                        <button
                            onClick={onOpenImportExport}
                            className="bg-amber-700/20 hover:bg-amber-700/40 text-amber-500 hover:text-amber-400 border border-amber-700/50 px-3 py-1.5 rounded-lg flex items-center gap-2 transition text-sm font-bold"
                            title="Sauvegarder / Charger"
                        >
                            <Save size={18} />
                        </button>

                        <button
                            onClick={onOpenSync}
                            title={syncConfig.tooltip}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition text-sm font-bold border relative ${syncConfig.color} ${syncStatus === 'update-available' ? 'shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-pulse' : ''}`}
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
