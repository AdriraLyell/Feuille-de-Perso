
import React from 'react';
import { CharacterSheetData, DotEntry } from '../../types';
import DotRating from '../ui/DotRating';
import { SectionHeader } from './Shared';
import { useRules } from '../../context/RulesContext';

interface CountersSectionProps {
    data: CharacterSheetData;
    updateCounter: (id: string, value: number, isCustom: boolean, field: 'value' | 'current') => void;
    isLandscape: boolean;
}

export const CountersSection = React.memo<CountersSectionProps>(({ data, updateCounter, isLandscape }) => {
    const { rules } = useRules();
    const renderCounterItem = (counter: DotEntry, isCustom: boolean) => {
        const isSquaresOnly = counter.variant === 'squares_only';

        return (
            <div key={counter.id} className="col-span-1 border border-stone-300 bg-white rounded-sm shadow-sm flex items-center p-1 overflow-hidden h-9">
                {/* Title on the left */}
                <div
                    className="w-16 shrink-0 font-bold text-[9px] uppercase tracking-tighter text-stone-800 border-r border-stone-200 mr-1 pr-1 h-full flex items-center break-words leading-none justify-center text-center cursor-help"
                    title={counter.description || counter.name}
                >
                    {counter.name}
                </div>

                {/* Right side stacks */}
                <div className="flex flex-col gap-0.5 flex-grow justify-center w-full">
                    {!isSquaresOnly && (
                        /* Maxi */
                        <div className="flex items-center justify-end h-3 pr-1 gap-2">
                            <span className="text-[8px] text-stone-400 font-bold uppercase tracking-tight">Maxi</span>
                            <div className="relative w-[142px] h-3">
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 scale-[0.9] origin-right">
                                    <DotRating
                                        value={counter.value}
                                        creationValue={counter.creationValue}
                                        max={counter.max || 10}
                                        onChange={(v) => updateCounter(counter.id, v, isCustom, 'value')}
                                        creationColor={data.theme?.creationColor}
                                        xpColor={data.theme?.xpColor}
                                        symbol={data.theme?.dotSymbol}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Utilisé (ou Cases) */}
                    <div className="flex items-center justify-end h-3 pr-1 gap-2 mt-0.5">
                        <span className="text-[8px] text-stone-400 font-bold uppercase tracking-tight">{isSquaresOnly ? 'Cases' : 'Utilisé'}</span>
                        <div className="relative w-[142px] h-3">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 scale-[0.9] origin-right flex items-center space-x-1">
                                {Array.from({ length: counter.max || 10 }).map((_, i) => {
                                    // If squares_only, counter.value dictates how many squares are shown as "max active"
                                    // Normally counter.value was max, but if it has a max=10, we could just show i < counter.max.
                                    // Let's rely on counter.max for the full length, or counter.value if squares_only needs to be restricted.
                                    // The user said: "seul les cases (squares) sont affichées, cachant la ligne de bulle inutilisée"
                                    // so we show squares up to counter.max, and only the active ones are filled.
                                    // Wait, if we hide the bubbles (Maxi), how do we set the maximum for squares_only?
                                    // The "Maxi" line is what allows the player to INCREASE the length of the used counter if they spend XP. 
                                    // So for squares_only, the max length might be fixed at counter.max, but what if they can increase it?
                                    // Let's assume the max is static. No wait, in squares_only, the squares themselves represent the tracker. 
                                    // We show squares up to counter.max.
                                    if (i >= (counter.max || 10)) {
                                        return null;
                                    }

                                    // If squares_only, we don't limit by counter.value if we don't want to track it, but we should always show them.
                                    if (!isSquaresOnly && i >= counter.value) {
                                        return <div key={i} className="w-3 h-3" />;
                                    }

                                    const isChecked = i < (counter.current || 0);

                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => {
                                                const newVal = i + 1;
                                                const currentVal = counter.current || 0;
                                                updateCounter(counter.id, newVal === currentVal ? newVal - 1 : newVal, isCustom, 'current');
                                            }}
                                            className={`w-3 h-3 border border-stone-600 transition-colors ${isChecked ? 'bg-ink' : 'bg-white hover:bg-stone-100'}`}
                                            title="Point utilisé"
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        );
    };

    // Sorting Logic
    // rules is available from useRules hook at top of component

    // Fallback if rules not passed (though we will update parent)
    const counterCat = rules?.definitions?.skillCategories?.find((c: any) => c.behavior === 'Compteur');
    const sortedIds = counterCat ? (rules?.definitions?.skills?.[counterCat.id] || []) : [];

    const allKeys = Object.keys(data.counters).filter(k => k !== 'custom');

    // Sort keys based on sortedIds (which might be IDs or Names)
    const orderedKeys: string[] = [];
    const remainingKeys = new Set(allKeys);

    sortedIds.forEach((idOrName: string) => {
        // Find a key that matches this idOrName
        const matchedKey = Array.from(remainingKeys).find(key => {
            // 1. Exact Key Match
            if (key === idOrName) return true;
            // 2. Name Match (current data)
            // @ts-expect-error -- counters[key] may be DotEntry[]
            if (data.counters[key]?.name === idOrName) return true;
            // 3. System Definition Name Match
            const sysDef = rules?.definitions?.counters?.[key];
            if (sysDef?.name === idOrName) return true;

            return false;
        });

        if (matchedKey) {
            orderedKeys.push(matchedKey);
            remainingKeys.delete(matchedKey);
        }
    });

    // Add remaining keys (custom or unsorted)
    // FIX: User requested STRICT visibility. Only show counters in the list.
    // remainingKeys.forEach(key => orderedKeys.push(key));

    return (
        <div className="flex flex-col h-full border-l border-stone-400">
            <SectionHeader title="Compteurs" />
            <div className="p-1 flex-grow overflow-y-auto bg-stone-50/30">
                <div className={`grid gap-1 ${isLandscape ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {/* Dynamic System Counters (Sorted) */}
                    {orderedKeys.map(key => {
                        const counter = data.counters[key];
                        if (Array.isArray(counter)) return null;
                        return renderCounterItem(counter, false);
                    })}

                    {/* Legacy Custom Counters array (if any) */}
                    {(data.counters.custom || []).map(c => renderCounterItem(c, true))}
                </div>
            </div>
        </div>
    );
});
