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
    const [activeTab, setActiveTab] = React.useState<'skills' | 'backgrounds' | 'counters'>('skills');

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
        // ... (Keep existing logic for archiving skills, it only applies to Skills tab effectively)
        e.preventDefault();
        if (!draggedItem) return;

        // Only accept sheet skills for now (Archiving)
        // We only archive to the SKILLS library. 
        // Archiving Backgrounds from sheet is not yet supported/requested (Sheet doesn't have drag source for backgrounds yet).

        if (draggedItem.type === 'admin_sheet_skill' && activeTab === 'skills') {
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

    // --- Filter Logic ---
    const getVisibleItems = () => {
        if (activeTab === 'skills') {
            const currentSkillNames = new Set<string>();
            Object.keys(rules.definitions.skills).forEach(cat => {
                rules.definitions.skills[cat].forEach(s => {
                    if (s) currentSkillNames.add(s.trim().toLowerCase());
                });
            });
            return (rules.libraries.skills || []).filter(libItem =>
                (libItem.isVariable || !currentSkillNames.has(libItem.name.trim().toLowerCase()))
            );
        }
        if (activeTab === 'backgrounds') {
            // Check if already placed? 
            // Backgrounds are placed in definitions.skills too (mixed).
            // So we check against the SAME set of names.
            const currentNames = new Set<string>();
            Object.keys(rules.definitions.skills).forEach(cat => {
                rules.definitions.skills[cat].forEach(s => {
                    if (s) currentNames.add(s.trim().toLowerCase());
                });
            });
            return (rules.libraries.backgrounds || []).filter(b =>
                !currentNames.has(b.name.trim().toLowerCase())
            );
        }
        if (activeTab === 'counters') {
            const currentNames = new Set<string>();
            Object.keys(rules.definitions.skills).forEach(cat => {
                rules.definitions.skills[cat].forEach(s => {
                    if (s) currentNames.add(s.trim().toLowerCase());
                });
            });
            // We also check defining counters directly in definitions.counters?
            // Actually user wants to place them in SKILL SLOTS for layout.
            return (rules.libraries.counters || []).filter(c =>
                !currentNames.has(c.name.trim().toLowerCase())
            );
        }
        return [];
    };

    const visibleLibrary = getVisibleItems();

    return (
        <div
            className={`w-80 shrink-0 sticky top-32 h-[calc(100vh-9rem)] bg-slate-100 border-l border-y border-gray-300 flex flex-col transition-colors rounded-l-md shadow-sm ${draggedItem?.type === 'admin_sheet_skill' ? 'bg-orange-50 border-orange-300' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDropOnLibrary}
        >
            <div className="bg-slate-200 border-b border-gray-300 shadow-sm">
                <div className="p-3 font-bold text-slate-700 flex items-center gap-2">
                    <BookOpen size={18} />
                    Réserve
                </div>
                {/* TABS */}
                <div className="flex text-xs font-bold text-slate-600">
                    <button
                        onClick={() => setActiveTab('skills')}
                        className={`flex-1 py-2 text-center border-b-2 transition-colors ${activeTab === 'skills' ? 'border-blue-600 text-blue-700 bg-white' : 'border-transparent hover:bg-slate-300/50'}`}
                    >
                        Compétences
                    </button>
                    <button
                        onClick={() => setActiveTab('backgrounds')}
                        className={`flex-1 py-2 text-center border-b-2 transition-colors ${activeTab === 'backgrounds' ? 'border-purple-600 text-purple-700 bg-white' : 'border-transparent hover:bg-slate-300/50'}`}
                    >
                        Arr. Plans
                    </button>
                    <button
                        onClick={() => setActiveTab('counters')}
                        className={`flex-1 py-2 text-center border-b-2 transition-colors ${activeTab === 'counters' ? 'border-red-600 text-red-700 bg-white' : 'border-transparent hover:bg-slate-300/50'}`}
                    >
                        Compteurs
                    </button>
                </div>
            </div>

            {draggedItem?.type === 'admin_sheet_skill' && activeTab === 'skills' && (
                <div className="absolute inset-0 bg-orange-100/90 z-50 flex flex-col items-center justify-center border-4 border-dashed border-orange-400 m-2 rounded-xl pointer-events-none">
                    <Archive size={48} className="text-orange-600 mb-2" />
                    <span className="font-bold text-orange-800 text-lg">Archiver ici</span>
                </div>
            )}

            <div className="p-3 text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                {activeTab === 'skills' && "Glissez vers une catégorie."}
                {activeTab === 'backgrounds' && "Glissez un Historique vers la fiche."}
                {activeTab === 'counters' && "Glissez un Compteur vers la fiche."}
            </div>

            <div className="flex-grow overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {visibleLibrary.length === 0 ? (
                    <div className="text-center text-slate-400 italic mt-10 px-4">
                        La réserve est vide.
                    </div>
                ) : (
                    visibleLibrary.map((item: any) => {
                        // We stick to 'admin_lib_skill' type so the Editor accepts it.
                        // Checks for duplicates
                        // Re-calculate presence for display logic
                        const isPresent = false; // Filter logic currently hides present items so this is always false (except variables)

                        return (
                            <div
                                key={item.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'admin_lib_skill', { name: item.name, data: item })}
                                className={`p-2 rounded border shadow-sm cursor-grab active:cursor-grabbing transition-all flex justify-between items-center group bg-white border-gray-300 hover:border-purple-400 hover:shadow-md`}
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <GripVertical size={14} className="text-gray-300 shrink-0" />
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`font-bold text-sm truncate text-slate-700`}>
                                                {item.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {item.isVariable && (
                                                <div className="flex items-center gap-0.5 text-[10px] text-blue-600 bg-blue-50 px-1 rounded-sm border border-blue-100">
                                                    <Layers size={10} />
                                                    <span className="font-semibold" title="Variable">Var</span>
                                                </div>
                                            )}
                                            {item.isActive === false && (
                                                <div className="text-[9px] text-red-500 font-bold px-1 rounded-sm border border-red-100 bg-red-50">Inactif</div>
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
