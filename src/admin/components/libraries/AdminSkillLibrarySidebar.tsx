// COMPLEX COMPONENT: VERIFY RETURNS CAREFULLY
import React from 'react';
import { RulesData } from '../../../types/rules';
import { LibrarySkillEntry } from '../../../types';
import { BookOpen, Archive, GripVertical, ArrowRight, Layers, Tag, Sparkles, Edit2, Save, AlertOctagon, GraduationCap, X, RotateCcw, PencilLine } from 'lucide-react';
import { disambiguateCategories } from '../../../utils/categoryUtils';
import { DragItem } from '../AdminSkillsEditor';
import { useAdminSkillLibrary } from '../../../hooks/admin/useAdminSkillLibrary';
import ThematicModal from '../../../components/ui/ThematicModal';

interface AdminSkillLibrarySidebarProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
    draggedItem: DragItem | null;
    setDraggedItem: (item: DragItem | null) => void;
}

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
                        return (
                            <div
                                key={item.id}
                                className="bg-stone-900 border border-stone-700/60 rounded-sm shadow-sm overflow-hidden hover:border-amber-500/30 transition-colors group/card"
                            >
                                <div
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, 'admin_lib_skill', { name: item.name, data: item })}
                                    className="p-2 cursor-grab active:cursor-grabbing transition-all flex justify-between items-center group/item hover:bg-stone-800"
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
                                                {item.isCustomized && (
                                                    <div title="Cette compétence possède une surcharge pour cette campagne">
                                                        <PencilLine size={10} className="text-cyan-500 shrink-0" />
                                                    </div>
                                                )}
                                                {item.isVariable && (
                                                    <div className="flex items-center gap-0.5 text-[9px] text-amber-500 bg-amber-950/30 px-1 rounded-sm border border-amber-500/20" title="Compétence à variantes">
                                                        <Layers size={10} />
                                                    </div>
                                                )}
                                                {item.mysticAbilityId && (
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
                                                {item.isCustomized && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleReset(item.id); }}
                                                        className="p-1 text-stone-500 hover:text-amber-500 hover:bg-stone-700/50 rounded transition-all opacity-0 group-hover/card:opacity-100"
                                                        title="Réinitialiser aux valeurs d'origine"
                                                    >
                                                        <RotateCcw size={12} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
                                                    className="p-1 text-stone-500 hover:text-amber-500 hover:bg-stone-700/50 rounded transition-all opacity-0 group-hover/card:opacity-100"
                                                    title="Personnaliser pour cette campagne"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                            </>
                                        )}
                                        <ArrowRight size={14} className="text-stone-600 opacity-0 group-hover:opacity-100 shrink-0 mx-1 transition-all group-hover:translate-x-1 group-hover:text-amber-500" />
                                    </div>
                                </div>

                                {/* Local Category Picker */}
                                <div className="px-2 pb-2 bg-stone-950/30 flex items-center justify-between border-t border-stone-800 pt-1">
                                    {editingCategory === item.id ? (
                                        <select
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

            {isModalOpen && editingSkill && (
                <ThematicModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Personnalisation Campagne"
                    icon={<GraduationCap size={20} />}
                    size={showCategoryHelp ? 'lg' : 'md'}
                    footer={
                        <>
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-stone-400 hover:text-stone-200 font-bold hover:bg-stone-800 rounded">Annuler</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-amber-600 text-stone-900 rounded font-bold shadow hover:bg-amber-500 flex items-center gap-2">
                                <Save size={16} /> Enregistrer
                            </button>
                        </>
                    }
                >
                    <div className="flex flex-col gap-5 py-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-4 text-stone-300">
                                <div>
                                    <label htmlFor="skill-name" className="block text-xs font-bold text-stone-500 uppercase mb-1">Nom</label>
                                    <input
                                        id="skill-name"
                                        className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 font-bold focus:border-amber-500 outline-none text-stone-100"
                                        value={editingSkill.name}
                                        onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                                    />
                                </div>
                                <div className="bg-amber-950/20 border border-amber-500/20 rounded p-3 flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="isVariableSkill"
                                        className="w-4 h-4 text-amber-600 rounded bg-stone-900 border-stone-700 cursor-pointer"
                                        checked={editingSkill.isVariable || false}
                                        onChange={(e) => setEditingSkill({ ...editingSkill, isVariable: e.target.checked })}
                                    />
                                    <label htmlFor="isVariableSkill" className="cursor-pointer select-none">
                                        <span className="block text-sm font-bold text-amber-500 leading-tight">Variantes requises</span>
                                        <span className="block text-[10px] text-amber-700/70 leading-tight italic">Ex: "Artisanat : Forge"</span>
                                    </label>
                                </div>

                                <div className={`bg-stone-900/50 border border-stone-700 rounded p-3 flex flex-col gap-2 transition-all ${editingSkill.mysticAbilityId ? 'ring-1 ring-amber-500/30 border-amber-500/30' : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="isMysticAbility"
                                            className="w-4 h-4 text-amber-600 rounded bg-stone-900 border-stone-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            checked={!!editingSkill.mysticAbilityId}
                                            disabled={!rules.libraries.mysticAbilities?.length}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    const firstId = rules.libraries.mysticAbilities?.[0]?.id || '';
                                                    if (firstId) {
                                                        setEditingSkill({ ...editingSkill, mysticAbilityId: firstId });
                                                    }
                                                } else {
                                                    const { mysticAbilityId: maId, ...rest } = editingSkill;
                                                    setEditingSkill(rest);
                                                }
                                            }}
                                        />
                                        <label htmlFor="isMysticAbility" className="cursor-pointer select-none">
                                            <span className="block text-sm font-bold text-stone-200 leading-tight flex items-center gap-1.5">
                                                Lien Mystique <Sparkles size={12} className="text-amber-500" />
                                            </span>
                                            <span className="block text-[10px] text-stone-500 leading-tight">Lier à une habilité magique/martiale</span>
                                        </label>
                                    </div>
                                    {editingSkill.mysticAbilityId !== undefined && rules.libraries.mysticAbilities && rules.libraries.mysticAbilities.length > 0 && (
                                        <select
                                            className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1 text-xs focus:border-amber-500 outline-none text-amber-500 font-bold"
                                            value={editingSkill.mysticAbilityId || ""}
                                            onChange={(e) => setEditingSkill({ ...editingSkill, mysticAbilityId: e.target.value })}
                                        >
                                            <option value="">-- Choisir une habilité --</option>
                                            {rules.libraries.mysticAbilities?.map(ma => (
                                                <option key={ma.id} value={ma.id}>{ma.name}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {editingSkill.isVariable && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                        <label htmlFor="skill-variants" className="block text-xs font-bold text-stone-500 uppercase mb-1">Suggestions de variantes</label>
                                        <input
                                            id="skill-variants"
                                            className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:border-amber-500 outline-none text-stone-200"
                                            placeholder="Forge, Menuiserie, Peinture..."
                                            value={variantDraft}
                                            onChange={(e) => setVariantDraft(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <label htmlFor="skill-description" className="block text-xs font-bold text-stone-500 uppercase mb-1">Description</label>
                                <textarea
                                    id="skill-description"
                                    className="w-full flex-grow bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:border-amber-500 outline-none resize-none min-h-[120px] text-stone-300"
                                    value={editingSkill.description || ''}
                                    onChange={(e) => setEditingSkill({ ...editingSkill, description: e.target.value })}
                                    placeholder="Description de la compétence..."
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-950/30 text-red-400 text-xs p-3 rounded border border-red-900/50 font-bold flex items-center gap-2">
                                <AlertOctagon size={16} /> {error}
                            </div>
                        )}
                    </div>

                    {showCategoryHelp && (
                        <div className="w-full lg:w-72 shrink-0 animate-in slide-in-from-right-4 duration-300 bg-stone-900 p-4 rounded border border-stone-800 shadow-xl">
                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-stone-800">
                                <h4 className="font-bold text-amber-500 text-xs uppercase tracking-wider">Codes Catégories</h4>
                                <button onClick={() => setShowCategoryHelp(false)} className="text-stone-500 hover:text-stone-300"><X size={14} /></button>
                            </div>
                            <div className="space-y-2 text-[10px] custom-scrollbar max-h-60 overflow-y-auto">
                                {modalCategories.map(cat => (
                                    <div key={cat.code} className="grid grid-cols-[60px_1fr] gap-2 items-start border-b border-stone-800/50 pb-1">
                                        <code className="bg-stone-950 px-1 rounded font-mono text-amber-500/70 border border-amber-500/10 text-[9px] truncate">{cat.code}</code>
                                        <span className="text-stone-400 font-medium">{cat.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </ThematicModal>
            )}
        </div>
    );
};

export default AdminSkillLibrarySidebar;
