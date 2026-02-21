import React, { useState, useRef } from 'react';
import { RulesData } from '../../../../types/rules';
import { LibraryBackgroundEntry } from '../../../../types/system';
import { Layers, Lock, Edit2, Trash2 } from 'lucide-react';
import { PortalTooltip } from '../../../../components/ui/PortalTooltip';
import { ItemUsageDetail } from '../../../../types/usageTypes';
import { UsageLockedTooltip } from '../UsageLockedTooltip';

interface BackgroundLibraryItemProps {
    item: LibraryBackgroundEntry;
    isPlaced: boolean;
    isLocked: boolean;
    onToggleActive: (id: string, current: boolean) => void;
    handleOpenEdit: (item: LibraryBackgroundEntry) => void;
    handleDelete: (id: string) => void;
    rules: RulesData;
    usageDetails?: ItemUsageDetail;
    onLoadUsageDetails?: (id: string) => void;
}

export const BackgroundLibraryItem: React.FC<BackgroundLibraryItemProps> = ({
    item,
    isPlaced,
    isLocked,
    onToggleActive,
    handleOpenEdit,
    handleDelete,
    rules,
    usageDetails,
    onLoadUsageDetails
}) => {
    const hasVariants = item.variants && item.variants.length > 0;
    const [showVariantsTooltip, setShowVariantsTooltip] = useState(false);
    const [showDeleteTooltip, setShowDeleteTooltip] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);
    const deleteBtnRef = useRef<HTMLDivElement>(null);

    return (
        <div className={`bg-white border rounded p-2 transition-shadow group flex items-center gap-2 ${item.isActive === false ? 'opacity-60 grayscale border-slate-200' : 'hover:shadow-md border-slate-300'}`}>
            {/* 1. Toggle */}
            <div className="w-8 flex justify-center shrink-0">
                <input
                    type="checkbox"
                    checked={item.isActive !== false}
                    onChange={() => onToggleActive(item.id, item.isActive !== false)}
                    className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                    title={item.isActive !== false ? "Désactiver" : "Activer"}
                />
            </div>

            {/* 2. Content */}
            <div className="flex-grow overflow-hidden pr-2">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className={`font-bold truncate text-sm ${item.isActive === false ? 'text-slate-500 line-through' : 'text-slate-800'}`} title={item.name}>
                        {item.name}
                    </div>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    {item.isVariable && (
                        <div
                            ref={anchorRef}
                            className="relative"
                            onMouseEnter={() => setShowVariantsTooltip(true)}
                            onMouseLeave={() => setShowVariantsTooltip(false)}
                            title={!hasVariants ? "Variable" : undefined}
                        >
                            <Layers
                                size={11}
                                className="text-purple-400 shrink-0"
                            />

                            {hasVariants && (
                                <PortalTooltip
                                    anchorRef={anchorRef}
                                    isOpen={showVariantsTooltip}
                                    title="Variantes (Réserve)"
                                >
                                    <div className="flex flex-wrap gap-1">
                                        {item.variants?.map((v, i) => (
                                            <span key={i} className="bg-slate-700 px-1 rounded-sm border border-slate-600">{v}</span>
                                        ))}
                                    </div>
                                </PortalTooltip>
                            )}
                        </div>
                    )}
                    {isLocked && <div className="text-amber-500 shrink-0" title={isPlaced ? "Utilisé dans cette campagne" : "Utilisé dans d'autres campagnes"}><Lock size={11} /></div>}

                    {item.defaultCategory && (
                        <span
                            className="text-[9px] font-black bg-slate-100 text-slate-500 border border-slate-200 px-1 rounded-sm uppercase tracking-tighter shrink-0"
                            title={`Placement : ${rules.definitions.skillCategories?.find(c => c.id === item.defaultCategory)?.label || item.defaultCategory}`}
                        >
                            {rules.definitions.skillCategories?.find(c => c.id === item.defaultCategory)?.label || item.defaultCategory}
                        </span>
                    )}

                    {item.description && (
                        <div className="text-[10px] text-slate-500 italic truncate" title={item.description}>
                            {item.description}
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Actions */}
            <div className="w-16 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:bg-blue-50 p-1 rounded" title="Modifier"><Edit2 size={14} /></button>
                <div
                    ref={deleteBtnRef}
                    onMouseEnter={() => {
                        if (isLocked && !isPlaced && onLoadUsageDetails) {
                            onLoadUsageDetails(item.id);
                        }
                        setShowDeleteTooltip(true);
                    }}
                    onMouseLeave={() => setShowDeleteTooltip(false)}
                    className="relative flex items-center"
                >
                    <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isLocked}
                        className={`p-1 rounded ${isLocked ? 'text-slate-300 cursor-help' : 'text-red-500 hover:bg-red-50'}`}
                    >
                        <Trash2 size={14} />
                    </button>

                    <UsageLockedTooltip
                        anchorRef={deleteBtnRef}
                        isOpen={showDeleteTooltip}
                        isLocked={isLocked}
                        isPlaced={isPlaced}
                        usageDetails={usageDetails}
                    />
                </div>
            </div>
        </div>
    );
};
