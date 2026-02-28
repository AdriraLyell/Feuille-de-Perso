import React, { useState, useEffect } from 'react';
import { RulesData } from '../../../types/rules';
import { LibraryFormulaEntry } from '../../../types';
import { evaluateFormula } from '../../../utils/formulaEvaluator';
import { Trash2, Calculator, Info, Check, Sigma, AlertCircle, Sparkles } from 'lucide-react';
import { CodeInput } from './CodeInput';
import { AggregateConfigEditor } from './AggregateConfigEditor';
import { TargetSearchDropdown } from './TargetSearchDropdown';
import { validateFormulaEntry } from '../../../utils/formulaValidation';

interface AdminFormulaEditorItemProps {
    counter: LibraryFormulaEntry;
    rules: RulesData;
    isEditing: boolean;
    previewValue: number | null;
    currentPreviewData: any;
    allVariables: string[];
    targetSuggestions: { value: string, label: string, type: string }[];
    realCharData?: any;
    onEditStart: () => void;
    onEditClose: () => void;
    onUpdate: (id: string, field: keyof LibraryFormulaEntry, value: any) => void;
    onRemove: (id: string) => void;
}

export const AdminFormulaEditorItem: React.FC<AdminFormulaEditorItemProps> = ({
    counter,
    rules,
    isEditing,
    previewValue,
    currentPreviewData,
    allVariables,
    targetSuggestions,
    realCharData,
    onEditStart,
    onEditClose,
    onUpdate,
    onRemove
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    const preview = isEditing && previewValue !== null ? previewValue : evaluateFormula(counter.formula || '', currentPreviewData, { entry: counter });

    const { status: validationStatus, message: tooltipMessage, isValid } = validateFormulaEntry(counter, rules);

    const handleUpdate = (field: keyof LibraryFormulaEntry, value: any) => {
        onUpdate(counter.id, field, value);
    };

    return (
        <div className={`border rounded-sm overflow-hidden transition-all ${isEditing ? 'border-amber-500 ring-1 ring-amber-500/50 bg-stone-900/80' : 'border-stone-700/50 bg-stone-900/40 hover:border-amber-500/30'}`}>
            {/* Header */}
            <div
                className="p-3 flex justify-between items-center cursor-pointer"
                onClick={() => !isEditing && onEditStart()}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${counter.type === 'variable' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-500'}`}>
                        {counter.aggregateConfig ? <Sigma size={18} /> : <Calculator size={18} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-stone-200">{counter.name}</h3>
                            {counter.code && <span className="text-[10px] bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded font-mono uppercase border border-stone-700">{counter.code}</span>}
                        </div>
                        {!isEditing && <p className="text-xs text-stone-500 font-mono mt-0.5">{counter.formula}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right flex flex-col items-end">
                        <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold flex items-center gap-1" title={tooltipMessage}>
                            Aperçu {realCharData ? 'Réel' : '(Fictif)'}
                            {validationStatus === 'valid' && <Check size={10} className="text-emerald-500" />}
                            {validationStatus === 'warning' && <AlertCircle size={10} className="text-amber-500" />}
                            {validationStatus === 'error' && <AlertCircle size={10} className="text-rose-500" />}
                        </span>
                        <span className={`font-black text-xl leading-none ${isValid ? 'text-amber-500' : 'text-stone-600'}`}>
                            {preview !== null && !isNaN(preview) ? preview : 'ERROR'}
                        </span>
                    </div>
                    {isEditing && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEditClose(); }}
                            className="p-2 bg-amber-600 text-stone-950 rounded hover:bg-amber-500"
                            title="Fermer l'édition"
                        >
                            <Check size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Editor */}
            {isEditing && (
                <div className="p-4 border-t border-stone-700/50 bg-stone-900 flex flex-col gap-4">
                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-4">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Nom (ex: Calcul du Mana)</label>
                            <input
                                type="text"
                                value={counter.name}
                                onChange={e => handleUpdate('name', e.target.value)}
                                className="w-full p-2 bg-stone-950 border border-stone-700 text-stone-300 rounded focus:border-amber-500 outline-none"
                            />
                        </div>
                        <div className="col-span-3">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                Code <span className="text-stone-600 italic">(UPPERCASE)</span>
                            </label>
                            <CodeInput
                                value={counter.code || ''}
                                onChange={val => handleUpdate('code', val)}
                                placeholder="EX: MA_VARIABLE"
                                className="w-full p-2 bg-stone-950 border border-stone-700 text-amber-500 font-mono text-xs rounded focus:border-amber-500 outline-none"
                            />
                        </div>
                        <div className="col-span-5">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Description (Optionnel)</label>
                            <input
                                type="text"
                                value={counter.description || ''}
                                onChange={e => handleUpdate('description', e.target.value)}
                                className="w-full p-2 bg-stone-950 border border-stone-700 text-stone-300 rounded focus:border-amber-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Rôle de la Formule</label>
                        <div className="flex gap-2 p-1 bg-stone-950 rounded border border-stone-700/50 w-fit">
                            <button
                                onClick={() => handleUpdate('type', 'variable')}
                                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${counter.type === 'variable' ? 'bg-blue-600 text-white shadow-glow-blue' : 'text-stone-400 hover:text-stone-300'}`}
                            >
                                Variable MJ (Calcul)
                            </button>
                            <button
                                onClick={() => handleUpdate('type', 'modifier')}
                                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${counter.type === 'modifier' || (counter as any).type === 'effect' ? 'bg-amber-600 text-stone-900 border-amber-400/50' : 'text-stone-400 hover:text-stone-300'}`}
                            >
                                Effet (Modificateur)
                            </button>
                        </div>
                    </div>

                    {counter.type === 'variable' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Source de la Variable</label>
                            <div className="flex gap-2 p-1 bg-stone-950 rounded border border-stone-700/50 w-fit">
                                <button
                                    onClick={() => handleUpdate('aggregateConfig', undefined)}
                                    className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${!counter.aggregateConfig ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-stone-500 hover:text-stone-400'}`}
                                >
                                    Équation Libre
                                </button>
                                <button
                                    onClick={() => handleUpdate('aggregateConfig', { operation: 'sum', targetType: 'skills', filterTarget: 'tag', filterValue: 'Mystique' })}
                                    className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${counter.aggregateConfig ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-stone-500 hover:text-stone-400'}`}
                                >
                                    Somme Automatique (Agrégat)
                                </button>
                            </div>
                            <AggregateConfigEditor aggregateConfig={counter.aggregateConfig} onUpdate={handleUpdate} />
                        </div>
                    )}

                    {(counter.type === 'modifier' || (counter as any).type === 'effect') && (
                        <>
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Cible de l'Effet</label>
                                    <TargetSearchDropdown
                                        value={counter.target || ''}
                                        onUpdate={val => handleUpdate('target', val)}
                                        suggestions={targetSuggestions}
                                    />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Type d'Effet</label>
                                        <select
                                            value={counter.effectType || 'modifier'}
                                            onChange={e => handleUpdate('effectType', e.target.value)}
                                            className="w-full p-2 bg-stone-950 border border-stone-700 text-stone-300 rounded focus:border-amber-500 outline-none"
                                        >
                                            <option value="modifier">Calcul Standard</option>
                                            <option value="block_skill_increase">Blocage de Progression</option>
                                            <option value="master_skill">Maîtrise (Forcer à 5)</option>
                                            <option value="free_skill_rank">Rang Gratuit</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-4 items-end">
                                        {!['block_skill_increase', 'master_skill'].includes(counter.effectType || '') && (
                                            <div className="flex-grow">
                                                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Opération</label>
                                                <select
                                                    value={counter.operator || ''}
                                                    onChange={e => handleUpdate('operator', e.target.value as any)}
                                                    className={`w-full p-2 bg-stone-950 border text-stone-300 rounded focus:border-amber-500 outline-none ${!counter.operator ? 'border-dashed border-stone-700 text-stone-500' : 'border-stone-700'}`}
                                                >
                                                    <option value="">-- Aucune --</option>
                                                    <option value="ADD">Ajoûter (ADD)</option>
                                                    <option value="SET">Remplacer (SET)</option>
                                                    <option value="SUB">Soustraire (SUB)</option>
                                                </select>
                                            </div>
                                        )}
                                        <div className="flex flex-col items-center pb-1 min-w-[90px]">
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2 whitespace-nowrap text-center">Forcer Variante</label>
                                            <button
                                                onClick={() => handleUpdate('forceVariant', !counter.forceVariant)}
                                                className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${counter.forceVariant ? 'bg-indigo-600 shadow-glow-indigo' : 'bg-stone-800 border border-stone-700'}`}
                                            >
                                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 flex items-center justify-center ${counter.forceVariant ? 'translate-x-6' : 'translate-x-0'}`}>
                                                    {counter.forceVariant && <Sparkles size={10} className="text-indigo-600" />}
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {counter.forceVariant && (
                                <div className="mt-3 p-2 bg-indigo-950/20 border border-indigo-500/30 rounded flex gap-3 items-start animate-in slide-in-from-top-1">
                                    <Sparkles className="text-indigo-400 shrink-0 mt-0.5" size={16} />
                                    <p className="text-[10px] text-indigo-300/80 leading-relaxed font-medium">
                                        <strong className="text-indigo-300">Variante Dynamique :</strong> Le joueur devra saisir une précision qui deviendra la cible de l'effet.
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {!counter.aggregateConfig && !['block_skill_increase', 'master_skill'].includes(counter.effectType || '') && (
                        <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Équation Mathématique</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={counter.formula || ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        handleUpdate('formula', val);
                                        const words = val.split(/[\s+\-*/()]/);
                                        const lastWord = words[words.length - 1];
                                        setSearchQuery(lastWord.length > 1 ? lastWord : '');
                                    }}
                                    className={`w-full p-3 bg-stone-950 border text-stone-300 rounded font-mono text-sm focus:border-amber-500 outline-none shadow-inner ${!counter.formula ? 'border-dashed border-stone-700' : 'border-stone-700'}`}
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
                                                        const parts = counter.formula.split(/([\s+\-*/()])/);
                                                        parts[parts.length - 1] = v;
                                                        handleUpdate('formula', parts.join(''));
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
                                <div className="flex wrap gap-1.5">
                                    {allVariables
                                        .filter(v => ['TRAIT_LEVEL', 'SCENARIOS_COUNT', 'Physique', 'Volonté', 'Constitution', 'Empathie', 'Intelligence'].includes(v))
                                        .map(v => (
                                            <button
                                                key={v}
                                                onClick={() => handleUpdate('formula', (counter.formula?.trim() ? counter.formula + ' + ' : '') + v)}
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

                    <div className="flex justify-start items-center mt-2 pt-4 border-t border-stone-700/50">
                        <button
                            onClick={() => onRemove(counter.id)}
                            className="flex items-center gap-2 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded text-xs font-bold"
                        >
                            <Trash2 size={14} /> Supprimer
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
