
import React, { useState } from 'react';
import { RulesData, RulesCounterDefinition } from '../../types/rules';
import { Plus, Trash2, Gauge } from 'lucide-react';

interface AdminCountersEditorProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
}

const AdminCountersEditor: React.FC<AdminCountersEditorProps> = ({ rules, onUpdate }) => {
    const counters = rules.definitions.counters || {};

    const handleUpdateCounter = (id: string, field: keyof RulesCounterDefinition, value: any) => {
        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                counters: {
                    ...counters,
                    [id]: {
                        ...counters[id],
                        [field]: value
                    }
                }
            }
        });
    };

    const handleAddCounter = () => {
        const id = `counter_${Date.now()}`;
        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                counters: {
                    ...counters,
                    [id]: {
                        id,
                        name: "Nouveau Compteur",
                        description: "",
                        defaultValue: 3,
                        max: 10,
                        xpCost: 5
                    }
                }
            }
        });
    };

    const handleDeleteCounter = (id: string) => {
        const newCounters = { ...counters };
        delete newCounters[id];
        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                counters: newCounters
            }
        });
    };

    // Helper to rename ID (Key change) - Complex, maybe skip renaming ID for now and just use ID as technical key?
    // Let's stick to modifying props.

    return (
        <div className="bg-white p-6 rounded shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 border-b pb-2 flex items-center gap-2">
                <Gauge className="text-purple-600" /> Gestion des Compteurs
            </h2>
            <p className="text-slate-500 italic mb-6">
                Définissez les jauges spéciales (Volonté, Confiance, etc.).
                <br />
                <span className="text-xs">Pour désactiver l'achat par XP, mettez le "Coût XP" à 0 ou -1.</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(counters).map((counter) => (
                    <div key={counter.id} className="bg-slate-50 p-4 rounded border border-slate-200 relative group">
                        <button
                            onClick={() => handleDeleteCounter(counter.id)}
                            className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Nom</label>
                                <input
                                    type="text"
                                    value={counter.name}
                                    onChange={(e) => handleUpdateCounter(counter.id, 'name', e.target.value)}
                                    className="w-full border border-slate-300 rounded px-2 py-1 font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase">Description</label>
                                <textarea
                                    value={counter.description || ''}
                                    onChange={(e) => handleUpdateCounter(counter.id, 'description', e.target.value)}
                                    className="w-full border border-slate-300 rounded px-2 py-1 text-xs min-h-[50px] resize-none"
                                    placeholder="Description pour tooltip..."
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Max</label>
                                    <input
                                        type="number"
                                        value={counter.max}
                                        onChange={(e) => handleUpdateCounter(counter.id, 'max', parseInt(e.target.value))}
                                        className="w-full border border-slate-300 rounded px-2 py-1 text-center"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Départ</label>
                                    <input
                                        type="number"
                                        value={counter.defaultValue || counter.value || 0}
                                        onChange={(e) => handleUpdateCounter(counter.id, 'defaultValue', parseInt(e.target.value))}
                                        className="w-full border border-slate-300 rounded px-2 py-1 text-center font-bold text-blue-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Coût XP</label>
                                    <input
                                        type="number"
                                        value={counter.xpCost}
                                        onChange={(e) => handleUpdateCounter(counter.id, 'xpCost', parseInt(e.target.value))}
                                        className="w-full border border-slate-300 rounded px-2 py-1 text-center font-mono text-purple-700 font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    onClick={handleAddCounter}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded hover:border-blue-500 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors h-full min-h-[160px]"
                >
                    <Plus size={32} />
                    <span className="font-bold text-sm mt-2">Ajouter un Compteur</span>
                </button>
            </div>
        </div>
    );
};

export default AdminCountersEditor;
