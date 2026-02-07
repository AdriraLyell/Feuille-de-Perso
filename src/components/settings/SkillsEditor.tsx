
import React, { useState } from 'react';
import { CharacterSheetData, DotEntry, SkillCategoryKey, LibrarySkillEntry } from '../../types';
import { Minus, Plus, GripVertical, Trash2, Save, GraduationCap } from 'lucide-react';
import ThematicModal from '../ui/ThematicModal';
import { useRules } from '../../context/RulesContext';

interface SkillsEditorProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings') => void;
    draggedItem: { type: 'sheet_skill' | 'lib_skill', category?: string, index?: number, id?: string, data?: any } | null;
    setDraggedItem: (item: any) => void;
}

const SkillsEditor: React.FC<SkillsEditorProps> = ({ data, onUpdate, onAddLog, draggedItem, setDraggedItem }) => {
    const { rules } = useRules();
    const skillCategories = rules?.definitions?.skillCategories || [];

    const [focusedValue, setFocusedValue] = useState<string | null>(null);
    const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);

    // State for Variable Skill Modal
    const [variantModalOpen, setVariantModalOpen] = useState(false);
    const [pendingSkillDrop, setPendingSkillDrop] = useState<{
        libItem: LibrarySkillEntry;
        category: string;
        index: number;
    } | null>(null);
    const [variantInput, setVariantInput] = useState("");

    const getCategoryLabel = (catId: string) => {
        const found = skillCategories.find(c => c.id === catId);
        return found ? found.label : catId;
    };

    // --- CRUD LOGIC ---

    const updateSkillName = (category: SkillCategoryKey, id: string, newName: string) => {
        const list = data.skills[category];
        if (!list) return;

        onUpdate({
            ...data,
            skills: {
                ...data.skills,
                [category]: list.map(item => item.id === id ? { ...item, name: newName } : item)
            }
        });
    };

    const updateSkillVariant = (category: SkillCategoryKey, id: string, newVariant: string) => {
        const list = data.skills[category];
        if (!list) return;

        onUpdate({
            ...data,
            skills: {
                ...data.skills,
                [category]: list.map(item => item.id === id ? { ...item, variant: newVariant } : item)
            }
        });
    };

    const syncSkillWithLibrary = (name: string, category: SkillCategoryKey) => {
        if (name.trim() === '' || name === 'Nouvelle Compétence') return;

        const normName = name.trim().toLowerCase();
        let newLibrary = [...(data.skillLibrary || [])];
        const exists = newLibrary.some(l => l.name.trim().toLowerCase() === normName);

        if (!exists) {
            const newLibEntry: LibrarySkillEntry = {
                id: Math.random().toString(36).substr(2, 9),
                name: name.trim(),
                description: '',
                defaultCategory: category
            };
            newLibrary = [...newLibrary, newLibEntry].sort((a, b) => a.name.localeCompare(b.name));
            onUpdate({ ...data, skillLibrary: newLibrary });
        }
    };

    const removeSkill = (category: SkillCategoryKey, id: string) => {
        const list = data.skills[category];
        if (!list) return;

        const skillToRemove = list.find(s => s.id === id);
        if (!skillToRemove) return;

        const skillName = skillToRemove.name;

        // Return to library check
        const libList = data.skillLibrary || [];
        const existsInLib = libList.some(l => l.name.trim().toLowerCase() === skillName.trim().toLowerCase());

        let newLibrary = libList;

        if (!existsInLib && skillName.trim() !== '') {
            const newLibEntry: LibrarySkillEntry = {
                id: Math.random().toString(36).substr(2, 9),
                name: skillName,
                description: '',
                defaultCategory: category
            };
            newLibrary = [...libList, newLibEntry];
            newLibrary.sort((a, b) => a.name.localeCompare(b.name));
            onAddLog(`"${skillName}" retiré de la fiche et ajouté à la réserve`, 'info', 'settings');
        } else {
            onAddLog(`"${skillName}" retiré de la fiche (retourne en réserve)`, 'info', 'settings');
        }

        onUpdate({
            ...data,
            skillLibrary: newLibrary,
            skills: {
                ...data.skills,
                [category]: list.filter(item => item.id !== id)
            }
        });
    };

    const addSkill = (category: SkillCategoryKey, isSpacer = false, defaultName = 'Nouvelle Compétence') => {
        const list = data.skills[category] || [];
        const newId = Math.random().toString(36).substr(2, 9);
        const newSkill: DotEntry = {
            id: newId,
            name: isSpacer ? '' : defaultName,
            value: 0,
            creationValue: 0,
            max: 5
        };

        onUpdate({
            ...data,
            skills: {
                ...data.skills,
                [category]: [...list, newSkill]
            }
        });

        if (!isSpacer) {
            setNewlyAddedId(newId);
            onAddLog(`Ajout : Nouvelle compétence dans [${getCategoryLabel(category)}]`, 'success', 'settings');
        } else {
            onAddLog(`Ajout : Espaceur dans [${getCategoryLabel(category)}]`, 'info', 'settings');
        }
    };

    // --- COUNTER LOGIC ---

    const updateCounterName = (id: string, newName: string) => {
        const custom = data.counters.custom;
        if (!custom) return;

        onUpdate({
            ...data,
            counters: {
                ...data.counters,
                custom: custom.map(c => c.id === id ? { ...c, name: newName } : c)
            }
        });
    };

    const removeCounter = (id: string) => {
        const custom = data.counters.custom;
        if (!custom) return;

        const counterName = custom.find(c => c.id === id)?.name;
        onUpdate({
            ...data,
            counters: {
                ...data.counters,
                custom: custom.filter(c => c.id !== id)
            }
        });
        onAddLog(`Suppression Compteur : ${counterName}`, 'danger', 'settings');
    };

    const addCounter = (defaultName = 'Nouveau Compteur') => {
        const newId = Math.random().toString(36).substr(2, 9);
        const custom = data.counters.custom || [];
        const newCounter: DotEntry = {
            id: newId,
            name: defaultName,
            value: 0,
            creationValue: 0,
            max: 10
        };
        onUpdate({
            ...data,
            counters: {
                ...data.counters,
                custom: [...custom, newCounter]
            }
        });
        setNewlyAddedId(newId);
        onAddLog(`Ajout : Compteur personnalisé`, 'success', 'settings');
    };

    // --- DRAG & DROP LOGIC ---

    const handleDragStart = (e: React.DragEvent, type: 'sheet_skill' | 'lib_skill', dataPayload: any) => {
        setDraggedItem({ type, ...dataPayload });
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("application/json", JSON.stringify({ type, ...dataPayload }));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDropOnSheet = (e: React.DragEvent, targetCategory: string, targetIndex: number) => {
        e.preventDefault();
        e.stopPropagation();

        if (!draggedItem) return;

        // 1. Reordering within Sheet
        if (draggedItem.type === 'sheet_skill') {
            const sourceCategory = draggedItem.category!;
            const sourceIndex = draggedItem.index!;

            // Same pos check
            if (sourceCategory === targetCategory && sourceIndex === targetIndex) return;

            // Counters special case
            if (sourceCategory === 'counters') {
                if (targetCategory !== 'counters') return;
                const newList = [...(data.counters.custom || [])];
                const [itemToMove] = newList.splice(sourceIndex, 1);
                newList.splice(targetIndex, 0, itemToMove);
                onUpdate({ ...data, counters: { ...data.counters, custom: newList } });
                setDraggedItem(null);
                return;
            }

            const newSkills = { ...data.skills };
            const sourceList = [...(newSkills[sourceCategory as SkillCategoryKey] || [])];
            const targetList = (sourceCategory === targetCategory) ? sourceList : [...(newSkills[targetCategory as SkillCategoryKey] || [])];

            const [itemToMove] = sourceList.splice(sourceIndex, 1);

            targetList.splice(targetIndex, 0, itemToMove);

            newSkills[sourceCategory as SkillCategoryKey] = sourceList;
            if (sourceCategory !== targetCategory) {
                newSkills[targetCategory as SkillCategoryKey] = targetList;
            }

            onUpdate({ ...data, skills: newSkills });
        }

        // 2. Dropping from Library to Sheet
        else if (draggedItem.type === 'lib_skill') {
            const libItem = draggedItem.data as LibrarySkillEntry;

            // Create new Sheet Entry
            let variant: string | undefined;

            // Handle Variable Skills (Option 1)
            if (libItem.isVariable) {
                // Open Custom Modal instead of window.prompt
                setPendingSkillDrop({
                    libItem,
                    category: targetCategory,
                    index: targetIndex
                });
                setVariantInput("");
                setVariantModalOpen(true);
                setDraggedItem(null); // Clear drag state
                return;
            }

            const newSkillEntry: DotEntry = {
                id: Math.random().toString(36).substr(2, 9),
                name: libItem.name,
                value: 0,
                creationValue: 0,
                max: 5,
                variant: variant
            };

            const newSkills = { ...data.skills };
            const targetList = [...(newSkills[targetCategory as SkillCategoryKey] || [])];

            targetList.splice(targetIndex, 0, newSkillEntry);
            newSkills[targetCategory as SkillCategoryKey] = targetList;

            onUpdate({ ...data, skills: newSkills });
            onAddLog(`Importation : "${libItem.name}" depuis la réserve`, 'success', 'settings');
        }

        setDraggedItem(null);
    };

    const confirmVariableSkill = () => {
        if (!pendingSkillDrop) return;

        const { libItem, category, index } = pendingSkillDrop;
        const variant = variantInput.trim();

        // Even if empty, we might allow it (or force it? let's allow empty but maybe warn?)
        // User request didn't specify validation, but usually variant needs a value.
        // Let's assume it's optional but recommended.

        const newSkillEntry: DotEntry = {
            id: Math.random().toString(36).substr(2, 9),
            name: libItem.name,
            value: 0,
            creationValue: 0,
            max: 5,
            variant: variant
        };

        const newSkills = { ...data.skills };
        const targetList = [...(newSkills[category as SkillCategoryKey] || [])];

        targetList.splice(index, 0, newSkillEntry);
        newSkills[category as SkillCategoryKey] = targetList;

        onUpdate({ ...data, skills: newSkills });
        const logMsg = variant
            ? `Importation : "${libItem.name} : ${variant}" depuis la réserve`
            : `Importation : "${libItem.name}" depuis la réserve`;

        onAddLog(logMsg, 'success', 'settings');

        setVariantModalOpen(false);
        setPendingSkillDrop(null);
    };

    const renderCategoryEditor = (title: string, category: string, heightClass = 'h-full', defaultItemName = 'Nouvelle Compétence') => {
        const isCounters = category === 'counters';
        // @ts-ignore
        const list: DotEntry[] = isCounters ? (data.counters?.custom || []) : (data.skills?.[category as SkillCategoryKey] || []);

        return (
            <div
                className={`bg-[#fdfbf7]/80 backdrop-blur-sm p-4 rounded-sm shadow-md flex flex-col ${heightClass} border border-[#bfae85]/30 transition-all duration-300 ${draggedItem && !isCounters ? 'border-dashed border-amber-400 bg-amber-50/50 scale-[1.01]' : ''}`}
                onDragOver={handleDragOver}
                onDrop={(e) => !isCounters && handleDropOnSheet(e, category, list.length)}
            >
                <h3 className="font-bold text-[10px] mb-4 text-[#5c4d41] border-b border-[#bfae85]/30 pb-2 flex justify-between items-center select-none uppercase tracking-widest">
                    {title}
                    <div className="flex gap-1">
                        {!isCounters && (
                            <button
                                onClick={() => addSkill(category as SkillCategoryKey, true)}
                                className="text-[9px] bg-stone-500 text-white px-2 py-1 rounded-sm flex items-center gap-1 hover:bg-stone-600 transition-colors font-bold shadow-sm"
                                title="Ajouter un espaceur"
                            >
                                <Minus size={12} /> Espace
                            </button>
                        )}
                        <button
                            onClick={() => isCounters ? addCounter(defaultItemName) : addSkill(category as SkillCategoryKey, false, defaultItemName)}
                            className="text-[9px] bg-[#166534] text-white px-2 py-1 rounded-sm flex items-center gap-1 hover:bg-[#114b27] transition-colors font-bold shadow-sm"
                        >
                            <Plus size={12} /> Ajouter
                        </button>
                    </div>
                </h3>
                <div className="flex-grow overflow-y-auto space-y-2 pr-1 max-h-[500px] min-h-[50px] custom-scrollbar">
                    {list.length === 0 && !isCounters && (
                        <div className="h-16 border-2 border-dashed border-[#bfae85]/30 rounded-sm flex items-center justify-center text-[#5c4d41]/40 text-[10px] pointer-events-none italic">
                            Zone de dépôt
                        </div>
                    )}
                    {list.map((item, index) => {
                        const isDragging = draggedItem?.type === 'sheet_skill' && draggedItem?.category === category && draggedItem?.index === index;
                        return (
                            <div
                                key={item.id}
                                className={`flex items-center gap-2 text-sm group transition-all duration-200 p-1 rounded-sm ${isDragging ? 'opacity-50 bg-[#bfae85]/10' : 'hover:bg-[#bfae85]/5'}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'sheet_skill', { category, index, item })}
                                onDragOver={handleDragOver}
                                onDrop={(e) => { e.stopPropagation(); handleDropOnSheet(e, category, index); }}
                            >
                                <div className="cursor-grab text-[#bfae85]/40 hover:text-[#8b2e2e] active:cursor-grabbing p-1 transition-colors">
                                    <GripVertical size={16} />
                                </div>
                                <span className="text-[#5c4d41]/30 text-[9px] w-4 text-center select-none font-mono">{index + 1}</span>

                                {item.name === '' ? (
                                    <div className="flex-grow h-8 bg-black/5 border border-dashed border-[#bfae85]/30 rounded-sm flex items-center justify-center text-[10px] text-[#5c4d41]/40 italic cursor-default select-none shadow-inner">
                                        Espaceur
                                    </div>
                                ) : (
                                    <div className="flex-grow flex items-center gap-1">
                                        <input
                                            type="text"
                                            autoFocus={item.id === newlyAddedId}
                                            value={item.name}
                                            readOnly={!!item.variant} // Lock name if variant exists (Option 1)
                                            title={item.variant ? "Le nom racine ne peut pas être modifié pour une compétence variable" : undefined}
                                            onFocus={(e) => {
                                                setFocusedValue(e.target.value);
                                                if (e.target.value === defaultItemName) {
                                                    e.target.select();
                                                }
                                            }}
                                            onBlur={(e) => {
                                                if (item.id === newlyAddedId) {
                                                    setNewlyAddedId(null);
                                                }
                                                if (focusedValue !== null && e.target.value !== focusedValue) {
                                                    const label = isCounters ? "Compteurs" : getCategoryLabel(category);
                                                    onAddLog(`Modification : "${focusedValue}" renommé en "${e.target.value}" dans [${label}]`, 'info', 'settings');

                                                    // SYNC WITH LIBRARY ON BLUR
                                                    if (!isCounters) {
                                                        syncSkillWithLibrary(e.target.value, category as SkillCategoryKey);
                                                    }
                                                }
                                                setFocusedValue(null);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.currentTarget.blur();
                                                }
                                            }}
                                            onChange={(e) => isCounters ? updateCounterName(item.id, e.target.value) : updateSkillName(category as SkillCategoryKey, item.id, e.target.value)}
                                            className={`border border-[#bfae85]/30 p-1 rounded-sm w-full focus:border-[#8b2e2e] outline-none bg-white/50 text-xs font-bold text-[#2c241b] transition-all ${item.variant ? 'bg-stone-100 text-stone-500 italic' : ''}`}
                                        />
                                        {item.variant !== undefined && (
                                            <>
                                                <span className="text-[#5c4d41] font-bold">:</span>
                                                <input
                                                    type="text"
                                                    value={item.variant}
                                                    placeholder="Spécialité..."
                                                    onChange={(e) => updateSkillVariant(category as SkillCategoryKey, item.id, e.target.value)}
                                                    className="border border-[#bfae85]/30 p-1 rounded-sm w-full focus:border-[#8b2e2e] outline-none bg-white/50 text-xs font-bold text-[#8b2e2e] transition-all"
                                                />
                                            </>
                                        )}
                                    </div>
                                )}
                                <button
                                    onClick={() => isCounters ? removeCounter(item.id) : removeSkill(category as SkillCategoryKey, item.id)}
                                    className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Supprimer (remettre en réserve)"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
            <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {skillCategories.map(cat => (
                        <div key={cat.id} className="min-h-[200px]">
                            {renderCategoryEditor(cat.label, cat.id, "h-full", cat.behavior === 'Arrière-plan' ? 'Nouvel Arrière Plan' : 'Nouvelle Compétence')}
                        </div>
                    ))}
                </div>
            </div>

            {/* Custom Counters section if needed (usually those are not in skillCategories if they are completely custom, but here we manage them too) */}
            <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {renderCategoryEditor("Compteurs Personnalisés", "counters", "h-full", "Nouveau Compteur")}
                </div>
            </div>

            {/* Variable Skill Modal */}
            {variantModalOpen && pendingSkillDrop && (
                <ThematicModal
                    isOpen={variantModalOpen}
                    onClose={() => { setVariantModalOpen(false); setPendingSkillDrop(null); }}
                    title="Précision requise"
                    icon={<GraduationCap size={24} />}
                    size="md"
                    footer={
                        <>
                            <button
                                onClick={() => { setVariantModalOpen(false); setPendingSkillDrop(null); }}
                                className="px-4 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmVariableSkill}
                                className="px-6 py-2 bg-[#5c4d41] text-white rounded-sm font-bold shadow-md hover:bg-[#4a3b32] flex items-center gap-2"
                            >
                                <Save size={16} /> Confirmer
                            </button>
                        </>
                    }
                >
                    <div className="flex flex-col gap-4 py-2">
                        <div className="bg-amber-50/50 border border-amber-200/50 p-3 rounded-sm text-sm text-[#5c4d41]">
                            Vous ajoutez la compétence <strong>{pendingSkillDrop.libItem.name}</strong>.
                            <br />
                            Cette compétence nécessite une précision (variante).
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">
                                Spécialité / Variante (ex: Forge, Histoire, Épées...)
                            </label>
                            <input
                                className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 font-serif font-black text-[#1c1917] bg-white/50 focus:border-amber-500 outline-none shadow-sm text-lg"
                                value={variantInput}
                                onChange={(e) => setVariantInput(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && confirmVariableSkill()}
                            />

                            {/* Suggested Variants */}
                            {pendingSkillDrop.libItem.variants && pendingSkillDrop.libItem.variants.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[#bfae85]/20">
                                    <span className="w-full text-[9px] font-bold text-[#bfae85] uppercase tracking-wider mb-1">Variantes suggérées :</span>
                                    {pendingSkillDrop.libItem.variants.map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setVariantInput(v)}
                                            className={`px-2 py-1 text-xs rounded-full border transition-all ${variantInput === v ? 'bg-[#8b2e2e] text-white border-[#8b2e2e]' : 'bg-white text-[#5c4d41] border-[#bfae85]/30 hover:border-[#8b2e2e] hover:shadow-sm'}`}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </ThematicModal>
            )}
        </div>
    );
};

export default SkillsEditor;
