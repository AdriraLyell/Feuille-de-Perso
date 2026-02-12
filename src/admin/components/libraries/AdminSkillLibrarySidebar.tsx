// COMPLEX COMPONENT: VERIFY RETURNS CAREFULLY
import React from 'react';
import { RulesData } from '../../../types/rules';
import { LibrarySkillEntry } from '../../../types';
import { BookOpen, Archive, GripVertical, ArrowRight, Layers, Tag } from 'lucide-react';
import { disambiguateCategories } from '../../../utils/categoryUtils';

interface AdminSkillLibrarySidebarProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
    draggedItem: { type: 'admin_sheet_skill' | 'admin_lib_skill', category?: string, index?: number, name?: string, data?: any } | null;
    setDraggedItem: (item: any) => void;
}

const AdminSkillLibrarySidebar: React.FC<AdminSkillLibrarySidebarProps> = ({ rules, onUpdate, draggedItem, setDraggedItem }) => {
    const [activeTab, setActiveTab] = React.useState<'skills' | 'backgrounds' | 'counters'>('skills');
    const [editingCategory, setEditingCategory] = React.useState<string | null>(null);

    const availableCategories = React.useMemo(() => {
        return disambiguateCategories(rules.definitions.skillCategories || []);
    }, [rules.definitions.skillCategories]);

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
                    id: crypto.randomUUID(),
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
                libItem.isActive !== false && (libItem.isVariable || !currentSkillNames.has(libItem.name.trim().toLowerCase()))
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
                b.isActive !== false && !currentNames.has(b.name.trim().toLowerCase())
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
                c.isActive !== false && !currentNames.has(c.name.trim().toLowerCase())
            );
        }
        return [];
    };

    const visibleLibrary = getVisibleItems();

    return (
        <div
            className={`w-80 shrink-0 sticky top-32 h-[calc(100vh-9rem)] bg-stone-950/80 border-l border-y border-stone-800 flex flex-col transition-colors rounded-l-md shadow-glass ${draggedItem?.type === 'admin_sheet_skill' ? 'bg-amber-950/20 border-amber-500/30' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDropOnLibrary}
        >
            <div className="bg-stone-900 border-b border-stone-800 shadow-sm">
                <div className="p-3 font-bold text-stone-300 flex items-center gap-2 uppercase tracking-wider text-xs">
                    <BookOpen size={16} className="text-amber-500" />
                    Réserve
                </div>
                {/* TABS */}
                <div className="flex text-[10px] font-bold text-stone-500 uppercase tracking-wide">
                    <button
                        onClick={() => setActiveTab('skills')}
                        className={`flex-1 py-2 text-center border-b-2 transition-colors ${activeTab === 'skills' ? 'border-amber-500 text-amber-500 bg-stone-950' : 'border-transparent hover:bg-stone-800/50 hover:text-stone-300'}`}
                    >
                        Compétences
                    </button>
                    <button
                        onClick={() => setActiveTab('backgrounds')}
                        className={`flex-1 py-2 text-center border-b-2 transition-colors ${activeTab === 'backgrounds' ? 'border-amber-500 text-amber-500 bg-stone-950' : 'border-transparent hover:bg-stone-800/50 hover:text-stone-300'}`}
                    >
                        Arr. Plans
                    </button>
                    <button
                        onClick={() => setActiveTab('counters')}
                        className={`flex-1 py-2 text-center border-b-2 transition-colors ${activeTab === 'counters' ? 'border-amber-500 text-amber-500 bg-stone-950' : 'border-transparent hover:bg-stone-800/50 hover:text-stone-300'}`}
                    >
                        Compteurs
                    </button>
                </div>
            </div>

            {draggedItem?.type === 'admin_sheet_skill' && activeTab === 'skills' && (
                <div className="absolute inset-0 bg-stone-950/90 z-50 flex flex-col items-center justify-center border-4 border-dashed border-amber-500/50 m-2 rounded-sm pointer-events-none backdrop-blur-sm">
                    <Archive size={48} className="text-amber-500 mb-2 drop-shadow-glow" />
                    <span className="font-bold text-amber-500 text-lg font-serif tracking-widest uppercase">Archiver ici</span>
                </div>
            )}

            <div className="p-3 text-[10px] text-stone-500 border-b border-stone-800 bg-stone-950 italic font-medium">
                {activeTab === 'skills' && "Glissez vers une catégorie."}
                {activeTab === 'backgrounds' && "Glissez un Historique vers la fiche."}
                {activeTab === 'counters' && "Glissez un Compteur vers la fiche."}
            </div>

            <div className="flex-grow overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {visibleLibrary.length === 0 ? (
                    <div className="text-center text-stone-600 italic mt-10 px-4 text-xs">
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
                                className="bg-stone-900 border border-stone-700/60 rounded-sm shadow-sm overflow-hidden hover:border-amber-500/30 transition-colors group/card"
                            >
                                <div
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, 'admin_lib_skill', { name: item.name, data: item })}
                                    className={`p-2 cursor-grab active:cursor-grabbing transition-all flex justify-between items-center group hover:bg-stone-800`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <GripVertical size={14} className="text-stone-600 shrink-0 group-hover:text-stone-400 transition-colors" />
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`font-bold text-xs truncate text-stone-300 group-hover:text-amber-500 transition-colors font-serif tracking-wide`}>
                                                    {item.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {item.isVariable && (
                                                    <div className="flex items-center gap-0.5 text-[9px] text-amber-500 bg-amber-950/30 px-1 rounded-sm border border-amber-500/20">
                                                        <Layers size={10} />
                                                        <span className="font-bold tracking-tighter" title="Variable">VAR</span>
                                                    </div>
                                                )}
                                                {item.isActive === false && (
                                                    <div className="text-[9px] text-crimson-blood font-bold px-1 rounded-sm border border-crimson-blood/20 bg-crimson-blood/10">Inactif</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight size={14} className="text-stone-600 opacity-0 group-hover:opacity-100 shrink-0 mx-1 transition-all group-hover:translate-x-1 group-hover:text-amber-500" />
                                </div>

                                {/* Local Category Picker */}
                                <div className="px-2 pb-2 bg-stone-950/30 flex items-center justify-between border-t border-stone-800 pt-1">
                                    {editingCategory === item.id ? (
                                        <select
                                            autoFocus
                                            className="text-[10px] bg-stone-950 border border-stone-700 rounded-sm px-1 py-0.5 w-full outline-none focus:border-amber-500 text-stone-300"
                                            value={item.defaultCategory || ''}
                                            onChange={(e) => {
                                                const cat = e.target.value;
                                                const key = activeTab === 'skills' ? 'skills' : activeTab === 'backgrounds' ? 'backgrounds' : 'counters';
                                                const newList = rules.libraries[key].map((libItem: any) =>
                                                    libItem.id === item.id ? { ...libItem, defaultCategory: cat } : libItem
                                                );
                                                onUpdate({
                                                    ...rules,
                                                    libraries: {
                                                        ...rules.libraries,
                                                        [key]: newList
                                                    }
                                                });
                                                setEditingCategory(null);
                                            }}
                                            onBlur={() => setEditingCategory(null)}
                                        >
                                            <option value="">(Aucune catégorie)</option>
                                            {availableCategories.map(c => (
                                                <option key={c.id} value={c.id}>{c.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <button
                                            onClick={() => setEditingCategory(item.id)}
                                            className="flex items-center gap-1 text-[10px] text-stone-500 hover:text-amber-500 font-medium truncate group/tag transition-colors w-full text-left"
                                        >
                                            <Tag size={10} className="shrink-0 text-stone-600 group-hover/tag:text-amber-500 transition-colors" />
                                            <span className="truncate">
                                                {item.defaultCategory ? (availableCategories.find(c => c.id === item.defaultCategory)?.label || item.defaultCategory) : "Définir catégorie..."}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default AdminSkillLibrarySidebar;
