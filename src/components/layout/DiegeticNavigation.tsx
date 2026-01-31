import React from 'react';
import { Book, Settings, FileText, Layout, Save, Upload, Feather, LogOut, Printer, Monitor, Smartphone, History, HelpCircle, ScrollText, ArrowRightLeft, BookOpen } from 'lucide-react';
import { useCharacter } from '../../context/CharacterContext';
import { CharacterSheetData } from '../../types';

interface DiegeticNavigationProps {
    currentMode: 'sheet' | 'settings' | 'library';
    setMode: (mode: 'sheet' | 'settings' | 'library') => void;
    onOpenImportExport: () => void;
    onPrintRequest: () => void;
    onToggleLandscape: () => void;
    isLandscape: boolean;
    onShowLogs: () => void;
    showLogs: boolean;
    onShowUserGuide: () => void;
    onShowChangelog: () => void;
    appVersion: string;
}

const DiegeticNavigation: React.FC<DiegeticNavigationProps> = ({
    currentMode, setMode, onOpenImportExport,
    onPrintRequest, onToggleLandscape, isLandscape,
    onShowLogs, showLogs, onShowUserGuide, onShowChangelog, appVersion
}) => {
    const { data } = useCharacter();

    return (
        <nav className="bg-gray-800 text-white px-4 shadow-md no-print sticky top-0 z-50 h-14 flex items-center border-b border-gray-700">
            <div className="max-w-[1920px] mx-auto flex justify-between items-center w-full">

                {/* Left: Toggles + Character Name */}
                <div className="flex items-center gap-4 mr-4">
                    <button
                        onClick={onToggleLandscape}
                        className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${isLandscape
                            ? 'bg-indigo-600 text-white border border-indigo-400'
                            : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'
                            }`}
                        title={isLandscape ? "Passer en Portrait" : "Passer en Paysage"}
                    >
                        {isLandscape ? <Monitor size={18} /> : <Smartphone size={18} className="rotate-90" />}
                        {/* Hide label on very small screens if needed, otherwise keep it */}
                        <span className="hidden md:inline">{isLandscape ? "Paysage" : "Portrait"}</span>
                    </button>

                    {/* Sheet Button */}
                    <button
                        onClick={() => setMode('sheet')}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors flex items-center gap-2 ${currentMode === 'sheet'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                    >
                        <FileText size={16} /> Fiche
                    </button>

                    <div className="w-px h-6 bg-gray-600 hidden md:block"></div>

                    {/* Character Name (Centered) */}
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-400 uppercase font-bold leading-none text-center">Personnage</span>
                        <span className="text-sm font-bold text-gray-200 max-w-[200px] truncate leading-tight text-center">
                            {data.header?.name || 'Sans Nom'}
                        </span>
                    </div>
                </div>

                {/* Right: Main Navigation + Tools */}
                <div className="flex items-center gap-2">

                    {/* Navigation Buttons (Moved to Right) */}
                    <div className="hidden md:flex items-center gap-2 mr-4 border-r border-gray-600 pr-4">
                        <button
                            onClick={() => setMode('library')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors flex items-center gap-2 ${currentMode === 'library'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                        >
                            <BookOpen size={16} /> Bibliothèque
                        </button>
                        <button
                            onClick={() => setMode('settings')}
                            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors flex items-center gap-2 ${currentMode === 'settings'
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                        >
                            <Settings size={16} /> Réglages
                        </button>
                    </div>

                    {/* Action Tools */}
                    <button
                        onClick={onPrintRequest}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors"
                        title="Imprimer"
                    >
                        <Printer size={18} />
                    </button>

                    <button
                        onClick={onOpenImportExport}
                        className="bg-amber-700/20 hover:bg-amber-700/40 text-amber-500 hover:text-amber-400 border border-amber-700/50 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all text-sm font-bold"
                        title="Sauvegarder / Charger"
                    >
                        <Save size={18} />
                        <span className="hidden sm:inline">Sauvegarder</span>
                    </button>

                    <div className="w-px h-6 bg-gray-600 mx-1"></div>

                    <button
                        onClick={onShowLogs}
                        className={`p-2 rounded-lg transition-colors ${showLogs ? 'bg-gray-200 text-gray-900' : 'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white'}`}
                        title="Historique"
                    >
                        <History size={18} />
                    </button>

                    <button
                        onClick={onShowUserGuide}
                        className="bg-teal-600/20 hover:bg-teal-600/40 text-teal-400 border border-teal-600/50 p-2 rounded-lg transition-colors"
                        title="Guide Utilisateur"
                    >
                        <HelpCircle size={18} />
                    </button>

                    <button
                        onClick={onShowChangelog}
                        className="flex items-center gap-1 bg-indigo-900/30 hover:bg-indigo-900/50 text-indigo-300 border border-indigo-800/50 px-2 py-1.5 rounded-lg text-xs font-mono"
                        title="Journal des versions"
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
