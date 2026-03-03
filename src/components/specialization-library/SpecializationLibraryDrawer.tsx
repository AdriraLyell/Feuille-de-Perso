
import React, { useState, useMemo } from 'react';
import { X, Search, Award, Info, GripVertical } from 'lucide-react';
import { useCharacterData } from '../../context/CharacterContext';
import { LibrarySpecializationEntry } from '../../types';
import { smartIncludes } from '../../utils/stringUtils';

interface SpecializationLibraryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect?: (name: string, minLevel: number) => void;
}

const SpecializationLibraryDrawer: React.FC<SpecializationLibraryDrawerProps> = ({
    isOpen,
    onClose,
    onSelect
}) => {
    const data = useCharacterData();
    const [searchTerm, setSearchTerm] = useState('');

    const library = data.specializationLibrary || [];

    const filteredLibrary = useMemo(() => {
        return library.filter(entry =>
            smartIncludes(entry.name, searchTerm) ||
            (entry.description && smartIncludes(entry.description, searchTerm))
        ).sort((a, b) => a.name.localeCompare(b.name));
    }, [library, searchTerm]);

    const handleDragStart = (e: React.DragEvent, entry: LibrarySpecializationEntry) => {
        // Store both name and default level in the drag data
        e.dataTransfer.setData('text/plain', entry.name);
        e.dataTransfer.setData('application/json', JSON.stringify({
            name: entry.name,
            minLevel: entry.defaultMinLevel
        }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed top-14 bottom-0 right-0 w-80 bg-white shadow-2xl z-[200] border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 bg-amber-700 text-white flex justify-between items-center shrink-0">
                <h3 className="font-bold flex items-center gap-2">
                    <Award size={20} /> Catalogue de Spés
                </h3>
                <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors">
                    <X size={20} />
                </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b bg-gray-50 shrink-0">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:border-amber-500 outline-none"
                        placeholder="Chercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto p-2 custom-scrollbar space-y-2">
                {filteredLibrary.length === 0 ? (
                    <div className="text-center text-gray-400 py-10 italic text-xs">
                        {library.length === 0 ? "La bibliothèque est vide." : "Aucun résultat."}
                    </div>
                ) : (
                    filteredLibrary.map(entry => (
                        <div
                            key={entry.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, entry)}
                            onClick={() => onSelect && onSelect(entry.name, entry.defaultMinLevel)}
                            className="bg-white border border-gray-200 rounded-lg p-3 hover:border-amber-400 hover:shadow-sm cursor-grab active:cursor-grabbing transition group relative"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    <GripVertical size={14} className="text-gray-300 group-hover:text-amber-500" />
                                    <span className="font-bold text-sm text-gray-800">{entry.name}</span>
                                </div>
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                    Lvl {entry.defaultMinLevel}
                                </span>
                            </div>
                            {entry.description && (
                                <p className="text-[10px] text-gray-500 line-clamp-1 group-hover:line-clamp-none transition">
                                    {entry.description}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Footer / Instructions */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-500 flex gap-2">
                <Info size={14} className="shrink-0 text-amber-500" />
                <p>Faites glisser une spécialisation sur la fiche ou cliquez pour l'ajouter (si liste active).</p>
            </div>
        </div>
    );
};

export default SpecializationLibraryDrawer;
