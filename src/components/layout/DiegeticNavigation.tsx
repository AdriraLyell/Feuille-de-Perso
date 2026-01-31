import React from 'react';
import { Book, Settings, FileText, Layout, Save, Upload, Feather, LogOut, Printer, Monitor, Smartphone, History, HelpCircle, ScrollText, ArrowRightLeft, BookOpen, Download, RectangleVertical, RectangleHorizontal } from 'lucide-react';
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
                    >
                        {isLandscape ? <RectangleHorizontal size={18} /> : <RectangleVertical size={18} />}
                    </button>

                    <div className="w-px h-6 bg-gray-600 hidden md:block"></div>

                    {/* Sheet Button */}
                    <button
                        onClick={() => setMode('sheet')}
                        className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors flex items-center gap-2 ${currentMode === 'sheet'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-gray-300 hover:text-white hover:bg-gray-700'}`}
                    >
                        <FileText size={16} /> Fiche de Personnage
                    </button>

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
                        onClick={onOpenImportExport}
                        className="bg-amber-700/20 hover:bg-amber-700/40 text-amber-500 hover:text-amber-400 border border-amber-700/50 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all text-sm font-bold"
                        title="Sauvegarder / Charger"
                    >
                        <div className="flex items-center gap-0.5">
                            <Save size={18} />
                            <Download size={18} />
                        </div>
                    </button>

                    <div className="w-px h-6 bg-gray-600 mx-1"></div>

                    <button
                        onClick={onPrintRequest}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors"
                        title="Imprimer"
                    >
                        <Printer size={18} />
                    </button>

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
