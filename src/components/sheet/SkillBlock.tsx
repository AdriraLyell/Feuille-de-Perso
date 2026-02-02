
import React, { useState } from 'react';
import { DotEntry } from '../../types';
import DotRating from '../ui/DotRating';
import { SectionHeader } from './Shared';

const DotRow: React.FC<{
    entry: DotEntry;
    category: string;
    onUpdate: (section: 'skills', category: string, id: string, value: number) => void;
    specializations?: string[];
    theme?: { creationColor: string, xpColor: string, dotSymbol?: string };
    imposedSpecs?: { name: string, minLevel: number }[];
    onDefineVariant?: (category: string, id: string, name: string) => void;
    allowExtendedSkills?: boolean;
}> = ({ entry, category, onUpdate, specializations = [], theme, imposedSpecs = [], onDefineVariant, allowExtendedSkills = false }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Spacer logic
    if (!entry.name) {
        return <div className="h-5 border-b border-transparent"></div>;
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
            setIsOpen(true);
        }
    };

    return (
        <div
            className="flex justify-between items-center px-2 border-b border-dotted border-stone-300 h-5 hover:bg-stone-50 transition-colors relative group"
            onMouseLeave={() => setIsOpen(false)}
        >
            <span
                className={`text-xs truncate font-medium transition-colors ${isUndefinedVariable
                    ? 'text-stone-500 cursor-pointer hover:text-amber-700 hover:underline'
                    : hasSpecs
                        ? 'text-blue-900 font-semibold cursor-help'
                        : 'text-stone-700 cursor-default'}`}
                // Dynamic width adjustment to avoid overlap with extra bubbles
                style={{ width: effectiveMax > 5 ? '40%' : '60%' }}
                onClick={handleClick}
                title={entry.variant ? `${entry.name} : ${entry.variant}` : entry.name}
            >
                {entry.name}
                {entry.variant !== undefined && (
                    <span className={`${isUndefinedVariable ? 'font-bold' : 'text-stone-500 font-normal'}`}>
                        {' : '}{entry.variant || '...'}
                    </span>
                )}
                {hasSpecs && !isUndefinedVariable && <span className="text-[9px] align-top ml-0.5 text-blue-400">*</span>}
            </span>

            {/* Tooltip for Specializations */}
            {
                isOpen && hasSpecs && (
                    <div className="absolute z-[100] left-4 bottom-full mb-1 w-max max-w-[200px] bg-slate-800 text-white text-[10px] p-2 rounded shadow-xl animate-in fade-in zoom-in duration-150 pointer-events-none">
                        <div className="font-bold border-b border-slate-600 mb-1 pb-1 text-slate-300">
                            Spécialisations
                        </div>
                        <ul className="list-disc list-inside space-y-0.5">
                            {combinedValidSpecs.map((s, i) => (
                                <li key={i} className="truncate">{s}</li>
                            ))}
                        </ul>
                        {/* Arrow */}
                        <div className="absolute left-6 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-800"></div>
                    </div>
                )
            }

            <DotRating
                value={entry.value}
                creationValue={entry.creationValue}
                onChange={(val) => onUpdate('skills', category, entry.id, val)}
                className="scale-90 origin-right"
                creationColor={theme?.creationColor}
                xpColor={theme?.xpColor}
                symbol={theme?.dotSymbol}
                max={effectiveMax}
            />
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
    theme?: { creationColor: string, xpColor: string, dotSymbol?: string };
    onDefineVariant?: (category: string, id: string, name: string) => void;
    allowExtendedSkills?: boolean;
}>(({ title, items, cat, onUpdate, userSpecs = {}, imposedSpecs = {}, theme, onDefineVariant, allowExtendedSkills = false }) => (
    <div className="flex flex-col h-full">
        <SectionHeader title={title} />
        <div className="flex-grow py-1">
            {(items || []).map(item => {
                // Combine specs for this specific item
                const uSpecs = userSpecs[item.id] || [];
                const iSpecs = imposedSpecs[item.id] || [];
                // Imposed specs first, then user specs
                const combinedSpecs = [...iSpecs, ...uSpecs];

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
                    />
                );
            })}
        </div>
    </div>
));
