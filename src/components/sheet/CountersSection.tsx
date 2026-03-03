import React, { useState, useRef, useEffect } from 'react';
import { CharacterSheetData, DotEntry } from '../../types';
import DotRating from '../ui/DotRating';
import { SectionHeader } from './Shared';
import { useRules } from '../../context/RulesContext';
import { normalizeString } from '../../utils/stringUtils';
import { evaluateFormula, getSheetVariables, getAggregateDetails } from '../../utils/formulaEvaluator';
import { Minus, Plus, RefreshCw } from 'lucide-react';
import { Parser } from 'safe-expr-eval';
import { UnicodeTokenizer, normalizeFormula } from '../../utils/unicodeTokenizer';
import { PortalTooltip } from '../ui/PortalTooltip';
import { RulesData, RulesCounterDefinition } from '../../types/rules';
import { LibraryFormulaEntry, LibraryCounterEntry } from '../../types/system';

const parser = new Parser();

const getExpressionVariables = (formula: string): string[] => {
    try {
        const tokenizer = new UnicodeTokenizer(normalizeFormula(formula));
        const tokens = tokenizer.tokenize();
        return Array.from(new Set(
            tokens
                .filter(t => t.type === 'IDENTIFIER')
                .map(t => String(t.value))
                .filter(v => v !== 'true' && v !== 'false')
        ));
    } catch {
        return [];
    }
};

interface AggregateConfigDetails {
    operation: 'sum' | 'count' | 'max' | 'avg';
    targetType: 'skills' | 'attributes' | 'traits';
    filterTarget: 'category' | 'tag' | 'name';
    filterValue: string;
}

interface NumericCounterItemProps {
    counter: DotEntry;
    entryOrFormula: RulesCounterDefinition | LibraryFormulaEntry | LibraryCounterEntry | Partial<DotEntry>;
    isCustom: boolean;
    data: CharacterSheetData;
    rules: RulesData;
    calculatedMaxes: Record<string, number>;
    updateCounter: (id: string, value: number, isCustom: boolean, field: 'value' | 'current') => void;
}

const translateAggregateConfig = (config?: AggregateConfigDetails): string => {
    if (!config) return '';
    let targetLabel: string;
    const target = config.targetType;
    switch (target) {
        case 'skills': targetLabel = 'Compétences'; break;
        case 'attributes': targetLabel = 'Attributs'; break;
        case 'traits': targetLabel = 'Traits'; break;
        default: targetLabel = target;
    }

    let op = config.operation?.toLowerCase() || '';
    switch (op) {
        case 'sum': op = 'Somme'; break;
        case 'count': op = 'Nombre'; break;
        case 'max':
        case 'highest': op = 'Maximum'; break;
        case 'avg':
        case 'average': op = 'Moyenne'; break;
    }

    let filter = '';
    if (config.filterTarget && config.filterValue) {
        const typeF = config.filterTarget === 'tag' ? 'Tag' : config.filterTarget === 'category' ? 'Catégorie' : 'Nom';
        filter = ` (${typeF}: ${config.filterValue})`;
    }

    return op ? `${op} de : ${targetLabel}${filter}` : '';
};

const translateVariableName = (v: string): string => {
    switch (v) {
        case 'SUM_HABILITES_MYSTIQUES': return 'Somme Cap. Mystiques';
        case 'SCENARIOS_COUNT': return 'Nombre de Scénarios';
        case 'TRAIT_LEVEL': return 'Niveau de Trait';
        default: return v;
    }
};

const NumericCounterItem: React.FC<NumericCounterItemProps> = ({
    counter,
    entryOrFormula,
    isCustom,
    data,
    rules,
    calculatedMaxes,
    updateCounter
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef<HTMLDivElement>(null);

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

    const normalizedName = normalizeString(counter.name);
    const nameKey = normalizedName.replace(/\s+/g, '');
    const calculatedMax = calculatedMaxes[counter.name] || calculatedMaxes[normalizedName] || calculatedMaxes[nameKey];

    const globalDef = rules.libraries?.counters?.find((l) => normalizeString(l.name) === normalizedName)
        || Object.values(rules.definitions?.counters || {}).find((c) => normalizeString(c.name) === normalizedName);

    const effectiveEntryOrFormula = { ...globalDef, ...entryOrFormula } as RulesCounterDefinition | LibraryFormulaEntry;

    const resolvedFormula = !effectiveEntryOrFormula.formula && 'formulaId' in effectiveEntryOrFormula && effectiveEntryOrFormula.formulaId
        ? rules?.libraries?.formulas?.find((f: LibraryFormulaEntry) => f.id === effectiveEntryOrFormula.formulaId)
        : null;

    const formula = effectiveEntryOrFormula.formula || resolvedFormula?.formula || '';
    const aggregateConfig = (('aggregateConfig' in effectiveEntryOrFormula ? effectiveEntryOrFormula.aggregateConfig : undefined) || resolvedFormula?.aggregateConfig) as AggregateConfigDetails | undefined;
    const effectiveEntry = resolvedFormula ? { ...effectiveEntryOrFormula, ...resolvedFormula } : effectiveEntryOrFormula;

    const computedMax = calculatedMax ?? evaluateFormula(
        formula,
        { ...data, formulaLibrary: rules?.libraries?.formulas || data.formulaLibrary },
        { entry: effectiveEntry }
    );

    const currentSpent = counter.current || 0;
    const currentRemaining = Math.max(0, computedMax - currentSpent);

    const renderDetails = () => {
        if (!isOpen) return null;

        if (aggregateConfig) {
            const details = getAggregateDetails({ ...data, formulaLibrary: rules?.libraries?.formulas || data.formulaLibrary }, aggregateConfig);
            const translatedDesc = translateAggregateConfig(aggregateConfig);

            if (!details.length) {
                return (
                    <div className="flex flex-col gap-1 w-full min-w-[140px]">
                        <div className="text-slate-400 italic text-[9px] mb-1">{translatedDesc}</div>
                        <div className="text-stone-400 italic text-xs">Aucun élément correspondant</div>
                    </div>
                );
            }

            return (
                <div className="flex flex-col gap-1 w-full min-w-[280px]">
                    <div className="text-amber-200/80 italic text-sm border-b border-slate-600/50 pb-1 mb-2 leading-tight">
                        {translatedDesc}
                    </div>
                    <div className="columns-2 gap-x-6">
                        {details.map((d, i) => (
                            <div key={i} className="flex justify-between items-center text-sm mb-0.5 break-inside-avoid px-2">
                                <span className="text-slate-300 truncate font-medium flex-1 mr-2" title={d.name}>{d.name || d.category || 'Inconnu'}</span>
                                <span className="font-mono text-white text-right shrink-0">{d.value >= 0 ? `+${d.value}` : d.value}</span>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-slate-600 mt-1 pt-2 flex justify-between items-center font-bold text-base">
                        <span className="text-slate-200">TOTAL</span>
                        <span className="font-mono text-amber-400">{computedMax}</span>
                    </div>
                </div>
            );
        } else if (formula) {
            const sheetVars = getSheetVariables({ ...data, formulaLibrary: rules?.libraries?.formulas || data.formulaLibrary });
            let parsedVars: string[] = [];
            let baseValue = 0;
            try {
                const expr = parser.parse(normalizeFormula(formula));
                parsedVars = getExpressionVariables(formula);
                const zeroContext: Record<string, number> = parsedVars.reduce((acc, v) => ({ ...acc, [v]: 0 }), {} as Record<string, number>);
                baseValue = Number(expr.evaluate(zeroContext)) || 0;
            } catch {
                // Ignore parse errors for UI
            }

            return (
                <div className="flex flex-col gap-1 w-[460px] max-w-[95vw]">
                    {baseValue !== 0 && (
                        <div className="flex justify-between items-center text-sm border-b border-slate-600/50 pb-2 mb-2 px-2">
                            <span className="text-slate-400 italic">Base</span>
                            <span className="font-mono text-slate-400 shrink-0">{baseValue >= 0 ? `+${baseValue}` : baseValue}</span>
                        </div>
                    )}
                    <div className="columns-2 gap-x-6">
                        {parsedVars.map(v => {
                            const val = sheetVars[v] || 0;
                            const formulaEntry = rules?.libraries?.formulas?.find((f: LibraryFormulaEntry) =>
                                f.code === v || f.id === v || normalizeString(f.name) === normalizeString(v)
                            );
                            const displayName = formulaEntry?.name || translateVariableName(v);

                            const hasAggregateDetails = formulaEntry?.aggregateConfig && val !== 0;
                            const aggDetails = hasAggregateDetails
                                ? getAggregateDetails({ ...data, formulaLibrary: rules?.libraries?.formulas || data.formulaLibrary }, formulaEntry!.aggregateConfig!)
                                : [];

                            return (
                                <div key={v} className="flex flex-col mb-3">
                                    <div className="flex justify-between items-center text-sm pb-1 break-after-avoid px-2">
                                        <span className="text-slate-200 truncate font-semibold flex-1 mr-2" title={displayName}>{displayName}</span>
                                        <span className="font-mono text-white text-right shrink-0">{val >= 0 ? `+${val}` : val}</span>
                                    </div>
                                    {aggDetails.length > 0 && (
                                        <div className="pl-3 flex flex-col gap-1 border-l-2 border-slate-600/80 mb-1 ml-2 mt-1">
                                            {aggDetails.map((d, i) => (
                                                <div key={i} className="flex justify-between items-center text-xs opacity-90 break-inside-avoid pr-2">
                                                    <span className="truncate flex-1 text-slate-400 mr-2" title={d.name || d.category || 'Inconnu'}>{d.name || d.category || 'Inconnu'}</span>
                                                    <span className="font-mono text-slate-300 shrink-0">{d.value >= 0 ? `+${d.value}` : d.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="border-t border-slate-600 mt-2 pt-2 flex justify-between items-center font-bold text-base">
                        <span className="text-slate-200">TOTAL</span>
                        <span className="font-mono text-amber-400">{computedMax}</span>
                    </div>
                </div>
            );
        }

        return <div className="text-stone-400 italic">Valeur de base : {computedMax}</div>;
    };

    return (
        <div className="col-span-1 border border-[#bfae85]/40 bg-gradient-to-br from-[#fdfbf7] to-[#f4f2eb] rounded-sm shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)] flex items-center justify-between px-1 overflow-visible h-9 group transition relative">
            <div
                className="flex flex-col items-start justify-center flex-grow cursor-help h-full w-full"
                ref={anchorRef}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="font-bold text-[9px] uppercase tracking-tighter text-[#8b2e2e]/90 leading-tight truncate w-full">
                    {counter.name}
                </span>
                <span className="font-black text-sm text-[#5c4d41] leading-none mb-[1px]">
                    {currentRemaining} <span className="text-[10px] text-stone-400 font-normal">/ {computedMax}</span>
                </span>
            </div>

            <PortalTooltip isOpen={isOpen} anchorRef={anchorRef} title={`${counter.name} (Calcul)`} maxWidth={540}>
                {renderDetails()}
            </PortalTooltip>

            <div className={`flex flex-shrink-0 items-center justify-end transition-opacity z-10 bg-gradient-to-l from-[#f4f2eb] from-80% to-transparent pl-4 h-full absolute right-0 ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}>
                <button onClick={() => updateCounter(counter.id, 0, isCustom, 'current')} className="w-5 h-5 mr-0.5 rounded hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors" title="Restaurer (Reset dépense)">
                    <RefreshCw size={11} />
                </button>
                <button onClick={() => updateCounter(counter.id, Math.min(computedMax, currentSpent + 1), isCustom, 'current')} className="w-5 h-5 mr-0.5 rounded hover:bg-[#8b2e2e]/10 flex items-center justify-center text-[#8b2e2e] transition-colors" title="Dépenser 1 (Baisse la jauge)">
                    <Minus size={14} />
                </button>
                <button onClick={() => updateCounter(counter.id, Math.max(0, currentSpent - 1), isCustom, 'current')} className="w-5 h-5 rounded hover:bg-amber-600/10 flex items-center justify-center text-amber-600 transition-colors" title="Récupérer 1 (Remonte la jauge)">
                    <Plus size={14} />
                </button>
            </div>
        </div>
    );
};

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
            || (rules.libraries?.counters?.find((l) => normalizeString(l.name) === normalizedName));
        const sysDef = rules.definitions?.counters?.[nameKey] || Object.values(rules.definitions?.counters || {}).find((c: RulesCounterDefinition) => normalizeString(c.name) === normalizedName);
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
            || (rules.libraries?.counters?.find((l) => normalizeString(l.name) === normalizedName));
        const sysDef = rules.definitions?.counters?.[nameKey] || Object.values(rules.definitions?.counters || {}).find((c: RulesCounterDefinition) => normalizeString(c.name) === normalizedName);
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
