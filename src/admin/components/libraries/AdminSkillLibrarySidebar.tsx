import React from 'react';
import { RulesData } from '../../../types/rules';
import { LibrarySkillEntry } from '../../../types';
import { BookOpen, Archive, GripVertical, ArrowRight, Layers, CheckCircle2 } from 'lucide-react';

interface AdminSkillLibrarySidebarProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
    draggedItem: { type: 'admin_sheet_skill' | 'admin_lib_skill', category?: string, index?: number, name?: string, data?: any } | null;
    setDraggedItem: (item: any) => void;
}

const AdminSkillLibrarySidebar: React.FC<AdminSkillLibrarySidebarProps> = ({ rules, onUpdate, draggedItem, setDraggedItem }) => {

    const handleDragStart = (e: React.DragEvent, type: 'admin_lib_skill', dataPayload: any) => {
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
        if (draggedItem.type === 'admin_sheet_skill') {
            const category = draggedItem.category!;
            const index = draggedItem.index!;
            const skillName = draggedItem.name!;

            // 1. Remove from Definition
            const currentList = rules.definitions.skills[category] || [];
            const newList = [...currentList];
            newList.splice(index, 1);

            const newDefinitions = {
                ...rules.definitions,
                skills: {
                    ...rules.definitions.skills,
                    [category]: newList
                }
            };

            // 2. Add to Library (if not exists)
            // Check duplicate name first to be safe
            const existingInLib = (rules.libraries.skills || []).find(l => l.name === skillName);
            let newLib = [...(rules.libraries.skills || [])];

            if (!existingInLib && skillName.trim() !== '') {
                const newLibEntry: LibrarySkillEntry = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: skillName,
                    description: '',
                    defaultCategory: category
                };
                newLib.push(newLibEntry);
            }

            // Sort Library
            newLib.sort((a, b) => a.name.localeCompare(b.name));

            onUpdate({
                ...rules,
                definitions: newDefinitions,
                libraries: {
                    ...rules.libraries,
                    skills: newLib
                }
            });
        }
        setDraggedItem(null);
    };

    // Filter out skills that are already present on the sheet
    const currentSkillNames = new Set<string>();
    Object.keys(rules.definitions.skills).forEach(cat => {
        rules.definitions.skills[cat].forEach(s => {
            if (s) currentSkillNames.add(s.trim().toLowerCase());
        });
    });

    const visibleLibrary = (rules.libraries.skills || []).filter(libItem =>
        libItem.isVariable || !currentSkillNames.has(libItem.name.trim().toLowerCase())
    );

    return (
        <div
            className={`w-80 shrink-0 sticky top-32 h-[calc(100vh-9rem)] bg-slate-100 border-l border-y border-gray-300 flex flex-col transition-colors rounded-l-md shadow-sm ${draggedItem?.type === 'admin_sheet_skill' ? 'bg-orange-50 border-orange-300' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDropOnLibrary}
        >
            <div className="p-4 bg-slate-200 border-b border-gray-300 font-bold text-slate-700 flex items-center gap-2 shadow-sm">
                <BookOpen size={18} />
                Réserve de Compétences
            </div>

            {draggedItem?.type === 'admin_sheet_skill' && (
                <div className="absolute inset-0 bg-orange-100/90 z-50 flex flex-col items-center justify-center border-4 border-dashed border-orange-400 m-2 rounded-xl pointer-events-none">
                    <Archive size={48} className="text-orange-600 mb-2" />
                    <span className="font-bold text-orange-800 text-lg">Archiver ici</span>
                    <span className="text-sm text-orange-700">Retirer de la fiche et garder en réserve</span>
                </div>
            )}

            <div className="p-3 text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                Glissez des compétences ici vers une catégorie pour les ajouter aux règles.
            </div>

            <div className="flex-grow overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {visibleLibrary.length === 0 ? (
                    <div className="text-center text-slate-400 italic mt-10 px-4">
                        {(rules.libraries.skills || []).length > 0
                            ? "Toutes les compétences de la réserve sont déjà utilisées."
                            : "La réserve est vide."}
                    </div>
                ) : (
                    visibleLibrary.map(item => {
                        const isPresent = currentSkillNames.has(item.name.trim().toLowerCase());

                        return (
                            <div
                                key={item.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'admin_lib_skill', { name: item.name, data: item })}
                                className={`p-2 rounded border shadow-sm cursor-grab active:cursor-grabbing transition-all flex justify-between items-center group ${isPresent
                                    ? 'bg-green-50/30 border-green-200/60 hover:border-green-400'
                                    : 'bg-white border-gray-300 hover:border-purple-400 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <GripVertical size={14} className="text-gray-300 shrink-0" />
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`font-bold text-sm truncate ${isPresent ? 'text-green-800' : 'text-slate-700'}`}>
                                                {item.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {item.isVariable && (
                                                <div className="flex items-center gap-0.5 text-[10px] text-blue-600 bg-blue-50 px-1 rounded-sm border border-blue-100">
                                                    <Layers size={10} />
                                                    <span className="font-semibold" title="Compétence à variations">Variable</span>
                                                </div>
                                            )}
                                            {isPresent && (
                                                <div className="flex items-center gap-0.5 text-[10px] text-green-700 bg-green-50 px-1 rounded-sm border border-green-100">
                                                    <CheckCircle2 size={10} />
                                                    <span className="font-semibold">Présent</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 shrink-0 mx-1" />
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default AdminSkillLibrarySidebar;
