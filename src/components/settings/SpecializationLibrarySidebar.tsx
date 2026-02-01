
import React from 'react';
import { CharacterSheetData, LibrarySpecializationEntry } from '../../types';
import { Award, GripVertical, ArrowRight } from 'lucide-react';

interface SpecializationLibrarySidebarProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings') => void;
}

const SpecializationLibrarySidebar: React.FC<SpecializationLibrarySidebarProps> = ({ data, onUpdate, onAddLog }) => {

    const handleDragStart = (e: React.DragEvent, entry: LibrarySpecializationEntry) => {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("application/json", JSON.stringify({
            name: entry.name,
            minLevel: entry.defaultMinLevel
        }));
    };

    const library = data.specializationLibrary || [];

    return (
        <div className="w-80 bg-slate-100 border-l border-gray-300 flex flex-col fixed right-0 top-14 bottom-0 z-30 transition-colors">
            <div className="p-4 bg-amber-100 border-b border-amber-200 font-bold text-amber-800 flex items-center gap-2 shadow-sm">
                <Award size={18} />
                Catalogue de Spécialisations
            </div>

            <div className="p-3 text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                Glissez une spécialisation sur une compétence à gauche pour l'imposer.
            </div>

            <div className="flex-grow overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {library.length === 0 ? (
                    <div className="text-center text-slate-400 italic mt-10 px-4">
                        La bibliothèque est vide. Peuplez-la dans l'onglet "Bibliothèque" du menu principal.
                    </div>
                ) : (
                    library.map(item => (
                        <div
                            key={item.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, item)}
                            className="bg-white p-2 rounded border border-gray-300 shadow-sm cursor-grab active:cursor-grabbing hover:border-amber-400 hover:shadow-md transition-all flex justify-between items-center group"
                        >
                            <div className="flex items-center gap-2">
                                <GripVertical size={14} className="text-gray-300 group-hover:text-amber-500" />
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm text-slate-700">{item.name}</span>
                                    <span className="text-[10px] text-amber-600 font-bold">MJ Lvl {item.defaultMinLevel}</span>
                                </div>
                            </div>
                            <ArrowRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100" />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SpecializationLibrarySidebar;
