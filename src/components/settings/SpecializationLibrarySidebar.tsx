import React, { useMemo } from 'react';
import { Award, GripVertical, ArrowRight, Zap, Globe } from 'lucide-react';
import { CharacterSheetData, LibrarySpecializationEntry } from '../../types';
import { useRules } from '../../context/RulesContext';
import { mergeLibraries } from '../../utils/libraryMerger';

interface SpecializationLibrarySidebarProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings') => void;
}

const SpecializationLibrarySidebar: React.FC<SpecializationLibrarySidebarProps> = ({ data }) => {
    const { rules } = useRules();

    const hybridLibrary = useMemo(() => {
        const local = data.specializationLibrary || [];
        const official = rules?.libraries?.specializations || [];
        return mergeLibraries(local, official);
    }, [data.specializationLibrary, rules]);

    const handleDragStart = (e: React.DragEvent, entry: LibrarySpecializationEntry) => {
        e.dataTransfer.effectAllowed = "copy";
        e.dataTransfer.setData("application/json", JSON.stringify({
            name: entry.name,
            minLevel: entry.defaultMinLevel
        }));
    };

    return (
        <div className="flex flex-col h-full bg-[#fdfbf7] border-l border-[#bfae85]/30 shadow-inner w-64 shrink-0 overflow-hidden">
            <div className="p-3 border-b border-[#bfae85]/20 bg-stone-100 flex items-center gap-2 shrink-0">
                <Award size={16} className="text-amber-700" />
                <h3 className="text-xs font-black uppercase tracking-tighter text-[#4a3b32]">Catalogue</h3>
            </div>

            <div className="flex-grow overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-amber-200 scrollbar-track-transparent">
                <div className="flex flex-col gap-2">
                    {hybridLibrary.length === 0 ? (
                        <div className="text-center text-slate-400 italic mt-10 px-4">
                            La bibliothèque est vide. Peuplez-la dans l'onglet "Bibliothèque" du menu principal.
                        </div>
                    ) : (
                        hybridLibrary.map(item => (
                            <div
                                key={item.entry.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, item.entry)}
                                className="bg-white p-2 rounded border border-gray-300 shadow-sm cursor-grab active:cursor-grabbing hover:border-amber-400 hover:shadow-md transition-all flex justify-between items-center group"
                            >
                                <div className="flex items-center gap-2">
                                    <GripVertical size={14} className="text-gray-300 group-hover:text-amber-500" />
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-sm text-slate-700">{item.entry.name}</span>
                                            {item.source === 'official' && (
                                                <span title="Officiel">
                                                    <Globe size={10} className="text-slate-400" />
                                                </span>
                                            )}
                                            {item.entry.isImposed && (
                                                <Zap size={10} className="text-blue-500 fill-blue-500" />
                                            )}
                                        </div>
                                        <span className="text-[10px] text-amber-600 font-bold uppercase tracking-widest">Lvl {item.entry.defaultMinLevel}</span>
                                    </div>
                                </div>
                                <ArrowRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpecializationLibrarySidebar;
