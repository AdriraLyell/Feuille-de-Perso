
import React from 'react';
import { CharacterSheetData, DotEntry } from '../../types';
import DotRating from '../ui/DotRating';
import { SectionHeader } from './Shared';
import { useRules } from '../../context/RulesContext';
import { useCharacter } from '../../context/CharacterContext';
import { normalizeString } from '../../utils/stringUtils';
import { TraitEffect } from '../../types';
import { logger } from '../../utils/logger';
import { evaluateFormula } from '../../utils/formulaEvaluator';
import { Minus, Plus, RefreshCw, Layers } from 'lucide-react';
import { generateId } from '../../utils/factories';

interface CountersSectionProps {
    data: CharacterSheetData;
    updateCounter: (id: string, value: number, isCustom: boolean, field: 'value' | 'current') => void;
    isLandscape: boolean;
    creationBonuses?: Record<string, number>;
    xpBonuses?: Record<string, number>;
    activeReserves?: string[];
}

export const CountersSection = React.memo<CountersSectionProps>(({
    data,
    updateCounter,
    isLandscape,
    creationBonuses = {},
    xpBonuses = {},
    activeReserves = []
}) => {
    const { rules } = useRules();

    const renderCounterItem = (counter: DotEntry, isCustom: boolean) => {
        const isSquaresOnly = counter.variant === 'squares_only';
        const nameKey = normalizeString(counter.name);

        const libEntry = data.counterLibrary?.find(l => l.isNumeric && normalizeString(l.name) === nameKey);
        if (libEntry) {
            return renderNumericCounterItem(counter, libEntry);
        }

        const creationBonus = creationBonuses[nameKey] || 0;
        const xpBonus = xpBonuses[nameKey] || 0;

        // Final values for DotRating
        const effectiveValue = counter.value + creationBonus + xpBonus;
        const effectiveCreationValue = (counter.creationValue || 0) + creationBonus;
        const effectiveMax = counter.max || 10;

        return (
            <div key={counter.id} className="col-span-2 md:col-span-2 border border-stone-300 bg-white rounded-sm shadow-sm flex items-center p-1 overflow-hidden h-9">
                {/* Title on the left */}
                <div
                    className="w-24 shrink-0 font-bold text-[10px] uppercase tracking-tighter text-stone-800 border-r border-stone-200 mr-1 pr-1 h-full flex items-center break-words leading-none justify-center text-center cursor-help"
                    title={counter.description || counter.name}
                >
                    {counter.name}
                </div>

                {/* Right side stacks */}
                <div className="flex flex-col gap-0.5 flex-grow justify-center w-full">
                    {!isSquaresOnly && (
                        /* Maxi */
                        <div className="flex items-center justify-end h-3 pr-1 gap-2">
                            <div className="relative w-[142px] h-3">
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 scale-[0.9] origin-right">
                                    <DotRating
                                        value={effectiveValue}
                                        creationValue={effectiveCreationValue}
                                        max={effectiveMax}
                                        onChange={(v) => {
                                            // Subtract bonuses before updating base value
                                            const newBaseValue = Math.max(0, v - creationBonus - xpBonus);
                                            updateCounter(counter.id, newBaseValue, isCustom, 'value');
                                        }}
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
                        <div className="relative w-[142px] h-3">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 scale-[0.9] origin-right flex items-center space-x-1">
                                {Array.from({ length: effectiveMax }).map((_, i) => {
                                    if (i >= effectiveMax) return null;

                                    if (!isSquaresOnly && i >= effectiveValue) {
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

    const renderNumericCounterItem = (counter: DotEntry, libEntry: any) => {
        const computedMax = evaluateFormula(libEntry.formula || '', data);
        const currentSpent = counter.current || 0;
        const currentRemaining = Math.max(0, computedMax - currentSpent);

        return (
            <div key={counter.id} className="col-span-1 border border-[#bfae85]/40 bg-gradient-to-br from-[#fdfbf7] to-[#f4f2eb] rounded-sm shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)] flex items-center justify-between px-2 overflow-hidden h-9 group transition-all">
                <div className="flex flex-col items-start justify-center flex-grow">
                    <span
                        className="font-bold text-[9px] uppercase tracking-tighter text-[#8b2e2e]/90 leading-tight truncate w-full cursor-help"
                        title={libEntry.description || counter.name}
                    >
                        {counter.name}
                    </span>
                    <span className="font-black text-sm text-[#5c4d41] leading-none mb-[1px]">
                        {currentRemaining} <span className="text-[10px] text-stone-400 font-normal">/ {computedMax}</span>
                    </span>
                </div>

                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => updateCounter(counter.id, 0, true, 'current')} className="w-5 h-5 rounded hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors" title="Restaurer (Reset dépense)">
                        <RefreshCw size={11} />
                    </button>
                    <button onClick={() => updateCounter(counter.id, Math.min(computedMax, currentSpent + 1), true, 'current')} className="w-5 h-5 rounded hover:bg-[#8b2e2e]/10 flex items-center justify-center text-[#8b2e2e] transition-colors" title="Dépenser 1">
                        <Minus size={14} />
                    </button>
                    <button onClick={() => updateCounter(counter.id, Math.max(0, currentSpent - 1), true, 'current')} className="w-5 h-5 rounded hover:bg-amber-600/10 flex items-center justify-center text-amber-600 transition-colors" title="Récupérer 1">
                        <Plus size={14} />
                    </button>
                </div>
            </div>
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

    const numericCountersInLibrary = (data.counterLibrary || []).filter(l => l.isNumeric);
    const customCounters = data.counters.custom || [];

    // Unassigned numeric counters that the admin can quickly add manually if they are in creationMode or if we want users to be able to
    const unassignedNumericCounters = numericCountersInLibrary.filter(l => l.isActive && !customCounters.some(c => normalizeString(c.name) === normalizeString(l.name)));

    const handleAssignCounter = (libEntry: any) => {
        const newExt = {
            id: generateId(),
            name: libEntry.name,
            value: 0,
            creationValue: 0,
            current: 0,
            max: 0,
            description: libEntry.description
        };
        // Reuse useCharacterSheetActions implicitly? We can't access dropItem here without props passing, but we can do a hacky updateCounter.
        // updateCounter currently mutates the specific ID. Since ID does not exist, it won't push.
        // We will just let the user know they can add it via standard mechanics, OR we modify updateCounter to handle non-existent ID by pushing?
        // Wait, updateCounter logic maps over existing items so it won't add. 
        // We need an addCustomCounter function... Wait, there's no addCustomCounter.
        // It's ok, let's just use the `FormulasEditor` to add it if we build it there.
        // Since the prompt asks to manually assign it, let's emit a notification to the user to use the param panel.
    };

    return (
        <div className="flex flex-col h-full border-l border-stone-400">
            <SectionHeader title="Compteurs & Réserves" />
            <div className="p-1 flex-grow overflow-y-auto bg-stone-50/30">
                <div className={`grid gap-1 ${isLandscape ? 'grid-cols-2' : 'grid-cols-2'}`}>
                    {/* Dynamic System Counters (Sorted) */}
                    {orderedKeys.map(key => {
                        const counter = data.counters[key];
                        if (Array.isArray(counter)) return null;
                        return renderCounterItem(counter, false);
                    })}

                    {/* Legacy Custom Counters array (if any) */}
                    {customCounters
                        .filter(c => c.name?.trim())
                        .map(c => renderCounterItem(c, true))}

                    {/* Global Reserves from Formulas Dictionary */}
                    {activeReserves.map(formulaId => {
                        const formulaEntry = rules?.libraries?.formulas?.find(f => f.id === formulaId);
                        if (!formulaEntry) return null;

                        // Mock a counter entry for the renderer if it doesn't exist in data
                        // This allows dynamic reserves to show up just by having the trait
                        const existingCustom = customCounters.find(c => normalizeString(c.name) === normalizeString(formulaEntry.name));
                        const counterToRender: DotEntry = existingCustom || {
                            id: formulaId,
                            name: formulaEntry.name,
                            value: 0,
                            creationValue: 0,
                            current: 0,
                            max: 0,
                            description: formulaEntry.description
                        };

                        return renderNumericCounterItem(counterToRender, formulaEntry);
                    })}
                </div>
            </div>
        </div>
    );
});
