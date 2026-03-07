import React, { useState, useRef, useEffect } from 'react';
import { CharacterSheetData, DotEntry } from '../../types';
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

export interface NumericCounterItemProps {
    counter: DotEntry;
    entryOrFormula: RulesCounterDefinition | LibraryFormulaEntry | LibraryCounterEntry | Partial<DotEntry>;
    isCustom: boolean;
    data: CharacterSheetData;
    rules: RulesData;
    calculatedMaxes: Record<string, number>;
    updateCounter: (id: string, value: number, isCustom: boolean, field: 'value' | 'current') => void;
}

export const NumericCounterItem: React.FC<NumericCounterItemProps> = ({
    counter,
    entryOrFormula,
    isCustom,
    data,
    rules,
    calculatedMaxes,
    updateCounter
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const anchorRef = useRef<HTMLButtonElement>(null);

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
        { entry: effectiveEntry as unknown as any } // eslint-disable-line @typescript-eslint/no-explicit-any
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
        <div className="col-span-1 border border-[#bfae85]/40 bg-gradient-to-br from-[#fdfbf7] to-[#f4f2eb] rounded-sm shadow-[inset_0_1px_4px_rgba(0,0,0,0.05)] flex items-center justify-between px-1.5 overflow-visible h-9 group transition relative">
            <button
                type="button"
                className="flex flex-col items-start justify-center flex-grow cursor-help h-full w-full overflow-hidden outline-none focus:bg-stone-200/50"
                ref={anchorRef}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="font-bold text-[8.5px] uppercase tracking-tighter text-[#8b2e2e]/90 leading-tight truncate w-full text-left">
                    {counter.name}
                </span>
                <span className="font-black text-xs text-[#5c4d41] leading-none">
                    {currentRemaining} <span className="text-[10px] text-stone-400 font-normal">/ {computedMax}</span>
                </span>
            </button>

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
