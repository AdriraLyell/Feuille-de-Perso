import React, { useState } from 'react';
import { RulesData } from '../../../types/rules';
import { LibraryFormulaEntry } from '../../../types';
import { generateId } from '../../../utils/factories';
import { evaluateFormula } from '../../../utils/formulaEvaluator';
import { Trash2, Plus, Calculator, Info, Check, Wand2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { MotionCard } from '../../../components/ui/motion/MotionCard';

const DUMMY_PREVIEW_DATA: any = {
    experience: { total: 25, gain: "25" },
    attributes: {
        Physiologie: [
            { name: 'Physique', val2: '3' },
            { name: 'Vigueur', val2: '2' },
            { name: 'Agilité', val2: '3' }
        ],
        Mental: [
            { name: 'Volonté', val2: '4' },
            { name: 'Intelligence', val2: '3' },
            { name: 'Perception', val2: '2' }
        ],
        Social: [
            { name: 'Charisme', val2: '3' },
            { name: 'Empathie', val2: '2' },
            { name: 'Manipulation', val2: '1' }
        ]
    },
    skills: {
        col1: [{ name: 'Arts Martiaux', value: 3 }, { name: 'Athlétisme', value: 2 }],
        col2: [{ name: 'Savoir Mystique', value: 2 }]
    }
};

interface AdminFormulasEditorProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
}

const AdminFormulasEditor: React.FC<AdminFormulasEditorProps> = ({ rules, onUpdate }) => {
    const lib = rules.libraries?.formulas || [];
    const formulaCounters = lib; // Now it contains all formulas

    const [editingId, setEditingId] = useState<string | null>(null);
    const [previewValue, setPreviewValue] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const allVariables = [
        'XP_TOTAL',
        'SUM_MYSTIC',
        ...Object.values(rules.definitions.attributes).flat(),
        ...Object.values(rules.definitions.secondaryAttributes || {}).flat(),
        ...(rules.libraries.skills || []).map(s => s.name)
    ].filter((v, i, a) => a.indexOf(v) === i); // Unique values

    const handleUpdate = (newLib: LibraryFormulaEntry[]) => {
        onUpdate({
            ...rules,
            libraries: {
                ...rules.libraries,
                formulas: newLib
            }
        });
    };

    const addCounter = () => {
        const newCounter: LibraryFormulaEntry = {
            id: generateId(),
            name: "Nouvelle Formule",
            type: 'effect',
            formula: "10",
            isActive: true,
            isGlobal: true,
            description: ""
        };
        handleUpdate([...lib, newCounter]);
        setEditingId(newCounter.id);
        setPreviewValue(evaluateFormula("10", DUMMY_PREVIEW_DATA));
    };

    const updateCounter = (id: string, field: keyof LibraryFormulaEntry, value: any) => {
        const newLib = lib.map(c => c.id === id ? { ...c, [field]: value } : c);
        handleUpdate(newLib);

        if (field === 'formula') {
            try {
                setPreviewValue(evaluateFormula(value, DUMMY_PREVIEW_DATA));
            } catch {
                setPreviewValue(0);
            }
        }
    };

    const removeCounter = (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette formule ?")) return;
        handleUpdate(lib.filter(c => c.id !== id));
    };

    // Migration Logic
    const orphanCount = (rules.libraries.traits || []).reduce((acc, trait) => {
        return acc + (trait.effects?.filter(e =>
            (e.type === 'formula' && !e.formulaId) ||
            ['attribute_bonus', 'counter_max_bonus', 'xp_bonus'].includes(e.type as string)
        ).length || 0);
    }, 0);

    const autoMigrateFormulas = () => {
        let currentFormulas = [...lib];
        let traitsUpdated = 0;
        let formulasCreated = 0;

        const newTraits = (rules.libraries.traits || []).map(trait => {
            let traitChanged = false;
            const newEffects = (trait.effects || []).map(effect => {
                const isLegacy = ['attribute_bonus', 'counter_max_bonus', 'xp_bonus'].includes(effect.type as string);
                const isOrphanFormula = effect.type === 'formula' && !effect.formulaId && effect.formula;

                if (isLegacy || isOrphanFormula) {
                    let formulaString = effect.formula || '';
                    let target = effect.target;

                    if (isLegacy) {
                        const legacyEffect = effect as any;
                        if (legacyEffect.type === 'attribute_bonus') {
                            formulaString = legacyEffect.value?.toString() || '0';
                        } else if (legacyEffect.type === 'counter_max_bonus') {
                            formulaString = `${legacyEffect.value || 0} * TRAIT_LEVEL`;
                        } else if (legacyEffect.type === 'xp_bonus') {
                            target = 'XP';
                            if (legacyEffect.method === 'per_scenario') {
                                formulaString = `${legacyEffect.value || 0} * SCENARIOS_COUNT`;
                            } else {
                                formulaString = legacyEffect.value?.toString() || '0';
                            }
                        }
                    }

                    if (!formulaString) return effect;

                    // Try to find a global formula with EXACTLY the same formula string
                    let existing = currentFormulas.find(f => f.formula === formulaString);

                    if (!existing) {
                        // Create one
                        existing = {
                            id: generateId(),
                            name: `Mécanique: ${trait.name}`,
                            type: 'effect',
                            formula: formulaString,
                            isActive: true,
                            isGlobal: true,
                            description: `Importé depuis le trait ${trait.name}`
                        };
                        currentFormulas.push(existing);
                        formulasCreated++;
                    }

                    traitChanged = true;
                    // Return as the new 'formula' type
                    return {
                        ...effect,
                        type: 'formula',
                        formula: formulaString,
                        formulaId: existing.id,
                        target: target,
                        value: undefined, // Clear legacy fields
                        method: undefined // Clear legacy fields
                    } as any;
                }
                return effect;
            });

            if (traitChanged) {
                traitsUpdated++;
                return { ...trait, effects: newEffects };
            }
            return trait;
        });

        if (traitsUpdated > 0) {
            onUpdate({
                ...rules,
                libraries: {
                    ...rules.libraries,
                    traits: newTraits,
                    formulas: currentFormulas
                }
            });
            alert(`${traitsUpdated} traits mis à jour. ${formulasCreated} nouvelles formules créées dans le dictionnaire.`);
        } else {
            alert("Aucune formule orpheline trouvée.");
        }
    };

    return (
        <MotionCard className="p-6 h-full" hoverEffect="glow">
            <div className="flex justify-between items-center border-b border-stone-700/50 pb-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-stone-300 flex items-center gap-2 font-serif tracking-wide">
                        <Calculator className="text-amber-500" /> Formules & Réserves
                    </h2>
                    <p className="text-stone-400 italic text-sm mt-1">
                        Ces formules seront intégrées à la Fiche de Personnage comme réserves numériques calculées.
                    </p>
                </div>
                <button
                    onClick={addCounter}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-stone-950 rounded-sm font-bold shadow-glow-gold hover:bg-amber-500 transition-colors"
                >
                    <Plus size={16} /> Nouvelle Formule
                </button>
            </div>

            <div className="space-y-4">
                {formulaCounters.map(counter => {
                    const isEditing = editingId === counter.id;
                    const preview = isEditing && previewValue !== null ? previewValue : evaluateFormula(counter.formula || '', DUMMY_PREVIEW_DATA);

                    return (
                        <div key={counter.id} className={`border rounded-sm overflow-hidden transition-all ${isEditing ? 'border-amber-500 ring-1 ring-amber-500/50 bg-stone-900/80' : 'border-stone-700/50 bg-stone-900/40 hover:border-amber-500/30'}`}>
                            {/* Header */}
                            <div
                                className="p-3 flex justify-between items-center cursor-pointer"
                                onClick={() => {
                                    if (!isEditing) {
                                        setEditingId(counter.id);
                                        setPreviewValue(evaluateFormula(counter.formula || '', DUMMY_PREVIEW_DATA));
                                    }
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                        <Calculator size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-stone-200">{counter.name}</h3>
                                        {!isEditing && <p className="text-xs text-stone-500 font-mono mt-0.5">{counter.formula}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right flex flex-col">
                                        <span className="text-[10px] text-stone-500 uppercase tracking-widest font-bold">Aperçu (Fictif)</span>
                                        <span className="font-black text-xl text-amber-500 leading-none">{preview}</span>
                                    </div>
                                    {isEditing && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
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
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Nom (ex: Calcul du Mana)</label>
                                            <input
                                                type="text"
                                                value={counter.name}
                                                onChange={e => updateCounter(counter.id, 'name', e.target.value)}
                                                className="w-full p-2 bg-stone-950 border border-stone-700 text-stone-300 rounded focus:border-amber-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Description (Optionnel)</label>
                                            <input
                                                type="text"
                                                value={counter.description || ''}
                                                onChange={e => updateCounter(counter.id, 'description', e.target.value)}
                                                className="w-full p-2 bg-stone-950 border border-stone-700 text-stone-300 rounded focus:border-amber-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Type de Formule</label>
                                        <div className="flex gap-2 p-1 bg-stone-950 rounded border border-stone-700/50 w-fit">
                                            <button
                                                onClick={() => updateCounter(counter.id, 'type', 'effect')}
                                                className={`px-3 py-1 text-xs font-bold rounded ${counter.type === 'effect' ? 'bg-amber-600 text-stone-900' : 'text-stone-400 hover:text-stone-300'}`}
                                            >
                                                Effet Invisible
                                            </button>
                                            <button
                                                onClick={() => updateCounter(counter.id, 'type', 'reserve')}
                                                className={`px-3 py-1 text-xs font-bold rounded ${counter.type === 'reserve' ? 'bg-amber-600 text-stone-900' : 'text-stone-400 hover:text-stone-300'}`}
                                            >
                                                Réserve Joueur (Jauge)
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Équation Mathématique</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={counter.formula}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    updateCounter(counter.id, 'formula', val);

                                                    // Get the word under cursor or last word
                                                    const words = val.split(/[\s+\-*/()]/);
                                                    const lastWord = words[words.length - 1];
                                                    setSearchQuery(lastWord.length > 1 ? lastWord : '');
                                                }}
                                                className="w-full p-3 bg-stone-950 border border-stone-700 text-stone-300 rounded font-mono text-sm focus:border-amber-500 outline-none shadow-inner"
                                                placeholder="ex: 10 + Constitution + Volonté"
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
                                                                    updateCounter(counter.id, 'formula', parts.join(''));
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
                                            <div className="flex flex-wrap gap-1.5">
                                                {allVariables
                                                    .filter(v => ['XP_TOTAL', 'SUM_MYSTIC', 'Physique', 'Volonté', 'Constitution', 'Empathie', 'Intelligence'].includes(v))
                                                    .map(v => (
                                                        <button
                                                            key={v}
                                                            onClick={() => updateCounter(counter.id, 'formula', (counter.formula.trim() ? counter.formula + ' + ' : '') + v)}
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

                                    <div className="flex justify-start items-center mt-2 pt-4 border-t border-stone-700/50">
                                        <button
                                            onClick={() => removeCounter(counter.id)}
                                            className="flex items-center gap-2 px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded text-xs font-bold transition-colors"
                                        >
                                            <Trash2 size={14} /> Supprimer
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {formulaCounters.length === 0 && (
                    <div className="text-center p-12 bg-stone-900/40 rounded-sm border-2 border-dashed border-stone-800/50 text-stone-500">
                        <Calculator size={48} className="mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-bold font-serif mb-1 text-stone-400">Aucune Formule créée</h3>
                        <p className="text-sm">Cliquez sur "Nouvelle Formule" pour créer un calcul partagé.</p>
                    </div>
                )}
            </div>

            {/* Maintenance & Unification Tool */}
            {/* Removed: Auto-migration is now handled transparently on campaign load */}
        </MotionCard>
    );
};

export default AdminFormulasEditor;
