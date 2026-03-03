import React, { useState, useRef, useEffect } from 'react';
import { DotEntry } from '../../types';
import DotRating from '../ui/DotRating';
import * as LucideIcons from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { PortalTooltip } from '../ui/PortalTooltip';

interface DotRowProps {
    entry: DotEntry;
    category: string;
    onUpdate: (section: 'skills', category: string, id: string, value: number) => void;
    specializations?: string[];
    theme?: {
        creationColor: string,
        xpColor: string,
        dotSymbol?: string,
        skillColors?: {
            variable?: string,
            mysticDefault?: string,
            mysticOverrides?: Record<string, string>
        }
    };
    imposedSpecs?: { name: string, minLevel: number }[];
    onDefineVariant?: (category: string, id: string, name: string) => void;
    allowExtendedSkills?: boolean;
    isEditing?: boolean;
    onRemove?: (category: string, id: string) => void;
    validateIncrease?: (id: string, newValue: number) => { allowed: boolean; reason?: string };
    blockedReason?: string;
}

export const DotRow: React.FC<DotRowProps> = ({
    entry,
    category,
    onUpdate,
    specializations = [],
    theme,
    imposedSpecs = [],
    onDefineVariant,
    allowExtendedSkills = false,
    isEditing = false,
    onRemove,
    validateIncrease,
    blockedReason
}) => {
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
                className={`h-5 border-b border-dotted transition-colors relative group ${isEditing ? 'border-[#bfae85]/40 bg-[#bfae85]/5 hover:bg-[#bfae85]/10 cursor-grab active:cursor-grabbing' : 'border-transparent'} `}
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
                        className="absolute -right-1 top-1/2 -translate-y-1/2 p-0.5 text-red-400 opacity-0 group-hover:opacity-100 bg-white/80 rounded-full shadow-sm hover:text-red-600 transition z-10"
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
        const skill = entry;
        const colors = theme?.skillColors;

        if (skill.mysticAbilityId && colors?.mysticOverrides?.[skill.mysticAbilityId]) {
            return colors.mysticOverrides[skill.mysticAbilityId];
        }

        if (skill.mysticAbilityId) {
            return colors?.mysticDefault || '#8b5cf6';
        }

        if (skill.isVariable || entry.variant !== undefined) {
            return colors?.variable || '#d97706';
        }

        return undefined;
    };

    const textColor = getTextColor();
    const isBlocked = !!blockedReason;

    const handleUpdate = (val: number) => {
        if (validateIncrease && val > entry.value) {
            const check = validateIncrease(entry.id, val);
            if (!check.allowed) {
                if (check.reason) {
                    addLog(check.reason, 'danger', 'sheet', `block - ${entry.id} `);
                }
                return;
            }
        }
        onUpdate('skills', category, entry.id, val);
    };

    return (
        <div
            className={`flex justify-between items-center px-2 border-b border-dotted border-stone-300 h-5 hover:bg-stone-50 transition-colors relative group ${isEditing ? 'cursor-grab active:cursor-grabbing select-none' : ''} `}
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
                className={`text-xs truncate font-medium transition ${isUndefinedVariable
                    ? 'font-bold cursor-pointer hover:underline'
                    : hasSpecs
                        ? 'font-semibold cursor-help underline underline-offset-2 decoration-blue-300'
                        : 'cursor-default'
                    } ${isBlocked ? 'line-through opacity-60 italic' : ''} `}
                style={{
                    width: effectiveMax > 5 ? '45%' : '65%',
                    color: isBlocked ? '#71717a' : (textColor ? textColor : (isUndefinedVariable ? '#d97706' : (hasSpecs ? '#1e3a8a' : '#44403c')))
                }}
                onClick={handleClick}
                ref={anchorRef}
                title={entry.description || (entry.variant ? `${entry.name} : ${entry.variant} ` : entry.name)}
            >
                {entry.variant !== undefined ? (
                    <>
                        <span style={{ color: isBlocked ? '#71717a' : (textColor || '#d97706') }} className="font-bold">{entry.name}{' : '}</span>
                        <span className={`${isUndefinedVariable ? 'italic opacity-60' : 'font-normal'} `} style={{ color: isBlocked ? '#71717a' : (textColor ? textColor : (isUndefinedVariable ? 'inherit' : '#78716c')) }}>
                            {entry.variant || '...'}
                        </span>
                    </>
                ) : (
                    entry.name
                )}
                {hasSpecs && !isUndefinedVariable && <span className="text-[9px] align-top ml-0.5 text-blue-400">*</span>}
            </span>

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
                    className="absolute -right-1 top-1/2 -translate-y-1/2 p-0.5 text-red-400 opacity-0 group-hover:opacity-100 bg-white/80 rounded-full shadow-sm hover:text-red-600 transition z-10"
                >
                    <LucideIcons.Trash2 size={10} />
                </button>
            )}
        </div >
    );
};
