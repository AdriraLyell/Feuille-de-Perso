import React, { useState, useRef, useEffect } from 'react';
import { DotEntry } from '../../types';
import DotRating from '../ui/DotRating';
import { SectionHeader } from './Shared';
import { Info } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { logger } from '../../utils/logger';
import { useNotification } from '../../context/NotificationContext';
import { PortalTooltip } from '../ui/PortalTooltip';

const DotRow: React.FC<{
    entry: DotEntry;
    category: string;
    onUpdate: (section: 'skills', category: string, id: string, value: number) => void;
    specializations?: string[];
    theme?: { creationColor: string, xpColor: string, dotSymbol?: string, skillColors?: { variable?: string, mysticDefault?: string, mysticOverrides?: Record<string, string> } };
    imposedSpecs?: { name: string, minLevel: number }[];
    onDefineVariant?: (category: string, id: string, name: string) => void;
    allowExtendedSkills?: boolean;
    isEditing?: boolean;
    onRemove?: (category: string, id: string) => void;
    validateIncrease?: (id: string, newValue: number) => { allowed: boolean; reason?: string };
    blockedReason?: string;
}> = ({ entry, category, onUpdate, specializations = [], theme, imposedSpecs = [], onDefineVariant, allowExtendedSkills = false, isEditing = false, onRemove, validateIncrease, blockedReason }) => {
    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef<HTMLSpanElement>(null);
    const addLog = useNotification();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (anchorRef.current && !anchorRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Spacer logic
    if (!entry.name) {
        return (
            <div
                className={`h-5 border-b border-dotted transition-colors relative group ${isEditing ? 'border-[#bfae85]/40 bg-[#bfae85]/5 hover:bg-[#bfae85]/10 cursor-grab active:cursor-grabbing' : 'border-transparent'}`}
                draggable={isEditing}
                onDragStart={isEditing ? (e) => {
                    const payload = {
                        type: 'sheet_item',
                        originCategory: category,
                        data: entry,
                        categoryType: category === 'Arrière-plan' ? 'background' : 'skill'
                    };
                    e.dataTransfer.setData('application/json', JSON.stringify(payload));
                } : undefined}
            >
                {isEditing && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove?.(category, entry.id); }}
                        className="absolute -right-1 top-1/2 -translate-y-1/2 p-0.5 text-red-400 opacity-0 group-hover:opacity-100 bg-white/80 rounded-full shadow-sm hover:text-red-600 transition-all z-10"
                    >
                        <LucideIcons.Trash2 size={10} />
                    </button>
                )}
            </div>
        );
    }

    const visibleImposed = entry.value > 0
        ? imposedSpecs.filter(s => entry.value >= (s.minLevel || 0)).map(s => s.name)
        : [];

    const validUserSpecs = entry.value > 0
        ? specializations.filter(s => s && s.trim() !== '')
        : [];

    const combinedValidSpecs = [...visibleImposed, ...validUserSpecs];
    const hasSpecs = combinedValidSpecs.length > 0;
    const isUndefinedVariable = entry.variant === "";

    // Dynamic Max Logic
    // If not extended, max is 5.
    // If extended, we always show at least 5.
    // If rank is 5, we show 6 (5 filled + 1 empty).
    // If rank is 6, we show 7, etc.
    const effectiveMax = allowExtendedSkills && entry.value >= 5
        ? Math.min(entry.value + 1, 10)
        : 5;

    const handleClick = () => {
        if (isUndefinedVariable && onDefineVariant) {
            onDefineVariant(category, entry.id, entry.name);
        } else if (hasSpecs) {
            setIsOpen(!isOpen);
        }
    };

    const getTextColor = (): string | undefined => {
        const skill = entry as any;
        const colors = theme?.skillColors;

        // 1. Surcharge spécifique Habilité Mystique
        if (skill.mysticAbilityId && colors?.mysticOverrides?.[skill.mysticAbilityId]) {
            return colors.mysticOverrides[skill.mysticAbilityId];
        }

        // 2. Défaut Mystique
        if (skill.mysticAbilityId) {
            return colors?.mysticDefault || '#8b5cf6';
        }

        // 3. Compétence Variable
        // On considère variable si flag isVariable présent OU si un variant est défini (même vide)
        if (skill.isVariable || entry.variant !== undefined) {
            return colors?.variable || '#d97706';
        }

        return undefined;
    };

    const textColor = getTextColor();
    const isBlocked = !!blockedReason;

    // Validation Check for Interaction
    const handleUpdate = (val: number) => {
        if (validateIncrease && val > entry.value) {
            const check = validateIncrease(entry.id, val);
            if (!check.allowed) {
                if (check.reason) {
                    addLog(check.reason, 'danger', 'sheet', `block-${entry.id}`);
                }
                return;
            }
        }
        onUpdate('skills', category, entry.id, val);
    };

    return (
        <div
            className={`flex justify-between items-center px-2 border-b border-dotted border-stone-300 h-5 hover:bg-stone-50 transition-colors relative group ${isEditing ? 'cursor-grab active:cursor-grabbing select-none' : ''}`}
            draggable={isEditing}
            onDragStart={isEditing ? (e) => {
                const payload = {
                    type: 'sheet_item',
                    originCategory: category,
                    data: entry,
                    categoryType: category === 'Arrière-plan' ? 'background' : 'skill'
                };
                e.dataTransfer.setData('application/json', JSON.stringify(payload));
            } : undefined}
            onMouseLeave={() => setIsOpen(false)}
        >
            <span
                className={`text-xs truncate font-medium transition-all ${isUndefinedVariable
                    ? 'font-bold cursor-pointer hover:underline' // Removed text-color classes to let style override
                    : hasSpecs
                        ? 'font-semibold cursor-help underline underline-offset-2 decoration-blue-300' // Removed text-blue-900
                        : 'cursor-default'
                    } ${isBlocked ? 'line-through opacity-60 italic' : ''}`}
                // Dynamic width adjustment to avoid overlap with extra bubbles
                style={{
                    width: effectiveMax > 5 ? '45%' : '65%',
                    color: isBlocked ? '#71717a' : (textColor ? textColor : (isUndefinedVariable ? '#d97706' : (hasSpecs ? '#1e3a8a' : '#44403c'))) // Fallbacks: amber-600, blue-900, stone-700
                }}
                onClick={handleClick}
                ref={anchorRef}
                title={entry.description || (entry.variant ? `${entry.name} : ${entry.variant}` : entry.name)}
            >
                {entry.variant !== undefined ? (
                    <>
                        <span style={{ color: isBlocked ? '#71717a' : (textColor || '#d97706') }} className="font-bold">{entry.name}{' : '}</span>
                        <span className={`${isUndefinedVariable ? 'italic opacity-60' : 'font-normal'}`} style={{ color: isBlocked ? '#71717a' : (textColor ? textColor : (isUndefinedVariable ? 'inherit' : '#78716c')) }}>
                            {entry.variant || '...'}
                        </span>
                    </>
                ) : (
                    entry.name
                )}
                {hasSpecs && !isUndefinedVariable && <span className="text-[9px] align-top ml-0.5 text-blue-400">*</span>}
            </span>

            {/* Tooltip for Specializations */}
            <PortalTooltip
                isOpen={isOpen && hasSpecs}
                anchorRef={anchorRef}
                title={`${entry.name} : Spécialisations`}
                maxWidth={400}
            >
                <div className="flex flex-col gap-1 w-full min-w-[220px] py-1">
                    <div className={combinedValidSpecs.length > 5 ? "columns-2 gap-x-8" : "flex flex-col"}>
                        {combinedValidSpecs.map((s, i) => (
                            <div key={i} className="flex items-center text-[11px] mb-1.5 break-inside-avoid px-2 border-l border-slate-700/50 hover:border-amber-500/50 transition-colors ml-1">
                                <span className="text-slate-300 truncate font-medium flex-1 flex items-center pr-2" title={s}>
                                    <span className="text-amber-400/80 mr-2 shrink-0 text-base leading-none translate-y-[1px]">•</span>
                                    {s}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </PortalTooltip>

            <DotRating
                value={entry.value}
                creationValue={entry.creationValue}
                onChange={handleUpdate}
                className="scale-90 origin-right ml-auto"
                creationColor={theme?.creationColor}
                xpColor={theme?.xpColor}
                symbol={theme?.dotSymbol}
                max={effectiveMax}
                readOnly={isEditing}
                blockedReason={blockedReason}
            />

            {isEditing && (entry.value === 0 || !entry.name) && (
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove?.(category, entry.id); }}
                    className="absolute -right-1 top-1/2 -translate-y-1/2 p-0.5 text-red-400 opacity-0 group-hover:opacity-100 bg-white/80 rounded-full shadow-sm hover:text-red-600 transition-all z-10"
                >
                    <LucideIcons.Trash2 size={10} />
                </button>
            )}
        </div >
    );
};

export const SkillBlock = React.memo<{
    title: string;
    items: DotEntry[];
    cat: string;
    onUpdate: (section: 'skills', category: string, id: string, value: number) => void;
    userSpecs?: Record<string, string[]>;
    imposedSpecs?: Record<string, { name: string, minLevel: number }[]>;
    theme?: { creationColor: string, xpColor: string, dotSymbol?: string, skillColors?: { variable?: string, mysticDefault?: string, mysticOverrides?: Record<string, string> } };
    onDefineVariant?: (category: string, id: string, name: string) => void;
    allowExtendedSkills?: boolean;
    description?: string;
    isEditing?: boolean;
    categoryBehavior?: 'Compétence' | 'Secondaire' | 'Arrière-plan' | 'Compteur';
    onDrop?: (category: string, item: any, targetIndex: number) => void;
    onRemove?: (category: string, id: string) => void;
    validateIncrease?: (id: string, newValue: number) => { allowed: boolean; reason?: string };
    blockedSkills?: Record<string, { isBlocked: boolean, sourceName: string }>;
}>(({ title, items, cat, onUpdate, userSpecs = {}, imposedSpecs = {}, theme, onDefineVariant, allowExtendedSkills = false, description, isEditing = false, onDrop, onRemove, validateIncrease, blockedSkills = {} }) => {
    const [showDesc, setShowDesc] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [dropIndex, setDropIndex] = useState<number>(-1);



    const handleDragOver = (e: React.DragEvent) => {
        if (!isEditing) return;
        e.preventDefault();
        setIsDragOver(true);
        e.dataTransfer.dropEffect = 'copy';

        // Calculate drop index based on mouse position
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const rowHeight = 20; // h-5 is 20px
        const headerPadding = 24; // approx height of SectionHeader + padding
        const relativeY = y - headerPadding;

        // Items start after header padding
        let index = Math.round(relativeY / rowHeight);
        index = Math.max(0, Math.min(index, items.length));
        setDropIndex(index);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
        setDropIndex(-1);
    };

    const handleDrop = (e: React.DragEvent) => {
        if (!isEditing) return;
        e.preventDefault();
        setIsDragOver(false);
        const finalDropIndex = dropIndex;
        setDropIndex(-1);
        try {
            const payload = JSON.parse(e.dataTransfer.getData('application/json'));
            onDrop?.(cat, payload, finalDropIndex);
        } catch (err) {
            logger.error('Failed to parse drop payload', err);
        }
    };

    return (
        <div
            className={`flex flex-col transition-all duration-200 ${isEditing ? 'relative' : ''} ${isDragOver ? 'bg-[#bfae85]/10 ring-2 ring-[#bfae85]/40 rounded-sm scale-[1.02] shadow-lg z-10' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="relative group/header">
                <SectionHeader
                    title={
                        <div className="flex items-center gap-1.5 justify-center">
                            {title}
                            {description && (
                                <button
                                    onMouseEnter={() => setShowDesc(true)}
                                    onMouseLeave={() => setShowDesc(false)}
                                    className="ml-1 text-[#bfae85]/40 hover:text-[#8b2e2e] transition-colors"
                                >
                                    <Info size={10} />
                                </button>
                            )}
                        </div>
                    }
                />

                {showDesc && description && (
                    <div className="absolute z-[101] left-1/2 -translate-x-1/2 bottom-full mb-1 w-48 bg-stone-800 text-white text-[9px] p-2 rounded shadow-xl animate-in fade-in slide-in-from-bottom-1 duration-200 pointer-events-none text-center">
                        {description}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-stone-800"></div>
                    </div>
                )}
            </div>

            <div className="flex-grow py-1 relative">
                {/* Drop Indicator Logic */}
                {isEditing && isDragOver && dropIndex !== -1 && (
                    <div
                        className="absolute left-0 right-0 h-0.5 bg-[#bfae85] z-20 pointer-events-none"
                        style={{ top: `${(dropIndex * 20) + 4}px` }} // 4px padding in py-1? No, py-1 is 4px top/bottom.
                    >
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-[#bfae85] rotate-45"></div>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-[#bfae85] rotate-45"></div>
                    </div>
                )}

                {(items || []).map((item, idx) => {
                    const iSpecs = imposedSpecs[item.id] || [];
                    const uSpecs = userSpecs[item.id] || [];
                    const normalizedName = item.name.trim().toLowerCase();
                    const blockedInfo = blockedSkills[normalizedName];

                    return (
                        <DotRow
                            key={item.id}
                            entry={item}
                            category={cat}
                            onUpdate={onUpdate}
                            specializations={uSpecs}
                            imposedSpecs={iSpecs}
                            theme={theme}
                            onDefineVariant={onDefineVariant}
                            allowExtendedSkills={allowExtendedSkills}
                            isEditing={isEditing}
                            onRemove={onRemove}
                            validateIncrease={validateIncrease}
                            blockedReason={blockedInfo?.sourceName}
                        />
                    );
                })}

                {items.length === 0 && isEditing && (
                    <div className="h-20 flex items-center justify-center border border-dashed border-[#bfae85]/30 rounded text-[10px] text-[#bfae85]/50 italic">
                        Glissez ici
                    </div>
                )}
            </div>
        </div>
    );
});
