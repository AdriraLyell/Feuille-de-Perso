
import React from 'react';
import { CharacterSheetData, DotEntry } from '../../types';
import DotRating from '../ui/DotRating';
import { SectionHeader } from './Shared';
import { useRules } from '../../context/RulesContext';
import { normalizeString } from '../../utils/stringUtils';
import { evaluateFormula } from '../../utils/formulaEvaluator';
import { Minus, Plus, RefreshCw } from 'lucide-react';
import { generateId } from '../../utils/factories';

interface CountersSectionProps {
    data: CharacterSheetData;
    updateCounter: (id: string, value: number, isCustom: boolean, field: 'value' | 'current') => void;
    isLandscape: boolean;
    creationBonuses?: Record<string, number>;
    xpBonuses?: Record<string, number>;
    calculatedMaxes?: Record<string, number>;
    activeReserves?: string[];
}

export const CountersSection = React.memo<CountersSectionProps>(({
    data,
    updateCounter,
    isLandscape,
    creationBonuses = {},
    xpBonuses = {},
    calculatedMaxes = {},
    activeReserves = []
}) => {
    const { rules } = useRules();

    const renderCounterItem = (counter: DotEntry, isCustom: boolean) => {
        const isSquaresOnly = counter.variant === 'squares_only';
        const nameKey = normalizeString(counter.name);
        const libEntry = data.counterLibrary?.find(l => normalizeString(l.name) === nameKey);
        const sysDef = rules?.definitions?.counters?.[nameKey] || Object.values(rules?.definitions?.counters || {}).find(c => normalizeString(c.name) === nameKey);
        const isNumeric = libEntry?.isNumeric || libEntry?.formulaId || sysDef?.formulaId;

        if (isNumeric) {
            return renderNumericCounterItem(counter, libEntry || sysDef, isCustom);
        }

        const creationBonus = creationBonuses[nameKey] || 0;
        const xpBonus = xpBonuses[nameKey] || 0;
        const calculatedMax = calculatedMaxes[counter.name] || calculatedMaxes[nameKey];

        const effectiveValue = counter.value + creationBonus + xpBonus;
        const effectiveCreationValue = (counter.creationValue || 0) + creationBonus;
        const effectiveMax = calculatedMax ?? (counter.max || 10);

        return (
            <div key={counter.id} className="col-span-2 border border-stone-300 bg-white rounded-sm shadow-sm flex items-center p-1 overflow-hidden h-9">
                <div
                    className="w-16 shrink-0 font-bold text-[8px] leading-tight uppercase tracking-tighter text-stone-800 border-r border-stone-200 mr-1 pr-1 h-full flex items-center justify-center text-center cursor-help"
                    title={counter.description || counter.name}
                >
                    {counter.name}
                </div>

                <div className="flex flex-col gap-0.5 flex-grow justify-center items-end pr-1 overflow-hidden">
                    {!isSquaresOnly && (
                        <div className="flex items-center h-3.5">
                            <div className="scale-[0.85] origin-right">
                                <DotRating
                                    value={effectiveValue}
                                    creationValue={effectiveCreationValue}
                                    max={effectiveMax}
                                    onChange={(v) => {
                                        const newBaseValue = Math.max(0, v - creationBonus - xpBonus);
                                        updateCounter(counter.id, newBaseValue, isCustom, 'value');
                                    }}
                                    creationColor={data.theme?.creationColor}
                                    xpColor={data.theme?.xpColor}
                                    symbol={data.theme?.dotSymbol}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center h-3.5">
                        <div className="scale-[0.85] origin-right flex items-center space-x-1">
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
            </div >
        );
    };

    const renderNumericCounterItem = (counter: DotEntry, entryOrFormula: any, isCustom: boolean) => {
        const nameKey = normalizeString(counter.name);
        const calculatedMax = calculatedMaxes[counter.name] || calculatedMaxes[nameKey];

        let formula = entryOrFormula.formula;
        if (!formula && entryOrFormula.formulaId) {
            const fEntry = rules?.libraries?.formulas?.find(f => f.id === entryOrFormula.formulaId);
            formula = fEntry?.formula || '';
        }

        const computedMax = calculatedMax ?? evaluateFormula(
            formula || '',
            { ...data, formulaLibrary: rules?.libraries?.formulas || data.formulaLibrary },
            entryOrFormula.aggregateConfig ? entryOrFormula : undefined
        );
        const currentSpent = counter.current || 0;
        const currentRemaining = Math.max(0, computedMax - currentSpent);

        return (
            <div key={counter.id} className="col-span-1 border border-[#bfae85]/40 bg-gradient-to-br from-[#fdfbf7] to-[#f4f2eb] rounded-sm shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)] flex items-center justify-between px-1 overflow-hidden h-9 group transition-all">
                <div className="flex flex-col items-start justify-center flex-grow">
                    <span
                        className="font-bold text-[9px] uppercase tracking-tighter text-[#8b2e2e]/90 leading-tight truncate w-full cursor-help"
                        title={entryOrFormula.description || counter.name}
                    >
                        {counter.name}
                    </span>
                    <span className="font-black text-sm text-[#5c4d41] leading-none mb-[1px]">
                        {currentRemaining} <span className="text-[10px] text-stone-400 font-normal">/ {computedMax}</span>
                    </span>
                </div>

                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => updateCounter(counter.id, 0, isCustom, 'current')} className="w-5 h-5 rounded hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors" title="Restaurer (Reset dépense)">
                        <RefreshCw size={11} />
                    </button>
                    <button onClick={() => updateCounter(counter.id, Math.min(computedMax, currentSpent + 1), isCustom, 'current')} className="w-5 h-5 rounded hover:bg-[#8b2e2e]/10 flex items-center justify-center text-[#8b2e2e] transition-colors" title="Dépenser 1 (Baisse la jauge)">
                        <Minus size={14} />
                    </button>
                    <button onClick={() => updateCounter(counter.id, Math.max(0, currentSpent - 1), isCustom, 'current')} className="w-5 h-5 rounded hover:bg-amber-600/10 flex items-center justify-center text-amber-600 transition-colors" title="Récupérer 1 (Remonte la jauge)">
                        <Plus size={14} />
                    </button>
                </div>
            </div>
        );
    };

    const counterCat = rules?.definitions?.skillCategories?.find((c: any) => c.behavior === 'Compteur');
    const sortedIds = counterCat ? (rules?.definitions?.skills?.[counterCat.id] || []) : [];
    const allKeys = Object.keys(data.counters).filter(k => k !== 'custom');
    const customCounters = data.counters.custom || [];

    const orderedKeys: string[] = [];
    const remainingKeys = new Set(allKeys);

    sortedIds.forEach((idOrName: string) => {
        const matchedKey = Array.from(remainingKeys).find(key => {
            if (key === idOrName) return true;
            const counterData = data.counters[key];
            if (counterData && !Array.isArray(counterData) && counterData.name === idOrName) return true;
            const sysDef = rules?.definitions?.counters?.[key];
            if (sysDef?.name === idOrName) return true;
            return false;
        });
        if (matchedKey) {
            orderedKeys.push(matchedKey);
            remainingKeys.delete(matchedKey);
        }
    });

    const numericItems: React.ReactNode[] = [];
    const standardItems: React.ReactNode[] = [];

    orderedKeys.forEach(key => {
        const counter = data.counters[key];
        if (Array.isArray(counter)) return;
        const nameKey = normalizeString(counter.name);
        const libEntry = data.counterLibrary?.find(l => normalizeString(l.name) === nameKey);
        const sysDef = rules?.definitions?.counters?.[nameKey] || Object.values(rules?.definitions?.counters || {}).find(c => normalizeString(c.name) === nameKey);
        const isNumeric = libEntry?.isNumeric || libEntry?.formulaId || sysDef?.formulaId;
        if (isNumeric) {
            numericItems.push(renderNumericCounterItem(counter, libEntry || sysDef, false));
        } else {
            standardItems.push(renderCounterItem(counter, false));
        }
    });

    customCounters
        .filter(c => c.name?.trim())
        .forEach(c => {
            const nameKey = normalizeString(c.name);
            const libEntry = data.counterLibrary?.find(l => normalizeString(l.name) === nameKey);
            const sysDef = rules?.definitions?.counters?.[nameKey];
            const isNumeric = libEntry?.isNumeric || libEntry?.formulaId || sysDef?.formulaId;
            if (isNumeric) {
                numericItems.push(renderNumericCounterItem(c, libEntry || sysDef, true));
            } else {
                standardItems.push(renderCounterItem(c, true));
            }
        });

    activeReserves.forEach(formulaId => {
        const formulaEntry = rules?.libraries?.formulas?.find(f => f.id === formulaId);
        if (!formulaEntry) return;
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
        numericItems.push(renderNumericCounterItem(counterToRender, formulaEntry, true));
    });

    return (
        <div className="flex flex-col h-full border-l border-stone-400">
            <SectionHeader title="Compteurs & Réserves" />
            <div className="p-1 flex-grow overflow-y-auto bg-stone-50/30">
                <div className="grid grid-cols-4 gap-1">
                    {standardItems}
                    {numericItems}
                </div>
            </div>
        </div>
    );
});
