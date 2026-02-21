import React from 'react';
import { RulesData } from '../../../../types/rules';
import { LibraryCounterEntry } from '../../../../types/system';
import { Globe, Lock, Edit2, Trash2, Hash } from 'lucide-react';
import { ItemUsageDetail } from '../../../../types/usageTypes';
import { UsageLockedTooltip } from '../UsageLockedTooltip';

interface CounterLibraryItemProps {
    item: LibraryCounterEntry;
    isPlaced: boolean;
    isLocked: boolean;
    onToggleActive: (id: string, current: boolean) => void;
    handleOpenEdit: (item: LibraryCounterEntry) => void;
    handleDelete: (id: string) => void;
    rules: RulesData;
    usageDetails?: ItemUsageDetail;
    onLoadUsageDetails?: (id: string) => void;
}

export const CounterLibraryItem: React.FC<CounterLibraryItemProps> = ({
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
    const [showDeleteTooltip, React_useState] = React.useState(false);
    const deleteBtnRef = React.useRef<HTMLDivElement>(null);

    // Helper to avoid full React import if not available as named
    const setShowDeleteTooltip = (val: boolean) => React_useState(val);
    return (
        <div className={`bg-white border rounded p-2 transition-shadow group ${item.isActive === false ? 'opacity-60 grayscale border-slate-200' : 'hover:shadow-md border-slate-300'}`}>
            <div className="flex items-center gap-2 mb-1.5">
                {/* 1. Toggle */}
                <div className="w-8 flex justify-center shrink-0">
                    <input
                        type="checkbox"
                        checked={item.isActive !== false}
                        onChange={() => onToggleActive(item.id, item.isActive !== false)}
                        className="w-4 h-4 text-red-600 rounded cursor-pointer"
                        title={item.isActive !== false ? "Désactiver" : "Activer"}
                    />
                </div>

                {/* 2. Status Icons */}
                <div className="w-16 flex items-center gap-1 shrink-0">
                    {item.isGlobal && <div title="Item Global"><Globe size={14} className="text-indigo-500" /></div>}
                    {isLocked && (
                        <div className="text-amber-600" title={isPlaced ? "Utilisé dans cette campagne" : "Utilisé dans d'autres campagnes"}>
                            <Lock size={14} />
                        </div>
                    )}
                </div>

                {/* 3. Content */}
                <div className="flex-grow overflow-hidden pr-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className={`font-bold truncate text-sm ${item.isActive === false ? 'text-slate-500 line-through' : 'text-slate-800'}`} title={item.name}>
                            {item.name}
                        </div>
                        {item.defaultCategory && (
                            <span
                                className="text-[9px] font-black bg-slate-100 text-slate-500 border border-slate-200 px-1 rounded-sm uppercase tracking-tighter shrink-0"
                                title={`Placement : ${rules.definitions.skillCategories?.find(c => c.id === item.defaultCategory)?.label || item.defaultCategory}`}
                            >
                                {rules.definitions.skillCategories?.find(c => c.id === item.defaultCategory)?.label || item.defaultCategory}
                            </span>
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

            <div className="ml-10"> {/* Aligned with name content start */}
                <div className="flex items-center gap-3 text-[10px] text-slate-500 bg-slate-50 p-1 rounded border border-slate-100 mb-1">
                    <span title="Valeur Max" className="flex items-center gap-1"><Hash size={10} />Max: {item.maxValue}</span>
                    <span title="Défaut">Départ: {item.defaultValue}</span>
                    <span title="Coût XP">Coût: {item.xpCost}</span>
                </div>
                {item.description && <p className="text-[10px] text-slate-500 italic line-clamp-1">{item.description}</p>}
            </div>
        </div>
    );
};
