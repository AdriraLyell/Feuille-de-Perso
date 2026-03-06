import React, { useState } from 'react';
import { Plus, Minus, GripVertical, Trash2, Coins, BarChart3, TrendingUp } from 'lucide-react';
import { SkillCategoryConfig, SkillBehavior } from '../../../types/rules';

interface SkillCategoryCardProps {
    id: string;
    label: string;
    categoryConfig: SkillCategoryConfig;
    skills: string[];
    isDraggingSidebarItem: boolean;
    onUpdateLabel: (id: string, val: string) => void;
    onUpdateBehavior: (id: string, behavior: SkillBehavior) => void;
    onUpdateCategory: (updates: Partial<SkillCategoryConfig>) => void;
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
    onUpdateCategory,
    onUpdateSkill,
    onAddSkill,
    onRemoveSkill,
    onSkillBlur,
    onDragStart,
    onDrop,
    draggedItemInfo
}) => {
    const [showCostConfig, setShowCostConfig] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const costConfig = categoryConfig.costConfig ?? { type: 'triangular', factor: 1 };

    return (
        <div
            className={`flex flex-col h-full bg-stone-900/40 backdrop-blur-sm p-4 rounded-sm shadow-sm border transition-all duration-300 ${isDraggingSidebarItem ? 'border-dashed border-amber-500 bg-amber-900/20 scale-[1.01]' : 'border-stone-700/50'}`}
            onDragOver={handleDragOver}
            onDrop={(e) => { e.preventDefault(); onDrop(e, skills.length); }}
            role="region"
            aria-label={`Configuration catégorie: ${label}`}
        >
            {/* Header Area */}
            <div className="border-b border-stone-700/50 pb-3 mb-4 space-y-3">
                <div className="flex justify-between items-center gap-2">
                    <input
                        aria-label="Nom de la catégorie"
                        value={label}
                        onChange={(e) => onUpdateLabel(id, e.target.value)}
                        className="bg-stone-950 border border-stone-700 px-2 py-1 outline-none flex-grow text-stone-200 font-bold text-sm rounded-sm shadow-inner focus:border-amber-500 transition-colors font-serif tracking-wide"
                        placeholder="Label de la catégorie"
                    />
                    <div className="flex flex-col gap-1 shrink-0 items-end">
                        <div className="flex gap-1">
                            <button
                                onClick={() => onAddSkill(id, true)}
                                className="bg-stone-800 text-stone-400 p-1.5 rounded-sm hover:bg-stone-700 hover:text-stone-200 transition-colors shadow-sm border border-stone-700"
                                title="Ajouter un espaceur"
                            >
                                <Minus size={14} />
                            </button>
                            <button
                                onClick={() => onAddSkill(id, false)}
                                className="bg-stone-800 text-amber-500 p-1.5 rounded-sm hover:bg-stone-700 hover:text-amber-400 transition-colors shadow-sm border border-stone-700 hover:border-amber-500/50"
                                title="Ajouter une compétence"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                        <button
                            onClick={() => setShowCostConfig(prev => !prev)}
                            className={`w-full flex items-center justify-center p-1 rounded-sm transition-colors shadow-sm border ${showCostConfig ? 'bg-amber-950/40 text-amber-500 border-amber-500/40' : 'bg-stone-800 text-stone-500 border-stone-700 hover:text-amber-500 hover:border-amber-500/30'}`}
                            title="Configurer le coût XP"
                        >
                            <Coins size={12} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                    <select
                        aria-label="Comportement de la catégorie"
                        value={categoryConfig.behavior}
                        onChange={(e) => onUpdateBehavior(id, e.target.value as SkillBehavior)}
                        className="bg-stone-950 border border-stone-700 rounded-sm px-1 py-0.5 text-stone-400 font-medium outline-none focus:border-amber-500 transition-colors"
                    >
                        <option value="Compétence">Compétence</option>
                        <option value="Secondaire">Secondaire</option>
                        <option value="Arrière-plan">Arrière-plan</option>
                        <option value="Compteur">Compteur</option>
                    </select>

                    <span className="text-[9px] text-stone-600 uppercase tracking-widest shrink-0 font-bold">{id}</span>
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor={`category-desc-${id}`} className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">Description (Bulle d'info)</label>
                    <textarea
                        id={`category-desc-${id}`}
                        value={categoryConfig.description || ''}
                        onChange={(e) => onUpdateCategory({ description: e.target.value })}
                        className="w-full bg-stone-950 border border-stone-700 rounded-sm p-1.5 text-[10px] text-stone-300 outline-none resize-none h-12 shadow-inner focus:border-amber-500 transition-colors placeholder-stone-700"
                        placeholder="Texte de la bulle d'info..."
                    />
                </div>

                {/* Coût XP (collapsable) */}
                <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${showCostConfig ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}
                >
                    <div className="bg-stone-950/60 border border-stone-800 rounded-sm p-2 space-y-2">
                        <div className="text-[9px] font-bold text-amber-500/70 uppercase tracking-widest flex items-center gap-1">
                            <Coins size={10} /> Coût XP
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <div className="inline-flex bg-stone-900 p-0.5 rounded-sm gap-0.5 border border-stone-700">
                                <button
                                    onClick={() => onUpdateCategory({ costConfig: { ...costConfig, type: 'triangular' } })}
                                    className={`px-2 py-1 rounded-sm text-[9px] font-bold transition-all flex items-center gap-1 ${costConfig.type === 'triangular' ? 'bg-stone-800 text-amber-500 ring-1 ring-amber-500/40' : 'text-stone-600 hover:text-stone-400'}`}
                                    title="Somme triangulaire (1+2+3...)"
                                >
                                    <BarChart3 size={10} /> Triangulaire
                                </button>
                                <button
                                    onClick={() => onUpdateCategory({ costConfig: { ...costConfig, type: 'linear' } })}
                                    className={`px-2 py-1 rounded-sm text-[9px] font-bold transition-all flex items-center gap-1 ${costConfig.type === 'linear' ? 'bg-stone-800 text-emerald-500 ring-1 ring-emerald-500/40' : 'text-stone-600 hover:text-stone-400'}`}
                                    title="Progression par palier fixe"
                                >
                                    <TrendingUp size={10} /> Linéaire
                                </button>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[9px] text-stone-600 font-bold">×</span>
                                <input
                                    aria-label="Facteur de coût"
                                    type="number"
                                    step="0.1"
                                    value={costConfig.factor}
                                    onChange={(e) => onUpdateCategory({ costConfig: { ...costConfig, factor: parseFloat(e.target.value) || 0 } })}
                                    className="w-14 p-1 border border-stone-700 rounded-sm text-center font-bold text-xs bg-stone-950 text-stone-300 focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div 
                className="flex-grow overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[500px] min-h-[50px]"
                role="list"
            >
                {skills.length === 0 && (
                    <div className="h-16 border-2 border-dashed border-stone-800 rounded-sm flex items-center justify-center text-stone-600 text-[10px] pointer-events-none italic">
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
                            className={`flex items-center gap-2 group transition-all duration-200 p-1 rounded-sm border border-transparent ${isDragging ? 'opacity-50 bg-stone-800' : 'hover:bg-stone-800/50 hover:border-stone-700/50'}`}
                            role="listitem"
                        >
                            <div className="cursor-grab text-stone-700 hover:text-stone-400 active:cursor-grabbing p-1 transition-colors">
                                <GripVertical size={16} />
                            </div>
                            <span className="text-stone-700 text-[9px] w-4 text-center select-none font-mono font-bold">{index + 1}</span>

                            {skillName === "" ? (
                                <button
                                    type="button"
                                    className="flex-grow h-7 bg-stone-950/30 border border-dashed border-stone-800 rounded-sm flex items-center justify-center text-[10px] text-stone-600 italic cursor-grab select-none outline-none focus:bg-stone-950/50 focus:border-amber-500/50"
                                >
                                    Espaceur
                                </button>
                            ) : (
                                <input
                                    aria-label={`Compétence ${index + 1}`}
                                    value={skillName}
                                    onChange={(e) => onUpdateSkill(id, index, e.target.value)}
                                    onBlur={() => onSkillBlur(id, skillName)}
                                    className="border border-stone-800 p-1 rounded-sm w-full focus:border-amber-500 outline-none bg-stone-950 text-xs font-bold text-stone-300 transition-all shadow-sm placeholder-stone-700"
                                    placeholder="Nom..."
                                />
                            )}
                            <button
                                onClick={() => onRemoveSkill(id, index)}
                                className="text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity hover:text-crimson-blood p-1"
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
