import React from 'react';
import { Edit2, Trash2, Globe, Lock } from 'lucide-react';
import { LibrarySpecializationEntry } from '../../../../types';
import { ItemUsageDetail } from '../../../../types/usageTypes';
import { UsageLockedTooltip } from '../UsageLockedTooltip';

interface SpecListItemProps {
    entry: LibrarySpecializationEntry;
    isLocked: boolean;
    allSkills: { id: string, name: string }[];
    onEdit: (entry: LibrarySpecializationEntry) => void;
    onDelete: (id: string, name: string) => void;
    onToggle: (id: string, active: boolean) => void;
    isPlaced?: boolean;
    usageDetails?: ItemUsageDetail;
    onLoadUsageDetails?: (id: string) => void;
}

export const SpecListItem: React.FC<SpecListItemProps> = ({
    entry,
    isLocked,
    allSkills,
    onEdit,
    onDelete,
    onToggle,
    isPlaced = false,
    usageDetails,
    onLoadUsageDetails
}) => {
    const [showLockTooltip, React_useStateLock] = React.useState(false);
    const lockIconRef = React.useRef<HTMLDivElement>(null);
    const setShowLockTooltip = (val: boolean) => React_useStateLock(val);
    return (
        <div className={`bg-white border rounded p-2 transition-shadow group ${entry.isActive === false ? 'opacity-60 grayscale border-slate-200' : 'hover:shadow-md border-slate-300'}`}>
            <div className="flex items-center gap-2 mb-1.5">
                {/* 1. Toggle */}
                <div className="w-8 flex justify-center shrink-0">
                    <input
                        type="checkbox"
                        checked={entry.isActive !== false}
                        onChange={() => onToggle(entry.id, entry.isActive !== false)}
                        className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                        title={entry.isActive !== false ? "Désactiver" : "Activer"}
                    />
                </div>

                {/* 2. Status Icons */}
                <div className="w-16 flex items-center gap-1 shrink-0">
                    {entry.isGlobal && <div title="Item Global"><Globe size={14} className="text-indigo-500" /></div>}
                    {isLocked && (
                        <div
                            ref={lockIconRef}
                            onMouseEnter={() => {
                                if (isLocked && !isPlaced && onLoadUsageDetails) {
                                    onLoadUsageDetails(entry.id);
                                }
                                setShowLockTooltip(true);
                            }}
                            onMouseLeave={() => setShowLockTooltip(false)}
                            className="relative flex items-center shrink-0"
                            title={isPlaced ? "Utilisée dans cette campagne" : undefined}
                        >
                            <Lock size={14} className="text-amber-600" />
                            <UsageLockedTooltip
                                anchorRef={lockIconRef}
                                isOpen={showLockTooltip}
                                isLocked={isLocked}
                                isPlaced={isPlaced}
                                usageDetails={usageDetails}
                            />
                        </div>
                    )}
                </div>

                {/* 3. Content */}
                <div className="flex-grow overflow-hidden pr-2">
                    <div className={`font-serif font-black uppercase text-xs tracking-wide truncate ${entry.isActive === false ? 'text-slate-500 line-through' : 'text-[#4a3b32]'}`} title={entry.name}>
                        {entry.name}
                    </div>
                </div>

                {/* 4. Actions */}
                <div className="w-16 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => onEdit(entry)} className="text-blue-500 hover:bg-blue-50 p-1 rounded"><Edit2 size={14} /></button>
                    <button
                        onClick={() => onDelete(entry.id, entry.name)}
                        disabled={isLocked}
                        className={`p-1 rounded ${isLocked ? 'text-slate-300' : 'text-red-500 hover:bg-red-50'}`}
                        title={!isLocked ? "Supprimer" : undefined}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className="ml-10"> {/* Aligned with name content start */}
                {entry.description && (
                    <p className="text-[10px] text-[#5c4d41] italic line-clamp-1 mb-1 opacity-80">{entry.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mb-1">
                    {entry.skillIds.map(sid => {
                        const s = allSkills.find(sk => sk.id === sid);
                        return (
                            <span key={sid} className="text-[8px] bg-stone-50 text-[#5c4d41]/60 px-1 py-0.5 rounded-sm border border-[#bfae85]/10">
                                {s ? s.name : sid}
                            </span>
                        );
                    })}
                </div>
                <div className="text-[9px] text-[#5c4d41]/50 border-t border-stone-100 pt-0.5">
                    Seuil : <span className="font-bold text-amber-700">{entry.defaultMinLevel}</span>
                </div>
            </div>
        </div>
    );
};
