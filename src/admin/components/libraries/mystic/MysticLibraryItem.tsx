import React from 'react';
import { RulesData } from '../../../../types/rules';
import { LibrarySkillEntry } from '../../../../types/system';
import { Lock, Edit2, Trash2 } from 'lucide-react';
import { ItemUsageDetail } from '../../../../types/usageTypes';
import { UsageLockedTooltip } from '../UsageLockedTooltip';

interface MysticLibraryItemProps {
    item: LibrarySkillEntry;
    isLocked: boolean;
    onToggleActive: (id: string, current: boolean) => void;
    handleOpenEdit: (item: LibrarySkillEntry) => void;
    handleDelete: (id: string) => void;
    rules: RulesData;
    isPlaced?: boolean;
    usageDetails?: ItemUsageDetail;
    onLoadUsageDetails?: (id: string) => void;
}

export const MysticLibraryItem: React.FC<MysticLibraryItemProps> = ({
    item,
    isLocked,
    onToggleActive,
    handleOpenEdit,
    handleDelete,
    rules,
    isPlaced = false,
    usageDetails,
    onLoadUsageDetails
}) => {
    const [showLockTooltip, React_useStateLock] = React.useState(false);
    const lockIconRef = React.useRef<HTMLDivElement>(null);
    const setShowLockTooltip = (val: boolean) => React_useStateLock(val);
    return (
        <div className={`bg-white border rounded p-2 transition-shadow group flex items-center gap-2 ${item.isActive === false ? 'opacity-60 grayscale border-slate-200' : 'hover:shadow-md border-slate-300'}`}>
            <div className="w-8 flex justify-center shrink-0">
                <input
                    type="checkbox"
                    checked={item.isActive !== false}
                    onChange={() => onToggleActive(item.id, item.isActive !== false)}
                    className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    title={item.isActive !== false ? "Désactiver" : "Activer"}
                />
            </div>

            <div className="flex-grow overflow-hidden pr-2">
                <div className="flex items-center gap-2 overflow-hidden">
                    <div className={`font-bold truncate text-sm ${item.isActive === false ? 'text-slate-500 line-through' : 'text-slate-800'}`} title={item.name}>
                        {item.name}
                    </div>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    {isLocked && (
                        <div
                            ref={lockIconRef}
                            onMouseEnter={() => {
                                if (isLocked && !isPlaced && onLoadUsageDetails) {
                                    onLoadUsageDetails(item.id);
                                }
                                setShowLockTooltip(true);
                            }}
                            onMouseLeave={() => setShowLockTooltip(false)}
                            className="relative flex items-center shrink-0"
                            title={isPlaced ? "Utilisé dans cette campagne" : undefined}
                        >
                            <Lock size={11} className="text-amber-500" />
                            <UsageLockedTooltip
                                anchorRef={lockIconRef}
                                isOpen={showLockTooltip}
                                isLocked={isLocked}
                                isPlaced={isPlaced}
                                usageDetails={usageDetails}
                            />
                        </div>
                    )}

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

            <div className="w-16 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:bg-blue-50 p-1 rounded" title="Modifier"><Edit2 size={14} /></button>
                <button
                    onClick={() => handleDelete(item.id)}
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
