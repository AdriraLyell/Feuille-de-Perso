import React, { useState, useRef } from 'react';
import { LibraryEntry, TraitEffect } from '../../types';
import { Zap, Edit2, Trash2, Plus, CheckSquare, Square, Lock, Globe, Layers, Activity, TrendingUp, Eye } from 'lucide-react';
import { PortalTooltip } from '../ui/PortalTooltip';
import { ItemUsageDetail } from '../../types/usageTypes';
import { UsageLockedTooltip } from '../../admin/components/libraries/UsageLockedTooltip';

interface TraitCardProps {
    entry: LibraryEntry;
    isEditable: boolean;
    isSelected: boolean;
    onSelect?: (entry: LibraryEntry) => void;
    onMultiSelect?: (id: string) => void;
    onEdit: (entry: LibraryEntry) => void;
    onDelete: (id: string) => void;
    showMultiSelect: boolean;
    source?: 'local' | 'official' | 'modified';
    isLocked?: boolean;
    isPlaced?: boolean;
    isActive?: boolean;
    usageDetails?: ItemUsageDetail;
    onLoadUsageDetails?: (id: string) => void;
}

const TraitCardItemVariants: React.FC<{ entry: LibraryEntry; hasVariants: boolean }> = ({ entry, hasVariants }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const anchorRef = useRef<HTMLSpanElement>(null);

    return (
        <span
            ref={anchorRef}
            className="relative outline-none focus:ring-1 focus:ring-blue-500 rounded-sm"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            role="button"
            tabIndex={0}
            title={!hasVariants ? "Trait à variantes" : undefined}
        >
            <Layers
                size={14}
                className="text-blue-500"
            />

            {hasVariants && (
                <PortalTooltip
                    anchorRef={anchorRef}
                    isOpen={showTooltip}
                    title="Variantes suggérées"
                >
                    <div className="flex flex-wrap gap-1">
                        {entry.variants?.map((v, i) => (
                            <span key={i} className="bg-slate-700 px-1 rounded-sm border border-slate-600">{v}</span>
                        ))}
                    </div>
                </PortalTooltip>
            )}
        </span>
    );
};

const TraitCardItemEffects: React.FC<{ entry: LibraryEntry }> = ({ entry }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const anchorRef = useRef<HTMLSpanElement>(null);

    const getEffectLabel = (eff: TraitEffect) => {
        const type = eff.type || eff.effectType;
        switch (type) {
            case 'formula': return `Equation : ${eff.target || '?'} = ${eff.formula}`;
            case 'free_skill_rank': return `Rang gratuit : ${eff.target || '?'} (+${eff.value})`;
            case 'master_skill': return `Maître : compétence au rang 5 (choix joueur)`;
            default: return 'Effet spécial actif';
        }
    };

    return (
        <span
            ref={anchorRef}
            className="relative flex items-center justify-center cursor-help outline-none focus:ring-1 focus:ring-amber-500 rounded-sm"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            role="button"
            tabIndex={0}
        >
            <Zap size={14} className="text-amber-500 fill-amber-500" />

            <PortalTooltip
                anchorRef={anchorRef}
                isOpen={showTooltip}
                title="Effets mécaniques actifs"
            >
                <div className="flex flex-col gap-1 mt-1">
                    {entry.effects?.map((eff, i) => (
                        <div key={i} className={`text-[10px] text-white/90 whitespace-nowrap flex items-center gap-1.5 font-bold`}>
                            <span className="w-1 h-1 bg-amber-400 rounded-full inline-block"></span>
                            {getEffectLabel(eff)}
                        </div>
                    ))}
                </div>
            </PortalTooltip>
        </span>
    );
};

const TraitCardItemCounter: React.FC<{ entry: LibraryEntry }> = ({ entry }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const anchorRef = useRef<HTMLSpanElement>(null);

    return (
        <span
            ref={anchorRef}
            className="relative flex items-center justify-center cursor-help outline-none focus:ring-1 focus:ring-blue-500 rounded-sm"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            role="button"
            tabIndex={0}
        >
            <Activity size={14} className="text-blue-500" />

            <PortalTooltip
                anchorRef={anchorRef}
                isOpen={showTooltip}
                title="Compteur associé"
            >
                <div className="text-[10px] text-white/90">
                    Ce trait crée automatiquement un compteur "{entry.autoCounterName || entry.name}"
                </div>
            </PortalTooltip>
        </span>
    );
};

const TraitCardItemXP: React.FC<{ entry: LibraryEntry }> = () => {
    const [showTooltip, setShowTooltip] = useState(false);
    const anchorRef = useRef<HTMLSpanElement>(null);

    return (
        <span
            ref={anchorRef}
            className="relative flex items-center justify-center cursor-help outline-none focus:ring-1 focus:ring-emerald-500 rounded-sm"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onFocus={() => setShowTooltip(true)}
            onBlur={() => setShowTooltip(false)}
            role="button"
            tabIndex={0}
        >
            <TrendingUp size={14} className="text-emerald-500" />

            <PortalTooltip
                anchorRef={anchorRef}
                isOpen={showTooltip}
                title="Amélioration par XP"
            >
                <div className="text-[10px] text-white/90">
                    Ce trait peut être acquis ou amélioré avec de l'expérience.
                </div>
            </PortalTooltip>
        </span>
    );
};

const TraitCard: React.FC<TraitCardProps> = ({
    entry,
    isEditable,
    isSelected,
    onSelect,
    onMultiSelect,
    onEdit,
    onDelete,
    showMultiSelect,
    source = 'local',
    isLocked = false,
    isPlaced = false,
    isActive = true,
    usageDetails,
    onLoadUsageDetails
}) => {
    const [showLockTooltip, setShowLockTooltip] = useState(false);
    const lockIconRef = useRef<HTMLSpanElement>(null);
    if (!entry) return null;

    const hasVariants = entry.variants && entry.variants.length > 0;

    const handleMainClick = () => {
        if (showMultiSelect && onMultiSelect) {
            onMultiSelect(entry.id);
        } else if (onSelect) {
            onSelect(entry);
        }
    };

    return (
        <div
            className={`w-full p-2 transition-colors group border-b border-slate-100 last:border-0 flex items-center gap-2 ${isSelected ? 'bg-amber-50/50 hover:bg-amber-100/50' : 'hover:bg-stone-50'} ${!isActive ? 'opacity-60 grayscale' : ''}`}
            role="listitem"
        >
            {/* Main Clickable Area */}
            <button
                type="button"
                className="flex-grow flex items-center gap-2 text-left outline-none focus:ring-2 focus:ring-amber-500/50 rounded-sm"
                onClick={handleMainClick}
            >
                {/* 1. Toggle / Type Indicator (Fixed width) */}
                <div className="w-8 flex flex-col items-center justify-center shrink-0 gap-1 pointer-events-none">
                    {showMultiSelect ? (
                        <div className="text-[#8b2e2e]">
                            {isSelected ? <CheckSquare size={16} /> : <Square size={16} className="text-[#bfae85]" />}
                        </div>
                    ) : (
                        <div className={`w-2.5 h-2.5 rounded-full ${entry.type === 'avantage' ? 'bg-green-600' : 'bg-[#8b2e2e]'}`} title={entry.type === 'avantage' ? 'Avantage' : 'Désavantage'} />
                    )}
                </div>

                {/* 2. Status Icons (Fixed width) */}
                <div className="w-16 flex items-center gap-1 shrink-0 pointer-events-none">
                    {entry.isVariable && <TraitCardItemVariants entry={entry} hasVariants={!!hasVariants} />}
                    {(source === 'official' || source === 'modified') && (
                        <div title={source === 'modified' ? "Trait Officiel (modifié localement)" : "Trait Officiel"}>
                            <Globe size={14} className={source === 'modified' ? "text-amber-500" : "text-indigo-500"} />
                        </div>
                    )}
                    {entry.effects && entry.effects.length > 0 && <TraitCardItemEffects entry={entry} />}
                    {entry.hasAutoCounter && <TraitCardItemCounter entry={entry} />}
                    {entry.isXPUpgradeable && <TraitCardItemXP entry={entry} />}
                    {isLocked && (
                        <span
                            ref={lockIconRef}
                            onMouseEnter={() => {
                                if (isLocked && !isPlaced && onLoadUsageDetails) {
                                    onLoadUsageDetails(entry.id);
                                }
                                setShowLockTooltip(true);
                            }}
                            onMouseLeave={() => setShowLockTooltip(false)}
                            className="relative flex items-center outline-none focus:ring-1 focus:ring-amber-500 rounded-sm"
                            role="button"
                            tabIndex={0}
                            title={isPlaced ? "Utilisé dans cette campagne" : undefined}
                        >
                            <Lock size={14} className="text-amber-600" />
                            <UsageLockedTooltip
                                anchorRef={lockIconRef}
                                isOpen={showLockTooltip}
                                isLocked={isLocked}
                                isPlaced={isPlaced}
                                usageDetails={usageDetails}
                            />
                        </span>
                    )}
                </div>

                {/* 3. Content (Flexible) */}
                <div className="flex-grow overflow-hidden pr-2 pointer-events-none">
                    <div className="flex justify-between items-baseline gap-2">
                        <span className={`font-bold text-sm truncate ${isSelected ? 'text-amber-900' : 'text-[#4a3b32]'} ${!isActive ? 'line-through text-slate-500' : ''}`} title={entry.name}>
                            {entry.name}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-[#5c4d41] bg-[#bfae85]/20 px-1 rounded-sm border border-[#bfae85]/10 shrink-0">
                            {entry.pointsLabel || entry.cost} pts
                        </span>
                    </div>
                    {entry.description && (
                        <div className="text-[10px] text-[#5c4d41]/70 italic truncate" title={entry.description}>
                            {entry.description}
                        </div>
                    )}
                    {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                            {entry.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-[8px] bg-stone-100 text-[#5c4d41]/60 px-1 rounded-sm border border-stone-200">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </button>

            <div className="w-16 flex justify-end gap-1 opacity-40 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded outline-none focus:opacity-100"
                    title={isEditable ? "Éditer" : "Voir"}
                >
                    {isEditable ? <Edit2 size={14} /> : <Eye size={14} />}
                </button>
                {isEditable && (
                    <button
                        type="button"
                        onClick={(e) => { 
                            e.stopPropagation(); 
                            if (!isLocked) onDelete(entry.id); 
                        }}
                        disabled={isLocked}
                        className={`p-1 rounded outline-none focus:opacity-100 ${isLocked ? 'text-stone-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                        title={!isLocked ? "Supprimer" : undefined}
                    >
                        <Trash2 size={14} />
                    </button>
                )}
                {onSelect && !showMultiSelect && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onSelect(entry); }}
                        className="p-1 text-green-700 hover:bg-green-50 rounded border border-green-200 shadow-sm bg-white outline-none focus:opacity-100"
                        title="Ajouter à la fiche"
                    >
                        <Plus size={14} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default TraitCard;
