
import React from 'react';
import { CharacterSheetData, LibrarySkillEntry, SkillCategoryKey } from '../../types';
import { BookOpen, Archive, GripVertical, ArrowRight } from 'lucide-react';

interface LibrarySidebarProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings') => void;
    draggedItem: { type: 'sheet_skill' | 'lib_skill', category?: string, index?: number, id?: string, data?: any } | null;
    setDraggedItem: (item: any) => void;
}

const LibrarySidebar: React.FC<LibrarySidebarProps> = ({ data, onUpdate, onAddLog, draggedItem, setDraggedItem }) => {

    const handleDragStart = (e: React.DragEvent, type: 'lib_skill', dataPayload: any) => {
        setDraggedItem({ type, ...dataPayload });
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("application/json", JSON.stringify({ type, ...dataPayload }));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDropOnLibrary = (e: React.DragEvent) => {
        e.preventDefault();
        if (!draggedItem) return;

        // Only accept items from sheet (archiving)
        if (draggedItem.type === 'sheet_skill' && draggedItem.category !== 'counters') {
            const catKey = draggedItem.category as SkillCategoryKey;
            const index = draggedItem.index!;
            
            const newSkills = { ...data.skills };
            const list = [...(newSkills[catKey] || [])];
            const [removedItem] = list.splice(index, 1);
            newSkills[catKey] = list;

            // Add to Library
            // Check duplicate name first to be safe
            const existingInLib = (data.skillLibrary || []).find(l => l.name === removedItem.name);
            let newLib = [...(data.skillLibrary || [])];
            
            if (!existingInLib && removedItem.name.trim() !== '') {
                const newLibEntry: LibrarySkillEntry = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: removedItem.name,
                    description: '',
                    defaultCategory: catKey
                };
                newLib.push(newLibEntry);
                onAddLog(`Archivage : "${removedItem.name}" déplacé vers la réserve`, 'info', 'settings');
            } else {
                onAddLog(`Suppression : "${removedItem.name}" retiré de la fiche`, 'info', 'settings');
            }

            // Sort Library Alphabetically
            newLib.sort((a, b) => a.name.localeCompare(b.name));

            onUpdate({
                ...data,
                skills: newSkills,
                skillLibrary: newLib
            });
        }
        setDraggedItem(null);
    };

    // Filter out skills that are already present on the sheet to avoid duplication clutter
    const currentSkillNames = new Set<string>();
    Object.keys(data.skills).forEach(cat => {
        // @ts-ignore
        data.skills[cat].forEach(s => {
            if(s.name) currentSkillNames.add(s.name.trim().toLowerCase());
        });
    });

    const visibleLibrary = (data.skillLibrary || []).filter(libItem => 
        !currentSkillNames.has(libItem.name.trim().toLowerCase())
    );

    return (
        <div 
          className={`w-80 bg-slate-100 border-l border-gray-300 flex flex-col fixed right-0 top-14 bottom-0 z-30 transition-colors ${draggedItem?.type === 'sheet_skill' ? 'bg-orange-50 border-orange-300' : ''}`}
          onDragOver={handleDragOver}
          onDrop={handleDropOnLibrary}
        >
            <div className="p-4 bg-slate-200 border-b border-gray-300 font-bold text-slate-700 flex items-center gap-2 shadow-sm">
                <BookOpen size={18} />
                Réserve de Compétences
            </div>
            
            {draggedItem?.type === 'sheet_skill' && draggedItem.category !== 'counters' && (
                <div className="absolute inset-0 bg-orange-100/90 z-50 flex flex-col items-center justify-center border-4 border-dashed border-orange-400 m-2 rounded-xl pointer-events-none">
                    <Archive size={48} className="text-orange-600 mb-2" />
                    <span className="font-bold text-orange-800 text-lg">Archiver ici</span>
                    <span className="text-sm text-orange-700">Retirer de la fiche et garder en réserve</span>
                </div>
            )}

            <div className="p-3 text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                Glissez des compétences ici vers la fiche pour les ajouter. 
                Glissez une compétence de la fiche ici pour la ranger.
            </div>

            <div className="flex-grow overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {visibleLibrary.length === 0 ? (
                    <div className="text-center text-slate-400 italic mt-10 px-4">
                        {(data.skillLibrary || []).length > 0 
                          ? "Toutes les compétences de la réserve sont déjà sur la fiche."
                          : "La réserve est vide."}
                    </div>
                ) : (
                    visibleLibrary.map(item => (
                        <div 
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, 'lib_skill', { data: item })}
                          className="bg-white p-2 rounded border border-gray-300 shadow-sm cursor-grab active:cursor-grabbing hover:border-purple-400 hover:shadow-md transition-all flex justify-between items-center group"
                        >
                            <div className="flex items-center gap-2">
                                <GripVertical size={14} className="text-gray-300" />
                                <span className="font-bold text-sm text-slate-700">{item.name}</span>
                            </div>
                            <ArrowRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100" />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LibrarySidebar;
