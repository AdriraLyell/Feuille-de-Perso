import React, { useState, useRef, useEffect } from 'react';
import { RulesData } from '../../../types/rules';
import { LibraryFormulaEntry } from '../../../types';
import { evaluateFormula } from '../../../utils/formulaEvaluator';
import { Trash2, Calculator, Info, Check, Sigma, AlertCircle, Sparkles } from 'lucide-react';
import { Parser } from 'expr-eval';
import { normalizeString } from '../../../utils/stringUtils';

// --- Utility Functions (moved from AdminFormulasEditor) ---
const isFormulaSyntaxValid = (formula?: string): boolean => {
    if (!formula || formula.trim() === '') return true;
    try {
        const parser = new Parser();
        parser.parse(formula);
        return true;
    } catch (e) {
        return false;
    }
};

const isTargetValid = (target: string, rules: RulesData): boolean => {
    if (!target) return true;
    const cleanTarget = target.trim().toLowerCase();
    if (cleanTarget === 'xp' || cleanTarget === 'total') return true;

    // Check Attributes
    const allAttributes = Object.values(rules.definitions.attributes || {}).flat();
    if (allAttributes.some(a => a.toLowerCase() === cleanTarget)) return true;

    // Check Secondary
    const secondaryAttributes = Object.values(rules.definitions.secondaryAttributes || {}).flat();
    if (secondaryAttributes.some(a => a.toLowerCase() === cleanTarget)) return true;

    // Check Counters
    const allCounters = Object.values(rules.definitions.counters || {}).map(c => c.name);
    if (allCounters.some(c => c.toLowerCase() === cleanTarget)) return true;

    // Check Skills
    const allSkills = Object.values(rules.definitions.skills || {}).flat();
    if (allSkills.some(s => s.toLowerCase() === cleanTarget)) return true;

    const allLibSkills = rules.libraries.skills?.map(s => s.name) || [];
    if (allLibSkills.some(s => s.toLowerCase() === cleanTarget)) return true;

    return false;
};

/**
 * Specialized input to avoid cursor jumping when performing transformations like toUpperCase()
 */
const CodeInput: React.FC<{
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    className?: string;
}> = ({ value, onChange, placeholder, className }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        if (value !== localValue) {
            setLocalValue(value);
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const val = input.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');

        setLocalValue(val);
        onChange(val);

        // Restore cursor after state update/re-render
        requestAnimationFrame(() => {
            if (inputRef.current) {
                inputRef.current.setSelectionRange(start, end);
            }
        });
    };

    return (
        <input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={handleChange}
            placeholder={placeholder}
            className={className}
        />
    );
};

// --- Main component ---
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
    const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const targetDropdownRef = useRef<HTMLDivElement>(null);

    // Clicks outside pour fermer le dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (targetDropdownRef.current && !targetDropdownRef.current.contains(event.target as Node)) {
                setIsTargetDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const preview = isEditing && previewValue !== null ? previewValue : evaluateFormula(counter.formula || '', currentPreviewData, { entry: counter });

    // Calcul du statut de validation
    let validationStatus: 'valid' | 'warning' | 'error' = 'valid';
    let tooltipMessage = "Formule complète et valide";

    // L'équation mathématique doit être analysable (sauf si c'est un agrégat auto)
    const isMathValid = counter.aggregateConfig ? true : isFormulaSyntaxValid(counter.formula);

    if (!isMathValid) {
        validationStatus = 'error';
        tooltipMessage = "Syntaxe mathématique invalide";
    } else if (counter.type === 'modifier' || (counter as any).type === 'effect') {
        const hasTarget = !!(counter.target && counter.target.trim() !== '');
        const hasOperator = !!(counter.operator && (counter.operator as string) !== '');
        const hasEquation = !!(counter.formula && counter.formula.trim() !== '');
        const actualEffectType = counter.effectType || 'modifier';
        const hasEffectType = !!(actualEffectType && actualEffectType !== '');

        if (!hasEffectType) {
            validationStatus = 'error';
            tooltipMessage = "Type d'effet manquant";
        } else if (hasTarget && !counter.forceVariant && !isTargetValid(counter.target!, rules)) {
            validationStatus = 'error';
            tooltipMessage = `La cible '${counter.target}' n'existe pas dans les règles`;
        } else if ((!hasTarget && !counter.forceVariant) || !hasOperator || !hasEquation) {
            validationStatus = 'warning';
            tooltipMessage = "Modèle incomplet (sera complété dans le trait)";
        } else if (counter.forceVariant && !hasTarget) {
            validationStatus = 'warning';
            tooltipMessage = "Cible vide : Le joueur devra saisir le nom manuellement.";
        }
    } else {
        // Pour une variable simple
        if (!counter.formula || counter.formula.trim() === '') {
            validationStatus = 'warning';
            tooltipMessage = "Équation vide (sera complétée dans le trait)";
        }
    }

    const isValid = validationStatus !== 'error';

    return (
        <div className={`border rounded-sm overflow-hidden transition-all ${isEditing ? 'border-amber-500 ring-1 ring-amber-500/50 bg-stone-900/80' : 'border-stone-700/50 bg-stone-900/40 hover:border-amber-500/30'}`}>
            {/* Header */}
            <div
                className="p-3 flex justify-between items-center cursor-pointer"
                onClick={() => {
                    if (!isEditing) {
                        onEditStart();
                    }
                }}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${counter.type === 'variable' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-amber-500/10 text-amber-500'
                        }`}>
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
                                onChange={e => onUpdate(counter.id, 'name', e.target.value)}
                                className="w-full p-2 bg-stone-950 border border-stone-700 text-stone-300 rounded focus:border-amber-500 outline-none"
                            />
                        </div>
                        <div className="col-span-3">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                Code <span className="text-stone-600 italic">(UPPERCASE)</span>
                            </label>
                            <CodeInput
                                value={counter.code || ''}
                                onChange={val => onUpdate(counter.id, 'code', val)}
                                placeholder="EX: MA_VARIABLE"
                                className="w-full p-2 bg-stone-950 border border-stone-700 text-amber-500 font-mono text-xs rounded focus:border-amber-500 outline-none"
                            />
                        </div>
                        <div className="col-span-5">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Description (Optionnel)</label>
                            <input
                                type="text"
                                value={counter.description || ''}
                                onChange={e => onUpdate(counter.id, 'description', e.target.value)}
                                className="w-full p-2 bg-stone-950 border border-stone-700 text-stone-300 rounded focus:border-amber-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Rôle de la Formule</label>
                        <div className="flex gap-2 p-1 bg-stone-950 rounded border border-stone-700/50 w-fit">
                            <button
                                onClick={() => onUpdate(counter.id, 'type', 'variable')}
                                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${counter.type === 'variable' ? 'bg-blue-600 text-white shadow-glow-blue' : 'text-stone-400 hover:text-stone-300'}`}
                            >
                                Variable MJ (Calcul)
                            </button>
                            <button
                                onClick={() => onUpdate(counter.id, 'type', 'modifier')}
                                className={`px-3 py-1 text-xs font-bold rounded transition-colors ${counter.type === 'modifier' || (counter as any).type === 'effect' ? 'bg-amber-600 text-stone-900 border-amber-400/50' : 'text-stone-400 hover:text-stone-300'}`}
                            >
                                Effet (Modificateur)
                            </button>
                        </div>
                        <p className="text-[10px] text-stone-500 mt-2 italic px-1">
                            {counter.type === 'variable' && "Sert de brique de calcul interne (ex: SUM_MYSTIC ou MENACE)."}
                            {(counter.type === 'modifier' || (counter as any).type === 'effect') && "Modifie une caractéristique existante. Utilisable comme effet de trait."}
                        </p>
                    </div>

                    {counter.type === 'variable' && (
                        <div className="animate-in fade-in slide-in-from-top-2">
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Source de la Variable</label>
                            <div className="flex gap-2 p-1 bg-stone-950 rounded border border-stone-700/50 w-fit">
                                <button
                                    onClick={() => onUpdate(counter.id, 'aggregateConfig', undefined)}
                                    className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${!counter.aggregateConfig ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-stone-500 hover:text-stone-400'}`}
                                >
                                    Équation Libre
                                </button>
                                <button
                                    onClick={() => onUpdate(counter.id, 'aggregateConfig', { operation: 'sum', targetType: 'skills', filterTarget: 'tag', filterValue: 'Mystique' })}
                                    className={`px-3 py-1 text-[10px] font-bold rounded transition-colors ${counter.aggregateConfig ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'text-stone-500 hover:text-stone-400'}`}
                                >
                                    Somme Automatique (Agrégat)
                                </button>
                            </div>

                            {counter.aggregateConfig && (
                                <div className="mt-4 p-3 bg-stone-950 border border-blue-500/20 rounded grid grid-cols-2 gap-4 animate-in zoom-in-95">
                                    <div>
                                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Opération</label>
                                        <select
                                            value={counter.aggregateConfig.operation}
                                            onChange={e => onUpdate(counter.id, 'aggregateConfig', { ...counter.aggregateConfig, operation: e.target.value })}
                                            className="w-full bg-stone-900 border border-stone-700 text-stone-300 text-xs p-2 rounded outline-none focus:border-blue-500"
                                        >
                                            <option value="sum">Somme (Total des points)</option>
                                            <option value="count">Nombre (Total d'éléments)</option>
                                            <option value="max">Maximum (Plus haut score)</option>
                                            <option value="avg">Moyenne</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Groupe Cible</label>
                                        <select
                                            value={counter.aggregateConfig.targetType}
                                            onChange={e => onUpdate(counter.id, 'aggregateConfig', { ...counter.aggregateConfig, targetType: e.target.value })}
                                            className="w-full bg-stone-900 border border-stone-700 text-stone-300 text-xs p-2 rounded outline-none focus:border-blue-500"
                                        >
                                            <option value="skills">Compétences</option>
                                            <option value="attributes">Attributs</option>
                                            <option value="traits">Traits (Avantages/Désav.)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Filtrer par</label>
                                        <select
                                            value={counter.aggregateConfig.filterTarget}
                                            onChange={e => onUpdate(counter.id, 'aggregateConfig', { ...counter.aggregateConfig, filterTarget: e.target.value })}
                                            className="w-full bg-stone-900 border border-stone-700 text-stone-300 text-xs p-2 rounded outline-none focus:border-blue-500"
                                        >
                                            <option value="tag">Tag (ex: Mystique)</option>
                                            <option value="category">Catégorie / Colonne</option>
                                            <option value="name">Nom Contient</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Mot-clé du filtre</label>
                                        <input
                                            type="text"
                                            value={counter.aggregateConfig.filterValue}
                                            onChange={e => onUpdate(counter.id, 'aggregateConfig', { ...counter.aggregateConfig, filterValue: e.target.value })}
                                            className="w-full bg-stone-900 border border-stone-700 text-stone-300 text-xs p-2 rounded outline-none focus:border-blue-500"
                                            placeholder="ex: Mystique"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {(counter.type === 'modifier' || (counter as any).type === 'effect') && (
                        <React.Fragment>
                            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Cible de l'Effet (ex: Force, XP, PV)</label>
                                    <div className="relative" ref={targetDropdownRef}>
                                        <input
                                            type="text"
                                            value={counter.target || ''}
                                            autoComplete="off"
                                            onFocus={() => setIsTargetDropdownOpen(true)}
                                            onChange={e => {
                                                onUpdate(counter.id, 'target', e.target.value);
                                                setIsTargetDropdownOpen(true);
                                            }}
                                            className={`w-full p-2 bg-stone-950 border text-stone-300 rounded focus:border-amber-500 outline-none ${!counter.target ? 'border-dashed border-stone-700' : 'border-stone-700'}`}
                                            placeholder="Cible libre (ex: Force)"
                                        />

                                        {isTargetDropdownOpen && (
                                            <div className="absolute z-50 w-full mt-1 bg-stone-900 border border-amber-500/30 rounded shadow-2xl max-h-96 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                                                {targetSuggestions
                                                    .filter((s: any) => !counter.target || s.value.toLowerCase().includes(counter.target.toLowerCase()) || s.type.toLowerCase().includes(counter.target.toLowerCase()))
                                                    .map((s: any, idx: number) => (
                                                        <button
                                                            key={`${s.value}-${idx}`}
                                                            onClick={() => {
                                                                onUpdate(counter.id, 'target', s.value);
                                                                setIsTargetDropdownOpen(false);
                                                            }}
                                                            className="w-full text-left px-3 py-2 hover:bg-amber-500/10 border-b border-stone-800/50 last:border-0 group flex justify-between items-center transition-colors"
                                                        >
                                                            <span className="font-bold text-stone-300 group-hover:text-amber-500">{s.value}</span>
                                                            <span className="text-[9px] uppercase font-bold text-stone-600 px-1.5 py-0.5 bg-stone-950 rounded border border-stone-800">{s.type}</span>
                                                        </button>
                                                    ))}
                                                {targetSuggestions.filter((s: any) => !counter.target || s.value.toLowerCase().includes(counter.target.toLowerCase())).length === 0 && (
                                                    <div className="p-3 text-xs text-stone-600 italic text-center">
                                                        Aucune suggestion correspondante
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {!counter.target && <div className="absolute right-2 top-2 text-[8px] text-amber-500/50 font-bold uppercase pointer-events-none">Optionnel</div>}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Type d'Effet</label>
                                        <select
                                            value={counter.effectType || 'modifier'}
                                            onChange={e => onUpdate(counter.id, 'effectType', e.target.value)}
                                            className="w-full p-2 bg-stone-950 border border-stone-700 text-stone-300 rounded focus:border-amber-500 outline-none"
                                        >
                                            <option value="modifier">Calcul Standard (Attribut, XP, Réserve)</option>
                                            <option value="block_skill_increase">Blocage de Progression</option>
                                            <option value="master_skill">Maîtrise (Forcer à 5)</option>
                                            <option value="free_skill_rank">Rang Gratuit (Cumulable)</option>
                                        </select>
                                    </div>

                                    <div className="flex gap-4 items-end">
                                        {counter.effectType !== 'block_skill_increase' && counter.effectType !== 'master_skill' && (
                                            <div className="flex-grow">
                                                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Opération</label>
                                                <select
                                                    value={counter.operator || ''}
                                                    onChange={e => onUpdate(counter.id, 'operator', e.target.value as any)}
                                                    className={`w-full p-2 bg-stone-950 border text-stone-300 rounded focus:border-amber-500 outline-none ${!counter.operator ? 'border-dashed border-stone-700 text-stone-500' : 'border-stone-700'}`}
                                                >
                                                    <option value="">-- Aucune (à définir dans le trait) --</option>
                                                    <option value="ADD">Ajoûter (ADD)</option>
                                                    <option value="SET">Remplacer (SET)</option>
                                                    <option value="SUB">Soustraire (SUB)</option>
                                                </select>
                                            </div>
                                        )}

                                        <div className="flex flex-col items-center pb-1 min-w-[90px]">
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2 whitespace-nowrap text-center">Forcer Variante</label>
                                            <button
                                                onClick={() => onUpdate(counter.id, 'forceVariant', !counter.forceVariant)}
                                                className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${counter.forceVariant ? 'bg-indigo-600 shadow-glow-indigo' : 'bg-stone-800 border border-stone-700'}`}
                                                title={counter.forceVariant ? 'Variante activée' : 'Activer la variante'}
                                            >
                                                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 flex items-center justify-center ${counter.forceVariant ? 'translate-x-6' : 'translate-x-0'}`}>
                                                    {counter.forceVariant && <Sparkles size={10} className="text-indigo-600" />}
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {counter.forceVariant && (
                                <div className="mt-3 p-2 bg-indigo-950/20 border border-indigo-500/30 rounded flex gap-3 items-start animate-in slide-in-from-top-1 duration-300">
                                    <Sparkles className="text-indigo-400 shrink-0 mt-0.5" size={16} />
                                    <div>
                                        <p className="text-[10px] text-indigo-300/80 leading-relaxed font-medium">
                                            <strong className="text-indigo-300">Logique de Variante Dynamique :</strong> Le trait utilisant cette mécanique exigera une précision (Variante) de la part du joueur.
                                            Cette précision deviendra la cible de l'effet.
                                        </p>
                                        <p className="text-[10px] text-indigo-400/60 mt-1 italic">
                                            Note : Indiquez "Compétence" ou "Attribut" dans le champ Cible pour suggérer une liste au joueur.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    )}

                    {!counter.aggregateConfig && counter.effectType !== 'block_skill_increase' && counter.effectType !== 'master_skill' && (
                        <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Équation Mathématique</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={counter.formula || ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        onUpdate(counter.id, 'formula', val);

                                        // Get the word under cursor or last word
                                        const words = val.split(/[\s+\-*/()]/);
                                        const lastWord = words[words.length - 1];
                                        setSearchQuery(lastWord.length > 1 ? lastWord : '');
                                    }}
                                    className={`w-full p-3 bg-stone-950 border text-stone-300 rounded font-mono text-sm focus:border-amber-500 outline-none shadow-inner ${!counter.formula ? 'border-dashed border-stone-700' : 'border-stone-700'}`}
                                    placeholder="Laisse vide pour saisir une Valeur Fixe dans le trait"
                                />
                                {!counter.formula && <div className="absolute right-3 top-3 text-[8px] text-amber-500/50 font-bold uppercase">Modèle de valeur</div>}

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
                                                        onUpdate(counter.id, 'formula', parts.join(''));
                                                        setSearchQuery('');
                                                    }}
                                                    className="w-full text-left p-2 hover:bg-amber-600 hover:text-stone-950 text-stone-300 text-xs border-b border-stone-800 last:border-0 transition-colors"
                                                >
                                                    {v}
                                                </button>
                                            ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-3">
                                <span className="text-[10px] text-stone-500 flex items-center gap-1 uppercase tracking-widest font-bold mb-2">
                                    <Info size={12} /> Suggestions rapides (cliquez pour ajouter) :
                                </span>
                                <div className="flex wrap gap-1.5">
                                    {allVariables
                                        .filter(v => ['TRAIT_LEVEL', 'SCENARIOS_COUNT', 'Physique', 'Volonté', 'Constitution', 'Empathie', 'Intelligence'].includes(v))
                                        .map(v => (
                                            <button
                                                key={v}
                                                onClick={() => onUpdate(counter.id, 'formula', (counter.formula.trim() ? counter.formula + ' + ' : '') + v)}
                                                className="text-[10px] px-2 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded font-mono text-stone-400 transition-all hover:text-amber-400"
                                            >
                                                {v}
                                            </button>
                                        ))
                                    }
                                    <span className="text-stone-700 text-[10px] self-center ml-2 italic">Tapez pour chercher d'autres variables...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-start items-center mt-2 pt-4 border-t border-stone-700/50">
                        <button
                            onClick={() => onRemove(counter.id)}
                            className="flex items-center gap-2 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded text-xs font-bold transition-colors"
                        >
                            <Trash2 size={14} /> Supprimer
                        </button>
                    </div>
                </div>
            )
            }
        </div>
    );
};
