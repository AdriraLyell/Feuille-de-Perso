// COMPLEX COMPONENT: VERIFY RETURNS CAREFULLY
import React from 'react';
import { RulesData } from '../../../types/rules';
import { LibrarySkillEntry, LibraryBackgroundEntry, LibraryCounterEntry } from '../../../types';
import { BookOpen, Archive, GripVertical, ArrowRight, Layers, Tag, Sparkles, Edit2, RotateCcw, PencilLine } from 'lucide-react';
import { disambiguateCategories } from '../../../utils/categoryUtils';
import { DragItem } from '../AdminSkillsEditor';
import { useAdminSkillLibrary } from '../../../hooks/admin/useAdminSkillLibrary';

// Nouveaux composants extraits
import { SkillLibraryTabs } from './SkillLibraryTabs';
import { SkillCustomizationModal } from './SkillCustomizationModal';

interface AdminSkillLibrarySidebarProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
    draggedItem: DragItem | null;
    setDraggedItem: (item: DragItem | null) => void;
}

type LibraryItem = LibrarySkillEntry | LibraryBackgroundEntry | LibraryCounterEntry;

const AdminSkillLibrarySidebar: React.FC<AdminSkillLibrarySidebarProps> = ({ rules, onUpdate, draggedItem, setDraggedItem }) => {
    const {
        isModalOpen, setIsModalOpen,
        editingSkill,
        variantDraft, setVariantDraft,
        error,
        handleOpenEdit,
        handleSave,
        handleReset,
        showCategoryHelp, setShowCategoryHelp,
        availableCategories: modalCategories,
        setEditingSkill
    } = useAdminSkillLibrary(rules, onUpdate, {}, 'override');

    const [activeTab, setActiveTab] = React.useState<'skills' | 'backgrounds' | 'counters'>('skills');
    const [editingCategory, setEditingCategory] = React.useState<string | null>(null);

    const availableCategories = React.useMemo(() => {
        return disambiguateCategories(rules.definitions.skillCategories || []);
    }, [rules.definitions.skillCategories]);

    const handleDragStart = (e: React.DragEvent, type: 'admin_lib_skill', dataPayload: Partial<DragItem>) => {
        const item: DragItem = { type, ...dataPayload };
        setDraggedItem(item);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("application/json", JSON.stringify(item));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDropOnLibrary = (e: React.DragEvent) => {
        e.preventDefault();
        if (!draggedItem) return;

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
            const newLib = [...(rules.libraries.skills || [])];

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
        const currentNames = new Set<string>();
        Object.keys(rules.definitions.skills).forEach(cat => {
            rules.definitions.skills[cat].forEach(s => {
                if (s) currentNames.add(s.trim().toLowerCase());
            });
        });

        if (activeTab === 'skills') {
            return (rules.libraries.skills || []).filter(libItem =>
                libItem.isActive !== false && (libItem.isVariable || !currentNames.has(libItem.name.trim().toLowerCase()))
            );
        }
        if (activeTab === 'backgrounds') {
            return (rules.libraries.backgrounds || []).filter(b =>
                b.isActive !== false && !currentNames.has(b.name.trim().toLowerCase())
            );
        }
        if (activeTab === 'counters') {
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
            role="region"
            aria-label="Réserve de bibliothèques"
        >
            <div className="bg-stone-900 border-b border-stone-800 shadow-sm">
                <div className="p-3 font-bold text-stone-300 flex items-center gap-2 uppercase tracking-wider text-xs">
                    <BookOpen size={16} className="text-amber-500" />
                    Réserve
                </div>
                <SkillLibraryTabs activeTab={activeTab} setActiveTab={setActiveTab} />
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
                    visibleLibrary.map((item: LibraryItem) => (
                        <div
                            key={item.id}
                            className="bg-stone-900 border border-stone-700/60 rounded-sm shadow-sm overflow-hidden hover:border-amber-500/30 transition-colors group/card"
                        >
                            <button
                                type="button"
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'admin_lib_skill', { name: item.name, data: item })}
                                className="w-full p-2 cursor-grab active:cursor-grabbing transition-all flex justify-between items-center group/item hover:bg-stone-800 text-left outline-none focus:bg-stone-800"
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <GripVertical size={14} className="text-stone-600 shrink-0 group-hover:text-stone-400 transition-colors" />
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-bold text-xs truncate text-stone-300 group-hover:text-amber-500 transition-colors font-serif tracking-wide">
                                                {item.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {(item as LibrarySkillEntry).isCustomized && (
                                                <div title="Cette compétence possède une surcharge pour cette campagne">
                                                    <PencilLine size={10} className="text-cyan-500 shrink-0" />
                                                </div>
                                            )}
                                            {(item as LibrarySkillEntry).isVariable && (
                                                <div className="flex items-center gap-0.5 text-[9px] text-amber-500 bg-amber-950/30 px-1 rounded-sm border border-amber-500/20" title="Compétence à variantes">
                                                    <Layers size={10} />
                                                </div>
                                            )}
                                            {(item as LibrarySkillEntry).mysticAbilityId && (
                                                <div className="flex items-center gap-0.5 text-[9px] text-amber-500 bg-amber-950/30 px-1 rounded-sm border border-amber-500/20" title="Compétence Mystique">
                                                    <Sparkles size={10} />
                                                </div>
                                            )}
                                            {item.isActive === false && (
                                                <div className="text-[9px] text-crimson-blood font-bold px-1 rounded-sm border border-crimson-blood/20 bg-crimson-blood/10">Inactif</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {activeTab === 'skills' && (
                                        <>
                                            {(item as LibrarySkillEntry).isCustomized && (
                                                <div
                                                    onClick={(e) => { e.stopPropagation(); handleReset(item.id); }}
                                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleReset(item.id); } }}
                                                    role="button"
                                                    tabIndex={0}
                                                    className="p-1 text-stone-500 hover:text-amber-500 hover:bg-stone-700/50 rounded transition-all opacity-0 group-hover/card:opacity-100"
                                                    title="Réinitialiser aux valeurs d'origine"
                                                >
                                                    <RotateCcw size={12} />
                                                </div>
                                            )}
                                            <div
                                                onClick={(e) => { e.stopPropagation(); handleOpenEdit(item as LibrarySkillEntry); }}
                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleOpenEdit(item as LibrarySkillEntry); } }}
                                                role="button"
                                                tabIndex={0}
                                                className="p-1 text-stone-500 hover:text-amber-500 hover:bg-stone-700/50 rounded transition-all opacity-0 group-hover/card:opacity-100"
                                                title="Personnaliser pour cette campagne"
                                            >
                                                <Edit2 size={12} />
                                            </div>
                                        </>
                                    )}
                                    <ArrowRight size={14} className="text-stone-600 opacity-0 group-hover:opacity-100 shrink-0 mx-1 transition-all group-hover:translate-x-1 group-hover:text-amber-500" />
                                </div>
                            </button>

                            {/* Local Category Picker */}
                            <div className="px-2 pb-2 bg-stone-950/30 flex items-center justify-between border-t border-stone-800 pt-1">
                                {editingCategory === item.id ? (
                                    <select
                                        className="text-[10px] bg-stone-950 border border-stone-700 rounded-sm px-1 py-0.5 w-full outline-none focus:border-amber-500 text-stone-300"
                                        value={item.defaultCategory || ''}
                                        onChange={(e) => {
                                            const cat = e.target.value;
                                            const key = activeTab === 'skills' ? 'skills' : activeTab === 'backgrounds' ? 'backgrounds' : 'counters';
                                            const list = rules.libraries[key] as LibraryItem[];
                                            const newList = list.map((libItem: LibraryItem) =>
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
                    ))
                )}
            </div>

            <SkillCustomizationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                editingSkill={editingSkill}
                setEditingSkill={setEditingSkill}
                variantDraft={variantDraft}
                setVariantDraft={setVariantDraft}
                handleSave={handleSave}
                error={error}
                showCategoryHelp={showCategoryHelp}
                setShowCategoryHelp={setShowCategoryHelp}
                availableCategories={modalCategories}
                rules={rules}
            />
        </div>
    );
};

export default AdminSkillLibrarySidebar;
