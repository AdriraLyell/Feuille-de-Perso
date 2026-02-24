import React, { useState } from 'react';
import { CharacterSheetData, LibraryCounterEntry } from '../../types';
import { generateId } from '../../utils/factories';
import { evaluateFormula } from '../../utils/formulaEvaluator';
import { Trash2, Plus, Calculator, Info, Check, AlertCircle } from 'lucide-react';
import { normalizeString } from '../../utils/stringUtils';

interface FormulasEditorProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings' | 'both') => void;
}

const FormulasEditor: React.FC<FormulasEditorProps> = ({ data, onUpdate, onAddLog }) => {
    const [lib, setLib] = useState<LibraryCounterEntry[]>(data.counterLibrary || []);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [previewValue, setPreviewValue] = useState<number | null>(null);

    const handleUpdate = (newLib: LibraryCounterEntry[]) => {
        setLib(newLib);
        onUpdate({ ...data, counterLibrary: newLib });
    };

    const addCounter = () => {
        const newCounter: LibraryCounterEntry = {
            id: generateId(),
            name: "Nouveau Compteur",
            isNumeric: true, // Specific to this UI
            formula: "10",
            isActive: true,
            isGlobal: true,
            description: ""
        };
        handleUpdate([...lib, newCounter]);
        setEditingId(newCounter.id);
    };

    const updateCounter = (id: string, field: keyof LibraryCounterEntry, value: any) => {
        const newLib = lib.map(c => c.id === id ? { ...c, [field]: value } : c);
        handleUpdate(newLib);

        // Live preview if formula changes
        if (field === 'formula') {
            try {
                setPreviewValue(evaluateFormula(value, data));
            } catch {
                setPreviewValue(0);
            }
        }
    };

    const removeCounter = (id: string) => {
        if (!confirm("Voulez-vous vraiment supprimer cette formule ?")) return;
        handleUpdate(lib.filter(c => c.id !== id));
    };

    // This assigns the counter manually to the local custom counters of the character
    const assignToCharacter = (counter: LibraryCounterEntry) => {
        const existingCustom = data.counters.custom || [];
        if (existingCustom.some(c => normalizeString(c.name) === normalizeString(counter.name))) {
            onAddLog(`${counter.name} est déjà assigné!`, 'info', 'settings');
            return;
        }

        const newCustomEntry = {
            id: generateId(),
            name: counter.name,
            description: counter.description || undefined,
            value: 0,
            creationValue: 0,
            current: 0,
            max: 0
        };

        onUpdate({
            ...data,
            counters: {
                ...data.counters,
                custom: [...existingCustom, newCustomEntry]
            }
        });
        onAddLog(`Compteur ${counter.name} assigné à la fiche`, 'success', 'settings');
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="p-4 bg-stone-50 border-b border-stone-200 flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-xl font-bold font-serif text-[#8b2e2e]">Éditeur de Formules</h2>
                    <p className="text-sm text-stone-600">Créez des réserves numériques avec Max calculé automatiquement.</p>
                </div>
                <button
                    onClick={addCounter}
                    className="flex items-center gap-2 px-4 py-2 bg-[#8b2e2e] text-white rounded font-bold hover:bg-red-800 transition-colors shadow-sm"
                >
                    <Plus size={16} /> Nouvelle Résèrve
                </button>
            </div>

            <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4">
                {lib.filter(c => c.isNumeric).map(counter => {
                    const isEditing = editingId === counter.id;
                    const preview = isEditing && previewValue !== null ? previewValue : evaluateFormula(counter.formula || '', data);

                    return (
                        <div key={counter.id} className={`border rounded-md shadow-sm overflow-hidden transition-all ${isEditing ? 'border-[#8b2e2e] ring-1 ring-[#8b2e2e]' : 'border-stone-300'}`}>
                            {/* Header */}
                            <div
                                className={`p-3 flex justify-between items-center cursor-pointer ${isEditing ? 'bg-[#fdfbf7]' : 'bg-white hover:bg-stone-50'}`}
                                onClick={() => {
                                    if (!isEditing) {
                                        setEditingId(counter.id);
                                        setPreviewValue(evaluateFormula(counter.formula || '', data));
                                    }
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-[#8b2e2e]/10 flex items-center justify-center text-[#8b2e2e]">
                                        <Calculator size={18} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-stone-800">{counter.name}</h3>
                                        {!isEditing && <p className="text-xs text-stone-500 font-mono mt-0.5">{counter.formula}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right flex flex-col">
                                        <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">Résultat Max</span>
                                        <span className="font-black text-xl text-[#5c4d41] leading-none">{preview}</span>
                                    </div>
                                    {isEditing ? (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setEditingId(null); }}
                                            className="p-2 bg-[#8b2e2e] text-white rounded hover:bg-red-800"
                                            title="Fermer l'édition"
                                        >
                                            <Check size={16} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); assignToCharacter(counter); }}
                                            className="px-3 py-1.5 bg-stone-100 text-[#5c4d41] font-bold text-xs rounded hover:bg-[#bfae85]/20 transition-colors"
                                        >
                                            Assigner à la fiche
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Editor */}
                            {isEditing && (
                                <div className="p-4 border-t border-[#bfae85]/30 bg-[#fdfbf7] flex flex-col gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Nom de la réserve</label>
                                            <input
                                                type="text"
                                                value={counter.name}
                                                onChange={e => updateCounter(counter.id, 'name', e.target.value)}
                                                className="w-full p-2 border border-stone-300 rounded focus:ring-1 focus:ring-[#8b2e2e] focus:border-[#8b2e2e] outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Description (Optionnel)</label>
                                            <input
                                                type="text"
                                                value={counter.description || ''}
                                                onChange={e => updateCounter(counter.id, 'description', e.target.value)}
                                                className="w-full p-2 border border-stone-300 rounded focus:ring-1 focus:ring-[#8b2e2e] focus:border-[#8b2e2e] outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Formule de calcul du Max</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={counter.formula}
                                                onChange={e => updateCounter(counter.id, 'formula', e.target.value)}
                                                className="flex-grow p-3 border border-stone-300 rounded font-mono text-sm focus:ring-1 focus:ring-[#8b2e2e] focus:border-[#8b2e2e] outline-none bg-white shadow-inner"
                                                placeholder="ex: 10 + Constitution + Volonté"
                                            />
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <span className="text-xs text-stone-500 flex items-center gap-1"><Info size={12} /> Variables rapides :</span>
                                            <button onClick={() => updateCounter(counter.id, 'formula', counter.formula + ' + XP_TOTAL')} className="text-xs px-2 py-0.5 bg-stone-200 hover:bg-stone-300 rounded font-mono text-stone-700">XP_TOTAL</button>
                                            <button onClick={() => updateCounter(counter.id, 'formula', counter.formula + ' + SUM_MYSTIC')} className="text-xs px-2 py-0.5 bg-stone-200 hover:bg-stone-300 rounded font-mono text-stone-700">SUM_MYSTIC</button>
                                            <button onClick={() => updateCounter(counter.id, 'formula', counter.formula + ' + Volonté')} className="text-xs px-2 py-0.5 bg-stone-200 hover:bg-stone-300 rounded font-mono text-stone-700">Volonté</button>
                                            <button onClick={() => updateCounter(counter.id, 'formula', counter.formula + ' + Physique')} className="text-xs px-2 py-0.5 bg-stone-200 hover:bg-stone-300 rounded font-mono text-stone-700">Physique</button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-2 pt-4 border-t border-stone-200">
                                        <button
                                            onClick={() => removeCounter(counter.id)}
                                            className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded text-sm transition-colors"
                                        >
                                            <Trash2 size={16} /> Supprimer la réserve
                                        </button>

                                        <button
                                            onClick={() => assignToCharacter(counter)}
                                            className="flex items-center gap-2 px-6 py-2 bg-stone-800 text-white font-bold rounded hover:bg-black transition-colors shadow-sm"
                                        >
                                            Assigner à la fiche
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {lib.filter(c => c.isNumeric).length === 0 && (
                    <div className="text-center p-12 bg-stone-50 rounded-lg border-2 border-dashed border-stone-200 text-stone-400">
                        <Calculator size={48} className="mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-bold text-stone-500">Aucun compteur calculé</h3>
                        <p className="text-sm">Cliquez sur "Nouvelle Résèrve" pour créer un compteur (ex: Mana, Chi).</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FormulasEditor;
