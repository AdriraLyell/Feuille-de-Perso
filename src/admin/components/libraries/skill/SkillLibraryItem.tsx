import React, { useState, useRef } from 'react';
import { Layers, Sparkles, Lock, Globe, PencilLine, Edit2, Trash2 } from 'lucide-react';
import { LibrarySkillEntry } from '../../../../types';
import { PortalTooltip } from '../../../../components/ui/PortalTooltip';
import { ItemUsageDetail } from '../../../../types/usageTypes';
import { UsageLockedTooltip } from '../UsageLockedTooltip';

interface SkillLibraryItemProps {
    skill: LibrarySkillEntry;
    isPlaced: boolean;
    isLocked: boolean;
    toggleSkillActive: (skill: LibrarySkillEntry) => void;
    handleOpenEdit: (skill: LibrarySkillEntry) => void;
    handleDelete: (id: string) => void;
    availableCategories: { code: string; label: string }[];
    usageDetails?: ItemUsageDetail;
    onLoadUsageDetails?: (id: string) => void;
}

export const SkillLibraryItem: React.FC<SkillLibraryItemProps> = ({
    skill,
    isPlaced,
    isLocked,
    toggleSkillActive,
    handleOpenEdit,
    handleDelete,
    availableCategories,
    usageDetails,
    onLoadUsageDetails
}) => {
    const hasVariants = skill.variants && skill.variants.length > 0;
    const [showVariantsTooltip, setShowVariantsTooltip] = useState(false);
    const [showLockTooltip, setShowLockTooltip] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);
    const lockIconRef = useRef<HTMLDivElement>(null);

    return (
        <div className={`bg-white border rounded p-2 transition-shadow group flex items-center gap-2 ${skill.isActive === false ? 'opacity-60 grayscale border-slate-200' : 'hover:shadow-md border-slate-300'}`}>
            {/* 1. Toggle (Fixed width) */}
            <div className="w-8 flex justify-center shrink-0">
                <input
                    type="checkbox"
                    checked={skill.isActive !== false}
                    onChange={() => toggleSkillActive(skill)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    title={skill.isActive !== false ? "Désactiver (Retirer de la campagne)" : "Activer (Ajouter à la campagne)"}
                />
            </div>

            {/* 2. Content (Flexible) */}
            <div className="flex-grow overflow-hidden pr-2">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className={`font-bold truncate text-sm ${skill.isActive === false ? 'text-slate-500 line-through' : 'text-slate-800'}`} title={skill.name}>
                        {skill.name}
                    </div>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    {skill.isGlobal && <div title="Global Reservoir"><Globe size={11} className="text-indigo-400 shrink-0" /></div>}
                    {skill.isCustomized && (
                        <div title="Cette compétence possède une surcharge pour cette campagne">
                            <PencilLine size={11} className="text-cyan-500 shrink-0" />
                        </div>
                    )}
                    {skill.isVariable && (
                        <span
                            ref={anchorRef}
                            className="relative outline-none focus:ring-1 focus:ring-blue-500 rounded-sm"
                            onMouseEnter={() => setShowVariantsTooltip(true)}
                            onMouseLeave={() => setShowVariantsTooltip(false)}
                            onFocus={() => setShowVariantsTooltip(true)}
                            onBlur={() => setShowVariantsTooltip(false)}
                            role="button"
                            tabIndex={0}
                            title={!hasVariants ? "Compétence à variantes" : undefined}
                        >
                            <Layers
                                size={11}
                                className="text-blue-400 shrink-0"
                            />

                            {hasVariants && (
                                <PortalTooltip
                                    anchorRef={anchorRef}
                                    isOpen={showVariantsTooltip}
                                    title="Variantes (Réserve)"
                                >
                                    <div className="flex flex-wrap gap-1">
                                        {skill.variants?.map((v, i) => (
                                            <span key={i} className="bg-slate-700 px-1 rounded-sm border border-slate-600">{v}</span>
                                        ))}
                                    </div>
                                </PortalTooltip>
                            )}
                        </span>
                    )}
                    {skill.mysticAbilityId && (
                        <div title="Compétence Mystique">
                            <Sparkles size={11} className="text-amber-500 shrink-0" />
                        </div>
                    )}
                    {isLocked && (
                        <span
                            ref={lockIconRef}
                            onMouseEnter={() => {
                                if (isLocked && !isPlaced && !skill.isCustomized && onLoadUsageDetails) {
                                    onLoadUsageDetails(skill.id);
                                }
                                setShowLockTooltip(true);
                            }}
                            onMouseLeave={() => setShowLockTooltip(false)}
                            onFocus={() => {
                                if (isLocked && !isPlaced && !skill.isCustomized && onLoadUsageDetails) {
                                    onLoadUsageDetails(skill.id);
                                }
                                setShowLockTooltip(true);
                            }}
                            onBlur={() => setShowLockTooltip(false)}
                            role="button"
                            tabIndex={0}
                            className="relative flex items-center shrink-0 outline-none focus:ring-1 focus:ring-amber-500 rounded-sm"
                            title={isPlaced ? "Utilisée dans cette campagne" : undefined}
                        >
                            <Lock size={11} className="text-amber-500" />
                            <UsageLockedTooltip
                                anchorRef={lockIconRef}
                                isOpen={showLockTooltip}
                                isLocked={isLocked}
                                isPlaced={isPlaced}
                                isCustomized={skill.isCustomized}
                                usageDetails={usageDetails}
                            />
                        </span>
                    )}

                    {skill.defaultCategory && (
                        <span
                            className="text-[9px] font-black bg-slate-100 text-slate-500 border border-slate-200 px-1 rounded-sm uppercase tracking-tighter shrink-0"
                            title={`Placement : ${availableCategories.find(c => c.code === skill.defaultCategory)?.label || skill.defaultCategory}`}
                        >
                            {availableCategories.find(c => c.code === skill.defaultCategory)?.label || skill.defaultCategory}
                        </span>
                    )}

                    {skill.description && (
                        <div className="text-[10px] text-slate-500 italic truncate" title={skill.description}>
                            {skill.description}
                        </div>
                    )}
                </div>
            </div>

            <div className="w-16 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                    onClick={() => handleOpenEdit(skill)}
                    className="p-1 rounded text-blue-500 hover:bg-blue-50"
                    title="Modifier la définition globale"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    onClick={() => handleDelete(skill.id)}
                    disabled={isLocked}
                    className={`p-1 rounded ${isLocked ? 'text-slate-300' : 'text-red-500 hover:bg-red-50'}`}
                    title={!isLocked ? "Supprimer" : undefined}
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};
