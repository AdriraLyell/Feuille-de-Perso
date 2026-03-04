import React from 'react';
import { ChevronDown, Sparkles, Info, CheckCircle2, Calculator } from 'lucide-react';
import { TraitEffect, LibraryFormulaEntry } from '../../../types';

interface FormulaEffectFieldsProps {
    effect: TraitEffect;
    allFormulas: LibraryFormulaEntry[];
    allAttributes: { id: string; name: string }[];
    allCounters: { id: string; name: string }[];
    onUpdate: (id: string, field: keyof TraitEffect, value: string | number | undefined) => void;
    onUpdateFields?: (id: string, updates: Partial<TraitEffect>) => void;
}

export const FormulaEffectFields: React.FC<FormulaEffectFieldsProps> = ({
    effect,
    allFormulas,
    allAttributes,
    allCounters,
    onUpdate,
    onUpdateFields
}) => {
    const selectedFormulaEntry = allFormulas.find(f => f.id === effect.formulaId);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col">
                <label className="block text-[9px] font-bold text-indigo-800 mb-1 uppercase tracking-widest flex justify-between items-center">
                    <span>Choisir la Formule Globale</span>
                    <span className="text-[8px] font-normal normal-case opacity-70 italic">Dictionnaire MJ</span>
                </label>
                <div className="relative">
                    <select
                        className="w-full text-xs border border-indigo-400/30 rounded-sm px-2 py-1.5 appearance-none focus:border-indigo-500 outline-none bg-white font-bold text-stone-800 shadow-sm"
                        value={effect.formulaId || ''}
                        onChange={(e) => {
                            const fid = e.target.value;

                            const entry = allFormulas.find(f => f.id === fid);
                            if (entry) {
                                const updates: Partial<TraitEffect> = {
                                    formulaId: fid,
                                    formula: entry.formula
                                };
                                if (entry.target) updates.target = entry.target;
                                if (entry.operator) updates.operator = entry.operator;

                                if (onUpdateFields) {
                                    onUpdateFields(effect.id, updates);
                                } else {
                                    onUpdate(effect.id, 'formulaId', fid);
                                    onUpdate(effect.id, 'formula', entry.formula);
                                    if (entry.target) onUpdate(effect.id, 'target', entry.target);
                                    if (entry.operator) onUpdate(effect.id, 'operator', entry.operator);
                                }
                            } else {
                                onUpdate(effect.id, 'formulaId', fid);
                            }
                        }}
                    >
                        <option value="" className="italic text-stone-500">-- Choisir une mécanique globale --</option>
                        {allFormulas.map(f => (
                            <option key={f.id} value={f.id}>
                                {f.type === 'variable' ? '⭐ ' : '⚙️ '}{f.name}
                                {f.forceVariant ? ' (Forcer Variante)' :
                                    f.effectType === 'block_skill_increase' ? ' (Blocage)' :
                                        f.effectType === 'master_skill' ? ' (Maîtrise)' :
                                            f.formula ? ` (${f.formula})` : ''}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-800/40" />
                </div>
            </div>

            {selectedFormulaEntry?.type === 'variable' ? (
                <div className="bg-amber-100/30 p-2 rounded border border-amber-200/50 flex items-start gap-2 animate-in fade-in duration-300">
                    <Info size={14} className="text-amber-700 shrink-0 mt-0.5" />
                    <p className="text-[9px] text-amber-800 leading-tight">
                        Cette formule étant de type <strong>Réserve Joueur</strong> (Automatique), elle s'affichera comme une jauge.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                    {(selectedFormulaEntry?.target || selectedFormulaEntry?.forceVariant || (selectedFormulaEntry?.operator && selectedFormulaEntry?.effectType !== 'block_skill_increase' && selectedFormulaEntry?.effectType !== 'master_skill')) && (
                        <div className="bg-indigo-100/10 p-2 rounded border border-indigo-200/20 flex flex-wrap gap-2 items-center">
                            {selectedFormulaEntry.forceVariant ? (
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-tighter">Cible Dynamique</span>
                                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/30 flex items-center gap-1.5">
                                        <Sparkles size={10} className="text-indigo-400" />
                                        Variante du Trait
                                        {selectedFormulaEntry.target && (
                                            <span className="text-[8px] font-normal text-indigo-400 italic">(Suggestions : {selectedFormulaEntry.target})</span>
                                        )}
                                    </span>
                                </div>
                            ) : selectedFormulaEntry.target && (
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-tighter">Cible Héritée</span>
                                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/30">{selectedFormulaEntry.target}</span>
                                </div>
                            )}
                            {selectedFormulaEntry.operator && selectedFormulaEntry.effectType !== 'block_skill_increase' && selectedFormulaEntry.effectType !== 'master_skill' && (
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-tighter">Opérateur Hérité</span>
                                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/30">
                                        {selectedFormulaEntry.operator === 'ADD' ? 'Ajoûter (+)' :
                                            selectedFormulaEntry.operator === 'SET' ? 'Remplacer (=)' :
                                                selectedFormulaEntry.operator === 'SUB' ? 'Soustraire (-)' : 'Standard'}
                                    </span>
                                </div>
                            )}
                            <div className="ml-auto text-[8px] font-black text-indigo-300/50 uppercase tracking-widest">Fixé MJ</div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        {!selectedFormulaEntry?.target && (
                            <div>
                                <label className="block text-[9px] font-bold text-amber-800 mb-1 uppercase tracking-widest flex items-center gap-1">
                                    Cible <span className="text-amber-600/50 font-normal lowercase italic">(à définir)</span>
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full text-xs border border-amber-400/30 rounded-sm px-2 py-1.5 appearance-none focus:border-amber-500 outline-none bg-amber-50/20 font-bold text-stone-800 shadow-sm"
                                        value={effect.target || ''}
                                        onChange={(e) => onUpdate(effect.id, 'target', e.target.value)}
                                    >
                                        <option value="" className="italic text-stone-500">-- Choisir --</option>
                                        <option value="XP">Points d'Expérience</option>
                                        <optgroup label="Attributs">
                                            {allAttributes.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                                        </optgroup>
                                        <optgroup label="Compteurs / Réserves">
                                            {allCounters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </optgroup>
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-amber-800/40" />
                                </div>
                            </div>
                        )}

                        {!selectedFormulaEntry?.operator &&
                            selectedFormulaEntry?.effectType !== 'block_skill_increase' &&
                            selectedFormulaEntry?.effectType !== 'master_skill' && (
                                <div>
                                    <label className="block text-[9px] font-bold text-amber-800 mb-1 uppercase tracking-widest flex items-center gap-1">
                                        Opération <span className="text-amber-600/50 font-normal lowercase italic">(à définir)</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="w-full text-xs border border-amber-400/30 rounded-sm px-2 py-1.5 appearance-none focus:border-amber-500 outline-none bg-amber-50/20 font-bold text-stone-800 shadow-sm"
                                            value={effect.operator || 'ADD'}
                                            onChange={(e) => onUpdate(effect.id, 'operator', e.target.value as TraitEffect['operator'])}
                                        >
                                            <option value="ADD">Ajoûter (+)</option>
                                            <option value="SET">Remplacer (=)</option>
                                            <option value="SUB">Soustraire (-)</option>
                                        </select>
                                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-amber-800/40" />
                                    </div>
                                </div>
                            )}
                    </div>

                    {selectedFormulaEntry?.formula && selectedFormulaEntry?.effectType !== 'block_skill_increase' && selectedFormulaEntry?.effectType !== 'master_skill' ? (
                        <div className="p-2 bg-stone-100 rounded border border-stone-200">
                            <span className="text-[8px] font-bold text-stone-400 uppercase tracking-tighter block mb-1">Moteur Mathématique Hérité</span>
                            <code className="text-[10px] font-mono font-bold text-stone-600">{selectedFormulaEntry.formula}</code>
                        </div>
                    ) : selectedFormulaEntry?.effectType === 'block_skill_increase' || selectedFormulaEntry?.effectType === 'master_skill' ? (
                        <div className="p-2 bg-indigo-50/50 rounded border border-indigo-200/30 flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-indigo-600" />
                            <span className="text-[9px] font-bold text-indigo-800 uppercase italic">
                                {selectedFormulaEntry.effectType === 'block_skill_increase' ? 'Logique de Blocage Active' : 'Logique de Maîtrise Active'}
                            </span>
                        </div>
                    ) : (selectedFormulaEntry?.effectType !== 'block_skill_increase' && selectedFormulaEntry?.effectType !== 'master_skill') ? (
                        <div className="flex flex-col p-2 bg-amber-50/50 rounded border border-amber-200/50 border-dashed">
                            <label className="block text-[9px] font-bold text-amber-800 mb-1 uppercase tracking-widest">Valeur Fixe pour l'Effet</label>
                            <div className="flex items-center gap-2">
                                <Calculator size={14} className="text-amber-600/50" />
                                <input
                                    type="text"
                                    className="flex-grow text-xs border border-amber-400/30 rounded-sm px-2 py-1 focus:border-amber-500 outline-none bg-white font-mono font-bold text-amber-900"
                                    value={effect.formula || ''}
                                    onChange={(e) => onUpdate(effect.id, 'formula', e.target.value)}
                                    placeholder="ex: 10"
                                />
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => onUpdate(effect.id, 'formula', (parseInt(effect.formula || '0') - 1).toString())}
                                        className="w-6 h-6 flex items-center justify-center bg-white border border-stone-200 rounded hover:bg-stone-50 text-stone-600"
                                    >-</button>
                                    <button
                                        type="button"
                                        onClick={() => onUpdate(effect.id, 'formula', (parseInt(effect.formula || '0') + 1).toString())}
                                        className="w-6 h-6 flex items-center justify-center bg-white border border-stone-200 rounded hover:bg-stone-50 text-stone-600"
                                    >+</button>
                                </div>
                            </div>
                            <p className="text-[8px] text-amber-700/60 mt-1 italic">Saisissez un nombre ou une petite équation locale.</p>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};
