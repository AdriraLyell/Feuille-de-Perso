import React from 'react';
import { CharacterSheetData, DotEntry } from '../../types';
import DotRating from '../ui/DotRating';
import { SectionHeader } from './Shared';
import { useRules } from '../../context/RulesContext';
import { normalizeString } from '../../utils/stringUtils';
import { RulesCounterDefinition } from '../../types/rules';
import { LibraryFormulaEntry, LibraryCounterEntry } from '../../types/system';
import { NumericCounterItem } from './NumericCounterItem';

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
    if (!rules) return null;

    const renderCounterItem = (counter: DotEntry, isCustom: boolean) => {
        const isSquaresOnly = counter.variant === 'squares_only';
        const normalizedName = normalizeString(counter.name);
        const nameKey = normalizedName.replace(/\s+/g, '');
        const libEntry = data.counterLibrary?.find(l => normalizeString(l.name) === normalizedName)
            || (rules.libraries?.counters?.find((l: LibraryCounterEntry) => normalizeString(l.name) === normalizedName));
        const sysDef = rules.definitions?.counters?.[nameKey] || (Object.values(rules.definitions?.counters || {}) as RulesCounterDefinition[]).find((c: RulesCounterDefinition) => normalizeString(c.name) === normalizedName);
        const isNumeric = libEntry?.isNumeric || libEntry?.formulaId || sysDef?.formulaId || sysDef?.isNumeric;
        if (isNumeric) {
            return (
                <NumericCounterItem
                    key={counter.id}
                    counter={counter}
                    entryOrFormula={libEntry || sysDef || {}}
                    isCustom={isCustom}
                    data={data}
                    rules={rules}
                    calculatedMaxes={calculatedMaxes}
                    updateCounter={updateCounter}
                />
            );
        }

        const creationBonus = creationBonuses[nameKey] || 0;
        const xpBonus = xpBonuses[nameKey] || 0;
        const calculatedMax = calculatedMaxes[counter.name] || calculatedMaxes[nameKey];

        const effectiveValue = counter.value + creationBonus + xpBonus;
        const effectiveCreationValue = (counter.creationValue || 0) + creationBonus;

        // On récupère le paramètre depuis la librairie/système d'abord, puis les max calculés (ex: formules). 
        // Si la valeur (base + traits) dépasse ce max, on étend visuellement (pour ne pas tronquer l'UI).
        const baseMax = calculatedMax ?? libEntry?.maxValue ?? sysDef?.max ?? (counter.max || 10);
        const effectiveMax = Math.max(baseMax, effectiveValue);

        return (
            <div key={counter.id} className="col-span-2 border border-stone-300 bg-white rounded-sm shadow-sm flex items-center p-1 overflow-hidden h-9 justify-between gap-1 pl-1.5 pr-0.5">
                <div
                    className="flex-grow shrink min-w-0 font-bold text-[8.5px] leading-tight uppercase tracking-tighter text-stone-800 flex items-center justify-start text-left cursor-help"
                    title={counter.description || counter.name}
                >
                    <span className="truncate w-full block">{counter.name}</span>
                </div>

                <div className="flex flex-col gap-0.5 shrink-0 justify-center items-end overflow-hidden pr-1.5">
                    {!isSquaresOnly && (
                        <div className="flex items-center h-3.5">
                            <div className="scale-[0.95] origin-right">
                                <DotRating
                                    value={effectiveValue}
                                    creationValue={effectiveCreationValue}
                                    max={effectiveMax}
                                    onChange={(v: number) => {
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
                        <div className="scale-[0.95] origin-right flex items-center space-x-1">
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
        );
    };

    const counterCat = rules?.definitions?.skillCategories?.find((c: { behavior: string }) => c.behavior === 'Compteur');
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
        const normalizedName = normalizeString(counter.name);
        const nameKey = normalizedName.replace(/\s+/g, '');
        const libEntry = data.counterLibrary?.find(l => normalizeString(l.name) === normalizedName)
            || (rules.libraries?.counters?.find((l: LibraryCounterEntry) => normalizeString(l.name) === normalizedName));
        const sysDef = rules.definitions?.counters?.[nameKey] || (Object.values(rules.definitions?.counters || {}) as RulesCounterDefinition[]).find((c: RulesCounterDefinition) => normalizeString(c.name) === normalizedName);
        const isNumeric = libEntry?.isNumeric || libEntry?.formulaId || sysDef?.formulaId || sysDef?.isNumeric;
        if (isNumeric) {
            numericItems.push(
                <NumericCounterItem
                    key={`numeric-${counter.id}`}
                    counter={counter}
                    entryOrFormula={libEntry || sysDef || {}}
                    isCustom={false}
                    data={data}
                    rules={rules}
                    calculatedMaxes={calculatedMaxes}
                    updateCounter={updateCounter}
                />
            );
        } else {
            standardItems.push(renderCounterItem(counter, false));
        }
    });

    customCounters
        .filter(c => c.name?.trim())
        .forEach(c => {
            const nameKey = normalizeString(c.name);
            const libEntry = data.counterLibrary?.find(l => normalizeString(l.name) === nameKey)
                || rules?.libraries?.counters?.find((l: LibraryCounterEntry) => normalizeString(l.name) === nameKey);
            const sysDef = rules?.definitions?.counters?.[nameKey];
            const isNumeric = libEntry?.isNumeric || libEntry?.formulaId || sysDef?.formulaId || sysDef?.isNumeric;
            if (isNumeric) {
                numericItems.push(
                    <NumericCounterItem
                        key={`custom-numeric-${c.id}`}
                        counter={c}
                        entryOrFormula={libEntry || sysDef || {}}
                        isCustom={true}
                        data={data}
                        rules={rules}
                        calculatedMaxes={calculatedMaxes}
                        updateCounter={updateCounter}
                    />
                );
            } else {
                standardItems.push(renderCounterItem(c, true));
            }
        });

    activeReserves.forEach(formulaId => {
        const formulaEntry = rules.libraries?.formulas?.find((f: LibraryFormulaEntry) => f.id === formulaId);
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
        numericItems.push(
            <NumericCounterItem
                key={`reserve-${counterToRender.id}`}
                counter={counterToRender}
                entryOrFormula={formulaEntry}
                isCustom={true}
                data={data}
                rules={rules}
                calculatedMaxes={calculatedMaxes}
                updateCounter={updateCounter}
            />
        );
    });

    return (
        <div className="flex flex-col h-full">
            <SectionHeader title="Compteurs & Réserves" />
            <div className={`p-1 flex-grow overflow-y-auto bg-stone-50/30`}>
                <div className={`grid gap-x-1.5 gap-y-1 ${isLandscape ? 'grid-cols-10' : 'grid-cols-4 sm:grid-cols-8'}`}>
                    {standardItems}
                    {numericItems}
                </div>
            </div>
        </div>
    );
}, (prev, next) => {
    return (
        prev.data.counters === next.data.counters &&
        prev.data.theme === next.data.theme &&
        prev.data.skills === next.data.skills &&
        prev.data.attributes === next.data.attributes &&
        prev.data.secondaryAttributes === next.data.secondaryAttributes &&
        prev.data.page2 === next.data.page2 &&
        prev.data.experience === next.data.experience &&
        prev.data.creationConfig === next.data.creationConfig &&
        prev.data.combat === next.data.combat &&
        prev.isLandscape === next.isLandscape &&
        prev.creationBonuses === next.creationBonuses &&
        prev.xpBonuses === next.xpBonuses &&
        prev.calculatedMaxes === next.calculatedMaxes &&
        prev.activeReserves === next.activeReserves
    );
});
