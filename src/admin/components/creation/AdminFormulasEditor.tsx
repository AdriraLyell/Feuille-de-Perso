import React, { useState } from 'react';
import { RulesData } from '../../../types/rules';
import { LibraryFormulaEntry } from '../../../types';
import { generateId } from '../../../utils/factories';
import { evaluateFormula } from '../../../utils/formulaEvaluator';
import { Trash2, Plus, Calculator, Info, Check } from 'lucide-react';
import { MotionCard } from '../../../components/ui/motion/MotionCard';

const DUMMY_PREVIEW_DATA: any = {
    experience: { total: 25, gain: "25" },
    attributes: { Physiologie: [{ name: 'Physique', val2: '3' }], Mental: [{ name: 'Volonté', val2: '4' }] },
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
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={counter.formula}
                                                onChange={e => updateCounter(counter.id, 'formula', e.target.value)}
                                                className="flex-grow p-3 bg-stone-950 border border-stone-700 text-stone-300 rounded font-mono text-sm focus:border-amber-500 outline-none shadow-inner"
                                                placeholder="ex: 10 + Constitution + Volonté"
                                            />
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <span className="text-[10px] text-stone-500 flex items-center gap-1 uppercase tracking-widest font-bold"><Info size={12} /> Variables courantes :</span>
                                            <button onClick={() => updateCounter(counter.id, 'formula', counter.formula + ' + XP_TOTAL')} className="text-[10px] px-2 py-0.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded font-mono text-stone-400">XP_TOTAL</button>
                                            <button onClick={() => updateCounter(counter.id, 'formula', counter.formula + ' + SUM_MYSTIC')} className="text-[10px] px-2 py-0.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded font-mono text-stone-400">SUM_MYSTIC</button>
                                            <button onClick={() => updateCounter(counter.id, 'formula', counter.formula + ' + Volonté')} className="text-[10px] px-2 py-0.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded font-mono text-stone-400">Volonté</button>
                                            <button onClick={() => updateCounter(counter.id, 'formula', counter.formula + ' + Physique')} className="text-[10px] px-2 py-0.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded font-mono text-stone-400">Physique</button>
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
        </MotionCard>
    );
};

export default AdminFormulasEditor;
