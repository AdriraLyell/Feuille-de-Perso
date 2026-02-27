
import React from 'react';
import { TraitEffect, LibraryFormulaEntry } from '../../types';
import { Zap, X, Star, GraduationCap, Dumbbell, ChevronDown, Trophy, PlusCircle, TrendingUp, Calculator, Info, CheckCircle2, Sparkles } from 'lucide-react';

interface TraitEffectEditorProps {
    effects: TraitEffect[];
    allSkills: { id: string, name: string }[];
    allAttributes: { id: string, name: string }[];
    allCounters: { id: string, name: string }[];
    allFormulas?: LibraryFormulaEntry[];
    onAdd: () => void;
    onUpdate: <K extends keyof TraitEffect>(id: string, field: K, value: TraitEffect[K]) => void;
    onUpdateFields?: (id: string, updates: Partial<TraitEffect>) => void;
    onRemove: (id: string) => void;
}

const TraitEffectEditor: React.FC<TraitEffectEditorProps> = ({
    effects,
    allSkills,
    allAttributes,
    allCounters,
    allFormulas = [],
    onAdd,
    onUpdate,
    onUpdateFields,
    onRemove
}) => {
    return (
        <div className="p-4 bg-stone-100/5 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-4">
                <h5 className="font-serif font-black uppercase text-[10px] text-[#bfae85] tracking-widest flex items-center gap-2">
                    <Zap size={14} className="text-amber-600/60" />
                    Effets Mécaniques
                </h5>
                <button
                    onClick={onAdd}
                    className="text-[10px] bg-white/50 border border-[#bfae85]/30 hover:bg-amber-50 text-[#5c4d41] px-3 py-1 rounded-sm font-bold transition-colors shadow-sm"
                >
                    + Ajouter
                </button>
            </div>

            <div className="space-y-3">
                {(!effects || effects.length === 0) && (
                    <div className="text-center text-amber-800/40 text-xs italic py-2">
                        Aucun effet configuré. Ce trait sera purement narratif.
                    </div>
                )}
                {(effects || []).map((effect, index) => {
                    // Configuration visuelle par type
                    let typeIcon = <Star size={16} />;
                    let themeColor = 'text-amber-700';
                    let borderColor = 'border-amber-200';
                    let bgColor = 'bg-white';

                    if (effect.type === 'formula') {
                        typeIcon = <Calculator size={14} />;
                        themeColor = 'text-indigo-800';
                        borderColor = 'border-indigo-400/30';
                        bgColor = 'bg-indigo-50/40';
                    } else if (effect.type === 'free_skill_rank') {
                        typeIcon = <GraduationCap size={14} />;
                        themeColor = 'text-blue-800';
                        borderColor = 'border-blue-400/30';
                        bgColor = 'bg-blue-50/40';
                    } else if (effect.type === 'auto_counter') {
                        typeIcon = <Zap size={14} />;
                        themeColor = 'text-emerald-800';
                        borderColor = 'border-emerald-400/30';
                        bgColor = 'bg-emerald-50/40';
                    } else if (effect.type === 'master_skill') {
                        typeIcon = <Trophy size={14} />;
                        themeColor = 'text-purple-800';
                        borderColor = 'border-purple-400/30';
                        bgColor = 'bg-purple-50/40';
                    } else if (effect.type === 'xp_upgradeable') {
                        typeIcon = <TrendingUp size={14} />;
                        themeColor = 'text-orange-800';
                        borderColor = 'border-orange-400/30';
                        bgColor = 'bg-orange-50/40';
                    }

                    // Find current formula entry
                    const selectedFormulaEntry = allFormulas.find(f => f.id === effect.formulaId);
                    const isReserve = selectedFormulaEntry?.type === 'variable';

                    return (
                        <div key={effect.id || `effect-${index}`} className={`rounded-lg border ${borderColor} ${bgColor} shadow-sm overflow-hidden group`}>

                            {/* Header Row: Type Selector & Delete */}
                            <div className="flex items-center justify-between p-2 border-b border-black/5 bg-white/60">
                                <div className="flex items-center gap-2 flex-grow relative">
                                    <div className={themeColor}>{typeIcon}</div>

                                    {/* Styled Dropdown Container */}
                                    <div className="relative flex-grow">
                                        <select
                                            className={`appearance-none bg-white border border-gray-300 font-bold text-xs text-gray-900 w-full focus:outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer pr-4 py-1 pl-2 rounded shadow-sm`}
                                            value={effect.type}
                                            onChange={(e) => onUpdate(effect.id, 'type', e.target.value as any)}
                                        >
                                            <option value="formula" className="text-gray-900 bg-white font-bold bg-indigo-50">Calcul par Formule</option>

                                            {/* Legacy types hidden but kept for backwards compatibility if needed during migration */}
                                            {['free_skill_rank', 'auto_counter', 'master_skill', 'block_skill_increase', 'xp_upgradeable'].includes(effect.type) && (
                                                <optgroup label="Anciens Types (Hérités)">
                                                    <option value="free_skill_rank">Rang de Compétence Offert</option>
                                                    <option value="auto_counter">Compteur Automatique (Magie, etc.)</option>
                                                    <option value="master_skill">Maîtrise (Rang 5 direct)</option>
                                                    <option value="block_skill_increase">Bloquer une Progression</option>
                                                    <option value="xp_upgradeable">Trait Améliorable (XP)</option>
                                                </optgroup>
                                            )}
                                        </select>
                                        <ChevronDown size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${themeColor} opacity-50`} />
                                    </div>
                                </div>
                                <button onClick={() => onRemove(effect.id)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors ml-2">
                                    <X size={14} />
                                </button>
                            </div>

                            {/* Content Row: Specific Inputs */}
                            <div className="p-3">
                                {effect.type === 'free_skill_rank' ? (
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-2">
                                            <label className="block text-[9px] font-bold text-[#bfae85] mb-1 uppercase tracking-widest">Compétence</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full text-xs border border-[#bfae85]/30 rounded-sm px-2 py-1.5 appearance-none focus:border-blue-500 outline-none bg-white/80 text-[#1c1917] font-bold shadow-sm"
                                                    value={effect.target || ''}
                                                    onChange={(e) => onUpdate(effect.id, 'target', e.target.value)}
                                                >
                                                    <option value="" className="text-stone-300">-- Choisir --</option>
                                                    {allSkills.map((s, si) => (
                                                        <option key={s.id || `skill-${si}`} value={s.name}>{s.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-blue-800/40" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-bold text-[#bfae85] mb-1 uppercase tracking-widest text-center">Rang Offert</label>
                                            <input
                                                type="number"
                                                className="w-full text-xs border border-[#bfae85]/30 rounded-sm px-2 py-1.5 text-center focus:border-blue-500 outline-none bg-white/80 text-[#1c1917] font-bold shadow-sm font-mono"
                                                value={effect.value}
                                                onChange={(e) => onUpdate(effect.id, 'value', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                ) : effect.type === 'block_skill_increase' ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex flex-col">
                                            <label className="block text-[9px] font-bold text-[#bfae85] mb-1 uppercase tracking-widest">Compétence à bloquer</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full text-xs border border-[#bfae85]/30 rounded-sm px-2 py-1.5 appearance-none focus:border-red-500 outline-none bg-white/80 text-[#1c1917] font-bold shadow-sm"
                                                    value={effect.target || ''}
                                                    onChange={(e) => onUpdate(effect.id, 'target', e.target.value)}
                                                >
                                                    <option value="" className="text-stone-300">-- Choisir --</option>
                                                    {allSkills.map((s, si) => (
                                                        <option key={s.id || `skill-${si}`} value={s.name}>{s.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-red-800/40" />
                                            </div>
                                            <p className="text-[9px] text-[#8b2e2e]/60 mt-1 italic leading-tight">
                                                Cette compétence ne pourra plus être augmentée par le joueur. Les points futurs seront masqués et le nom barré.
                                            </p>
                                        </div>
                                    </div>
                                ) : effect.type === 'auto_counter' ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-start gap-2">
                                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide w-24 mt-1">Nom de Base :</span>
                                            <div className="flex-grow">
                                                <input
                                                    type="text"
                                                    className="w-full border border-emerald-400/30 rounded-sm px-2 py-1 text-sm focus:border-emerald-500 outline-none bg-white text-stone-800 font-bold shadow-sm"
                                                    placeholder="Optionnel (ex: Munitions, Magie)..."
                                                    value={effect.target || ''}
                                                    onChange={(e) => onUpdate(effect.id, 'target', e.target.value)}
                                                />
                                                <p className="text-[9px] text-emerald-700/60 mt-1 italic leading-tight">
                                                    Si vide, utilise le <strong>Nom du Trait</strong> ou de la <strong>Variante</strong>.<br />
                                                    Max 10. Automatiquement instancié sur la fiche du joueur.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : effect.type === 'xp_upgradeable' ? (
                                    <div className="flex flex-col gap-1 p-1 bg-orange-50/50 rounded border border-orange-200/50">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp size={14} className="text-orange-600" />
                                            <span className="text-[10px] font-bold text-orange-900 uppercase">Clé de Progression XP</span>
                                        </div>
                                        <p className="text-[9px] text-orange-800/70 italic leading-tight">
                                            En ajoutant cet effet, les joueurs pourront dépenser de l'XP sur ce trait pour l'augmenter, déclenchant le coût de progression système.
                                        </p>
                                    </div>
                                ) : effect.type === 'master_skill' ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-start gap-2">
                                            <Trophy size={14} className="text-purple-600 mt-0.5 shrink-0" />
                                            <p className="text-[10px] text-purple-800 leading-tight">
                                                Quand le joueur ajoute ce trait, il choisit une <strong>compétence à rang 0</strong>.<br />
                                                Celle-ci est automatiquement mise au <strong>rang 5</strong>, gratuitement (sans coût XP).<br />
                                                La compétence revient à 0 si le trait est supprimé.
                                            </p>
                                        </div>
                                    </div>
                                ) : effect.type === 'formula' ? (
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
                                                                // Fallback if not provided, though it might bug in React
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

                                        {isReserve ? (
                                            <div className="bg-amber-100/30 p-2 rounded border border-amber-200/50 flex items-start gap-2 animate-in fade-in duration-300">
                                                <Info size={14} className="text-amber-700 shrink-0 mt-0.5" />
                                                <p className="text-[9px] text-amber-800 leading-tight">
                                                    Cette formule étant de type <strong>Réserve Joueur</strong> (Automatique), elle s'affichera comme une jauge.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-3 animate-in fade-in duration-300">
                                                {/* Affichage des paramètres hérités FIGÉS */}
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
                                                    {/* Saisie de la CIBLE si absente du modèle */}
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

                                                    {/* Saisie de l'OPÉRATEUR si absent du modèle */}
                                                    {!selectedFormulaEntry?.operator && (
                                                        <div>
                                                            <label className="block text-[9px] font-bold text-amber-800 mb-1 uppercase tracking-widest flex items-center gap-1">
                                                                Opération <span className="text-amber-600/50 font-normal lowercase italic">(à définir)</span>
                                                            </label>
                                                            <div className="relative">
                                                                <select
                                                                    className="w-full text-xs border border-amber-400/30 rounded-sm px-2 py-1.5 appearance-none focus:border-amber-500 outline-none bg-amber-50/20 font-bold text-stone-800 shadow-sm"
                                                                    value={effect.operator || 'ADD'}
                                                                    onChange={(e) => onUpdate(effect.id, 'operator', e.target.value as any)}
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

                                                {/* ÉQUATION vs VALEUR FIXE */}
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
                                                ) : selectedFormulaEntry?.formula ? (
                                                    <div className="p-2 bg-stone-100 rounded border border-stone-200">
                                                        <span className="text-[8px] font-bold text-stone-400 uppercase tracking-tighter block mb-1">Moteur Mathématique Hérité</span>
                                                        <code className="text-[10px] font-mono font-bold text-stone-600">{selectedFormulaEntry.formula}</code>
                                                    </div>
                                                ) : (
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
                                                                    onClick={() => onUpdate(effect.id, 'formula', (parseInt(effect.formula || '0') - 1).toString())}
                                                                    className="w-6 h-6 flex items-center justify-center bg-white border border-stone-200 rounded hover:bg-stone-50 text-stone-600"
                                                                >-</button>
                                                                <button
                                                                    onClick={() => onUpdate(effect.id, 'formula', (parseInt(effect.formula || '0') + 1).toString())}
                                                                    className="w-6 h-6 flex items-center justify-center bg-white border border-stone-200 rounded hover:bg-stone-50 text-stone-600"
                                                                >+</button>
                                                            </div>
                                                        </div>
                                                        <p className="text-[8px] text-amber-700/60 mt-1 italic italic">Saisissez un nombre ou une petite équation locale.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="col-span-2">
                                            <label className="block text-[9px] font-bold text-[#bfae85] mb-1 uppercase tracking-widest">Attribut</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full text-xs border border-[#bfae85]/30 rounded-sm px-2 py-1.5 appearance-none focus:border-[#8b2e2e] outline-none bg-white/80 text-[#1c1917] font-bold shadow-sm"
                                                    value={effect.target || ''}
                                                    onChange={(e) => onUpdate(effect.id, 'target', e.target.value)}
                                                >
                                                    <option value="" className="text-stone-300">-- Choisir --</option>
                                                    {allAttributes.map((a, ai) => (
                                                        <option key={a.id || `attr-${ai}`} value={a.name}>{a.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[#8b2e2e]/40" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-bold text-[#bfae85] mb-1 uppercase tracking-widest text-center">Bonus (+)</label>
                                            <input
                                                type="number"
                                                className="w-full text-xs border border-[#bfae85]/30 rounded-sm px-2 py-1.5 text-center focus:border-[#8b2e2e] outline-none bg-white/80 text-[#1c1917] font-bold shadow-sm font-mono"
                                                value={effect.value}
                                                onChange={(e) => onUpdate(effect.id, 'value', parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div >
    );
};

export default TraitEffectEditor;
