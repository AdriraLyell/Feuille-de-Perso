import React from 'react';
import { DotEntry, SkillCategoryKey } from '../../../types';
import { Minus, Plus, GripVertical, Trash2 } from 'lucide-react';
import { useSkillsEditorActions } from '../hooks/useSkillsEditorActions';
import { DragItemType } from '../../SettingsView';

interface SkillCategoryEditorProps {
    title: string;
    category: string;
    list: DotEntry[];
    draggedItem: DragItemType | null;
    actions: ReturnType<typeof useSkillsEditorActions>;
    heightClass?: string;
    defaultItemName?: string;
    isCounters?: boolean;
}

export const SkillCategoryEditor: React.FC<SkillCategoryEditorProps> = ({
    title,
    category,
    list,
    draggedItem,
    actions,
    heightClass = "h-full",
    defaultItemName = "Nouvelle Compétence",
    isCounters = false
}) => {
    const {
        addSkill,
        handleDragOver,
        handleDropOnSheet,
        handleDragStart,
        newlyAddedId,
        setNewlyAddedId,
        focusedValue,
        setFocusedValue,
        updateSkillName,
        updateSkillVariant,
        syncSkillWithLibrary,
        removeSkill,
        getCategoryLabel,
        onAddLog
    } = actions;

    return (
        <div
            className={`bg-[#fdfbf7]/80 backdrop-blur-sm p-4 rounded-sm shadow-md flex flex-col ${heightClass} border border-[#bfae85]/30 transition duration-300 ${draggedItem && !isCounters ? 'border-dashed border-amber-400 bg-amber-50/50 scale-[1.01]' : ''}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnSheet(e, category, list.length)}
            role="region"
            aria-label={`Éditeur de catégorie: ${title}`}
        >
            <h3 className="font-bold text-[10px] mb-4 text-[#5c4d41] border-b border-[#bfae85]/30 pb-2 flex justify-between items-center select-none uppercase tracking-widest">
                {title}
                <div className="flex gap-1">
                    <button
                        onClick={() => addSkill(category as SkillCategoryKey, true)}
                        className="text-[9px] bg-stone-500 text-white px-2 py-1 rounded-sm flex items-center gap-1 hover:bg-stone-600 transition-colors font-bold shadow-sm"
                        title="Ajouter un espaceur"
                    >
                        <Minus size={12} /> Espace
                    </button>
                    <button
                        onClick={() => addSkill(category as SkillCategoryKey, false, defaultItemName)}
                        className="text-[9px] bg-[#166534] text-white px-2 py-1 rounded-sm flex items-center gap-1 hover:bg-[#114b27] transition-colors font-bold shadow-sm"
                    >
                        <Plus size={12} /> Ajouter
                    </button>
                </div>
            </h3>
            <div 
                className="flex-grow overflow-y-auto space-y-2 pr-1 max-h-[500px] min-h-[50px] custom-scrollbar"
                role="list"
            >
                {list.length === 0 && (
                    <div className="h-16 border-2 border-dashed border-[#bfae85]/30 rounded-sm flex items-center justify-center text-[#5c4d41]/40 text-[10px] pointer-events-none italic">
                        Zone de dépôt
                    </div>
                )}
                {list.map((item, index) => {
                    const isDragging = draggedItem?.type === 'sheet_skill' && draggedItem?.category === category && draggedItem?.index === index;
                    return (
                        <div
                            key={item.id}
                            className={`flex items-center gap-2 text-sm group transition duration-200 p-1 rounded-sm ${isDragging ? 'opacity-50 bg-[#bfae85]/10' : 'hover:bg-[#bfae85]/5'}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, 'sheet_skill', { category, index, item })}
                            onDragOver={handleDragOver}
                            onDrop={(e) => { e.stopPropagation(); handleDropOnSheet(e, category, index); }}
                            role="listitem"
                        >
                            <div className="cursor-grab text-[#bfae85]/40 hover:text-[#8b2e2e] active:cursor-grabbing p-1 transition-colors">
                                <GripVertical size={16} />
                            </div>
                            <span className="text-[#5c4d41]/30 text-[9px] w-4 text-center select-none font-mono">{index + 1}</span>

                            {item.name === '' ? (
                                <button
                                    type="button"
                                    className="flex-grow h-8 bg-black/5 border border-dashed border-[#bfae85]/30 rounded-sm flex items-center justify-center text-[10px] text-[#5c4d41]/40 italic cursor-grab select-none shadow-inner outline-none focus:bg-stone-200/50"
                                >
                                    Espaceur
                                </button>
                            ) : (
                                <div className="flex-grow flex items-center gap-1">
                                    <input
                                        type="text"
                                        ref={(el) => { if (el && item.id === newlyAddedId) el.focus(); }}
                                        value={item.name}
                                        readOnly={!!item.variant}
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

                                                syncSkillWithLibrary(e.target.value, category as SkillCategoryKey);
                                            }
                                            setFocusedValue(null);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.currentTarget.blur();
                                            }
                                        }}
                                        onChange={(e) => updateSkillName(category as SkillCategoryKey, item.id, e.target.value)}
                                        className={`border border-[#bfae85]/30 p-1 rounded-sm w-full focus:border-[#8b2e2e] outline-none bg-white/50 text-xs font-bold text-[#2c241b] transition ${item.variant ? 'bg-stone-100 text-stone-500 italic' : ''}`}
                                    />
                                    {item.variant !== undefined && (
                                        <>
                                            <span className="text-[#5c4d41] font-bold">:</span>
                                            <input
                                                type="text"
                                                value={item.variant}
                                                placeholder="Spécialité..."
                                                onChange={(e) => updateSkillVariant(category as SkillCategoryKey, item.id, e.target.value)}
                                                className="border border-[#bfae85]/30 p-1 rounded-sm w-full focus:border-[#8b2e2e] outline-none bg-white/50 text-xs font-bold text-[#8b2e2e] transition"
                                            />
                                        </>
                                    )}
                                </div>
                            )}
                            <button
                                onClick={() => removeSkill(category as SkillCategoryKey, item.id)}
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
