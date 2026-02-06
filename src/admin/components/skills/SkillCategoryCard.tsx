import React from 'react';
import { Plus, Minus, GripVertical, Trash2 } from 'lucide-react';
import { SkillCategoryConfig, SkillBehavior } from '../../../types/rules';

interface SkillCategoryCardProps {
    id: string;
    label: string;
    categoryConfig: SkillCategoryConfig;
    skills: string[];
    isDraggingSidebarItem: boolean;
    onUpdateLabel: (id: string, val: string) => void;
    onUpdateBehavior: (id: string, behavior: SkillBehavior) => void;
    onUpdateSkill: (id: string, idx: number, val: string) => void;
    onAddSkill: (id: string, isSpacer: boolean) => void;
    onRemoveSkill: (id: string, idx: number) => void;
    onSkillBlur: (id: string, name: string) => void;
    onDragStart: (e: React.DragEvent, idx: number, name: string) => void;
    onDrop: (e: React.DragEvent, idx: number) => void;
    draggedItemInfo: { category?: string, index?: number } | null;
}

const SkillCategoryCard: React.FC<SkillCategoryCardProps> = ({
    id,
    label,
    categoryConfig,
    skills,
    isDraggingSidebarItem,
    onUpdateLabel,
    onUpdateBehavior,
    onUpdateSkill,
    onAddSkill,
    onRemoveSkill,
    onSkillBlur,
    onDragStart,
    onDrop,
    draggedItemInfo
}) => {
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    return (
        <div
            className={`flex flex-col h-full bg-[#fdfbf7]/80 backdrop-blur-sm p-4 rounded-sm shadow-md border transition-all duration-300 ${isDraggingSidebarItem ? 'border-dashed border-amber-400 bg-amber-50/50 scale-[1.01]' : 'border-[#bfae85]/30'}`}
            onDragOver={handleDragOver}
            onDrop={(e) => onDrop(e, skills.length)}
        >
            {/* Header Area */}
            <div className="border-b border-[#bfae85]/30 pb-3 mb-4 space-y-3">
                <div className="flex justify-between items-center gap-2">
                    <input
                        value={label}
                        onChange={(e) => onUpdateLabel(id, e.target.value)}
                        className="bg-white/40 border border-[#bfae85]/20 px-2 py-1 outline-none flex-grow text-[#5c4d41] font-bold text-sm rounded shadow-inner"
                        placeholder="Label de la catégorie"
                    />
                    <div className="flex gap-1 shrink-0">
                        <button
                            onClick={() => onAddSkill(id, true)}
                            className="bg-stone-500 text-white p-1 rounded hover:bg-stone-600 transition-colors shadow-sm"
                            title="Ajouter un espaceur"
                        >
                            <Minus size={14} />
                        </button>
                        <button
                            onClick={() => onAddSkill(id, false)}
                            className="bg-[#166534] text-white p-1 rounded hover:bg-[#114b27] transition-colors shadow-sm"
                            title="Ajouter une compétence"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                    <select
                        value={categoryConfig.behavior}
                        onChange={(e) => onUpdateBehavior(id, e.target.value as SkillBehavior)}
                        className="bg-white/60 border border-[#bfae85]/30 rounded px-1 py-0.5 text-[#5c4d41] font-medium outline-none"
                    >
                        <option value="Compétence">Compétence</option>
                        <option value="Secondaire">Secondaire</option>
                        <option value="Arrière-plan">Arrière-plan</option>
                        <option value="Compteur">Compteur</option>
                    </select>

                    <span className="text-[9px] text-[#bfae85] uppercase tracking-tighter shrink-0">{id}</span>
                </div>
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[500px] min-h-[50px]">
                {skills.length === 0 && (
                    <div className="h-16 border-2 border-dashed border-[#bfae85]/30 rounded-sm flex items-center justify-center text-[#5c4d41]/40 text-[10px] pointer-events-none italic">
                        Zone de dépôt
                    </div>
                )}

                {skills.map((skillName, index) => {
                    const isDragging = draggedItemInfo?.index === index && draggedItemInfo?.category === id;

                    return (
                        <div
                            key={index}
                            draggable={true}
                            onDragStart={(e) => onDragStart(e, index, skillName)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => { e.stopPropagation(); onDrop(e, index); }}
                            className={`flex items-center gap-2 group transition-all duration-200 p-1 rounded-sm ${isDragging ? 'opacity-50 bg-[#bfae85]/10' : 'hover:bg-[#bfae85]/5'}`}
                        >
                            <div className="cursor-grab text-[#bfae85]/40 hover:text-[#8b2e2e] active:cursor-grabbing p-1 transition-colors">
                                <GripVertical size={16} />
                            </div>
                            <span className="text-[#5c4d41]/30 text-[9px] w-4 text-center select-none font-mono">{index + 1}</span>

                            {skillName === "" ? (
                                <div className="flex-grow h-7 bg-black/5 border border-dashed border-[#bfae85]/30 rounded-sm flex items-center justify-center text-[10px] text-[#5c4d41]/40 italic cursor-grab select-none">
                                    Espaceur
                                </div>
                            ) : (
                                <input
                                    value={skillName}
                                    onChange={(e) => onUpdateSkill(id, index, e.target.value)}
                                    onBlur={() => onSkillBlur(id, skillName)}
                                    className="border border-[#bfae85]/30 p-1 rounded-sm w-full focus:border-[#8b2e2e] outline-none bg-white/50 text-xs font-bold text-[#2c241b] transition-all shadow-sm"
                                />
                            )}
                            <button
                                onClick={() => onRemoveSkill(id, index)}
                                className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600 p-1"
                                title="Archiver"
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

export default SkillCategoryCard;
