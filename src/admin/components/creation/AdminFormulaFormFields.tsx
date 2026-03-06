import React, { useState } from 'react';
import { RulesData } from '../../../types/rules';
import { LibraryFormulaEntry } from '../../../types';
import { Info, Sparkles } from 'lucide-react';
import { CodeInput } from './CodeInput';
import { AggregateConfigEditor } from './AggregateConfigEditor';
import { TargetSearchDropdown } from './TargetSearchDropdown';

interface AdminFormulaFormFieldsProps {
    formula: LibraryFormulaEntry;
    rules: RulesData;
    targetSuggestions: { value: string, label: string, type: string }[];
    allVariables: string[];
    onUpdate: (field: keyof LibraryFormulaEntry, value: string | boolean | number | null | unknown) => void;
}

export const AdminFormulaFormFields: React.FC<AdminFormulaFormFieldsProps> = ({
    formula,
    targetSuggestions,
    allVariables,
    onUpdate
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 lg:col-span-6">
                    <label 
                        htmlFor="formula-name"
                        className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1"
                    >
                        Nom (ex: Calcul du Mana)
                    </label>
                    <input
                        id="formula-name"
                        type="text"
                        value={formula.name}
                        onChange={e => onUpdate('name', e.target.value)}
                        className="w-full p-2 bg-stone-950 border border-stone-700 text-stone-300 rounded focus:border-amber-500 outline-none"
                    />
                </div>
                <div className="col-span-12 lg:col-span-6">
                    <label 
                        htmlFor="formula-code"
                        className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 flex items-center gap-1"
                    >
                        Code <span className="text-stone-600 italic">(UPPERCASE)</span>
                    </label>
                    <CodeInput
                        id="formula-code"
                        value={formula.code || ''}
                        onChange={val => onUpdate('code', val)}
                        placeholder="EX: MA_VARIABLE"
                        className="w-full p-2 bg-stone-950 border border-stone-700 text-amber-500 font-mono rounded focus:border-amber-500 outline-none"
                    />
                </div>
                <div className="col-span-12">
                    <label 
                        htmlFor="formula-description"
                        className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1"
                    >
                        Description (Optionnel)
                    </label>
                    <input
                        id="formula-description"
                        type="text"
                        value={formula.description || ''}
                        onChange={e => onUpdate('description', e.target.value)}
                        className="w-full p-2 bg-stone-950 border border-stone-700 text-stone-300 rounded focus:border-amber-500 outline-none"
                    />
                </div>
            </div>

            <div>
                <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Rôle de la Formule</span>
                <div className="flex gap-2 p-1 bg-stone-950 rounded border border-stone-700/50 w-fit">
                    <button
                        onClick={() => onUpdate('type', 'variable')}
                        className={`px-3 py-1 text-xs font-bold rounded transition-colors ${formula.type === 'variable' ? 'bg-blue-600 text-white shadow-glow-blue' : 'text-stone-400 hover:text-stone-300'}`}
                    >
                        Variable MJ (Calcul)
                    </button>
                    <button
                        onClick={() => onUpdate('type', 'modifier')}
                        className={`px-3 py-1 text-xs font-bold rounded transition-colors ${formula.type === 'modifier' ? 'bg-amber-600 text-stone-900 border-amber-400/50' : 'text-stone-400 hover:text-stone-300'}`}
                    >
                        Effet (Modificateur)
                    </button>
                </div>
            </div>

            {formula.type === 'variable' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                    <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Source de la Variable</span>
                    <div className="flex gap-2 p-1 bg-stone-950 rounded border border-stone-700/50 w-fit">
                        <button
                            onClick={() => onUpdate('aggregateConfig', undefined)}
                            className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${!formula.aggregateConfig ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-stone-500 hover:text-stone-400'}`}
                        >
                            Équation Libre
                        </button>
                        <button
                            onClick={() => onUpdate('aggregateConfig', { operation: 'sum', targetType: 'skills', filterTarget: 'tag', filterValue: 'Mystique' })}
                            className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${formula.aggregateConfig ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-stone-500 hover:text-stone-400'}`}
                        >
                            Somme Automatique (Agrégat)
                        </button>
                    </div>
                    <AggregateConfigEditor aggregateConfig={formula.aggregateConfig} onUpdate={onUpdate} />
                </div>
            )}

            {formula.type === 'modifier' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div>
                            <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Cible de l'Effet</span>
                            <TargetSearchDropdown
                                value={formula.target || ''}
                                onUpdate={val => onUpdate('target', val)}
                                suggestions={targetSuggestions}
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <div>
                                <label 
                                    htmlFor="formula-effect-type"
                                    className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1"
                                >
                                    Type d'Effet
                                </label>
                                <select
                                    id="formula-effect-type"
                                    value={formula.effectType || 'modifier'}
                                    onChange={e => onUpdate('effectType', e.target.value)}
                                    className="w-full p-2 bg-stone-950 border border-stone-700 text-stone-300 rounded focus:border-amber-500 outline-none"
                                >
                                    <option value="modifier">Calcul Standard</option>
                                    <option value="block_skill_increase">Blocage de Progression</option>
                                    <option value="master_skill">Maîtrise (Forcer à 5)</option>
                                    <option value="free_skill_rank">Rang Gratuit</option>
                                </select>
                            </div>
                            <div className="flex gap-4 items-end">
                                {!['block_skill_increase', 'master_skill'].includes(formula.effectType || '') && (
                                    <div className="flex-grow">
                                        <label 
                                            htmlFor="formula-operator"
                                            className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1"
                                        >
                                            Opération
                                        </label>
                                        <select
                                            id="formula-operator"
                                            value={formula.operator || ''}
                                            onChange={e => onUpdate('operator', e.target.value)}
                                            className={`w-full p-2 bg-stone-950 border text-stone-300 rounded focus:border-amber-500 outline-none ${!formula.operator ? 'border-dashed border-stone-700 text-stone-500' : 'border-stone-700'}`}
                                        >
                                            <option value="">-- Aucune --</option>
                                            <option value="ADD">Ajoûter (ADD)</option>
                                            <option value="SET">Remplacer (SET)</option>
                                            <option value="SUB">Soustraire (SUB)</option>
                                        </select>
                                    </div>
                                )}
                                <div className="flex flex-col items-center pb-1 min-w-[90px]">
                                    <span className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2 whitespace-nowrap text-center">Forcer Variante</span>
                                    <button
                                        onClick={() => onUpdate('forceVariant', !formula.forceVariant)}
                                        className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${formula.forceVariant ? 'bg-indigo-600 shadow-glow-indigo' : 'bg-stone-800 border border-stone-700'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 flex items-center justify-center ${formula.forceVariant ? 'translate-x-6' : 'translate-x-0'}`}>
                                            {formula.forceVariant && <Sparkles size={10} className="text-indigo-600" />}
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {formula.forceVariant && (
                        <div className="mt-3 p-2 bg-indigo-950/20 border border-indigo-500/30 rounded flex gap-3 items-start animate-in slide-in-from-top-1">
                            <Sparkles className="text-indigo-400 shrink-0 mt-0.5" size={16} />
                            <p className="text-[10px] text-indigo-300/80 leading-relaxed font-medium">
                                <strong className="text-indigo-300">Variante Dynamique :</strong> Le joueur devra saisir une précision qui deviendra la cible de l'effet.
                            </p>
                        </div>
                    )}
                </>
            )}

            {!formula.aggregateConfig && !['block_skill_increase', 'master_skill'].includes(formula.effectType || '') && (
                <div>
                    <label 
                        htmlFor="formula-math-equation"
                        className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1"
                    >
                        Équation Mathématique
                    </label>
                    <div className="relative">
                        <input
                            id="formula-math-equation"
                            type="text"
                            value={formula.formula || ''}
                            onChange={e => {
                                const val = e.target.value;
                                onUpdate('formula', val);
                                const words = val.split(/[\s+\-*/()]/);
                                const lastWord = words[words.length - 1];
                                setSearchQuery(lastWord.length > 1 ? lastWord : '');
                            }}
                            className={`w-full p-3 bg-stone-950 border text-stone-300 rounded font-mono text-sm focus:border-amber-500 outline-none shadow-inner ${!formula.formula ? 'border-dashed border-stone-700' : 'border-stone-700'}`}
                            placeholder="Laisse vide pour saisir une Valeur Fixe"
                        />
                        {searchQuery && (
                            <div className="absolute z-10 top-full left-0 w-full mt-1 bg-stone-900 border border-amber-500/30 rounded shadow-2xl max-h-40 overflow-y-auto">
                                {allVariables
                                    .filter(v => v.toLowerCase().includes(searchQuery.toLowerCase()) && v !== searchQuery)
                                    .slice(0, 10)
                                    .map(v => (
                                        <button
                                            key={v}
                                            onClick={() => {
                                                const parts = formula.formula.split(/([\s+\-*/()])/);
                                                parts[parts.length - 1] = v;
                                                onUpdate('formula', parts.join(''));
                                                setSearchQuery('');
                                            }}
                                            className="w-full text-left p-2 hover:bg-amber-600 hover:text-stone-950 text-stone-300 text-xs border-b border-stone-800 last:border-0"
                                        >
                                            {v}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>
                    <div className="mt-3">
                        <span className="text-[10px] text-stone-500 flex items-center gap-1 uppercase tracking-widest font-bold mb-2">
                            <Info size={12} /> Suggestions rapides :
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {allVariables
                                .filter(v => ['TRAIT_LEVEL', 'SCENARIOS_COUNT', 'Physique', 'Volonté', 'Constitution', 'Empathie', 'Intelligence'].includes(v))
                                .map(v => (
                                    <button
                                        key={v}
                                        onClick={() => onUpdate('formula', (formula.formula?.trim() ? formula.formula + ' + ' : '') + v)}
                                        className="text-[10px] px-2 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded font-mono text-stone-400 transition-all hover:text-amber-400"
                                    >
                                        {v}
                                    </button>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
