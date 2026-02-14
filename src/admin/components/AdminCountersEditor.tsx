
import React from 'react';
import { RulesData, RulesCounterDefinition } from '../../types/rules';
import { Plus, Trash2, Gauge } from 'lucide-react';
import { MotionFade } from '../../components/ui/motion/MotionFade';
import { MotionCard } from '../../components/ui/motion/MotionCard';

interface AdminCountersEditorProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
}

const AdminCountersEditor: React.FC<AdminCountersEditorProps> = ({ rules, onUpdate }) => {
    const counters = rules.definitions.counters || {};

    const handleUpdateCounter = <K extends keyof RulesCounterDefinition>(
        id: string,
        field: K,
        value: RulesCounterDefinition[K]
    ) => {
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
        <MotionCard className="p-6 h-full" hoverEffect="glow">
            <h2 className="text-2xl font-bold mb-4 text-stone-300 border-b border-stone-700/50 pb-2 flex items-center gap-2 font-serif tracking-wide">
                <Gauge className="text-amber-500" /> Gestion des Compteurs
            </h2>
            <p className="text-stone-400 italic mb-6 text-sm">
                Définissez les jauges spéciales (Volonté, Confiance, etc.).
                <br />
                <span className="text-xs text-stone-500">Pour désactiver l'achat par XP, mettez le "Coût XP" à 0 ou -1.</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(counters).map((counter, index) => (
                    <MotionFade key={counter.id} delay={index * 0.05} className="h-full">
                        <div className="bg-stone-900/80 p-4 rounded-sm border border-stone-700/50 relative group hover:border-amber-500/30 transition-all shadow-sm h-full">
                            <button
                                onClick={() => handleDeleteCounter(counter.id)}
                                className="absolute top-2 right-2 text-stone-600 hover:text-crimson-blood transition-colors opacity-0 group-hover:opacity-100"
                                title="Supprimer"
                            >
                                <Trash2 size={16} />
                            </button>

                            <div className="space-y-3">
                                <div>
                                    <label htmlFor={`counter-name-${counter.id}`} className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Nom</label>
                                    <input
                                        id={`counter-name-${counter.id}`}
                                        type="text"
                                        value={counter.name}
                                        onChange={(e) => handleUpdateCounter(counter.id, 'name', e.target.value)}
                                        className="w-full bg-stone-950 border border-stone-700 rounded-sm px-2 py-1 font-bold text-stone-300 outline-none focus:border-amber-500 transition-colors"
                                        placeholder="Nom du compteur"
                                    />
                                </div>
                                <div>
                                    <label htmlFor={`counter-desc-${counter.id}`} className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Description</label>
                                    <textarea
                                        id={`counter-desc-${counter.id}`}
                                        value={counter.description || ''}
                                        onChange={(e) => handleUpdateCounter(counter.id, 'description', e.target.value)}
                                        className="w-full bg-stone-950 border border-stone-700 rounded-sm px-2 py-1 text-xs min-h-[50px] resize-none text-stone-400 outline-none focus:border-amber-500 transition-colors placeholder-stone-700"
                                        placeholder="Description pour tooltip..."
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label htmlFor={`counter-max-${counter.id}`} className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Max</label>
                                        <input
                                            id={`counter-max-${counter.id}`}
                                            type="number"
                                            value={counter.max}
                                            onChange={(e) => handleUpdateCounter(counter.id, 'max', parseInt(e.target.value))}
                                            className="w-full bg-stone-950 border border-stone-700 rounded-sm px-2 py-1 text-center text-stone-300 font-mono outline-none focus:border-amber-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={`counter-start-${counter.id}`} className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Départ</label>
                                        <input
                                            id={`counter-start-${counter.id}`}
                                            type="number"
                                            value={counter.defaultValue || counter.value || 0}
                                            onChange={(e) => handleUpdateCounter(counter.id, 'defaultValue', parseInt(e.target.value))}
                                            className="w-full bg-stone-950 border border-stone-700 rounded-sm px-2 py-1 text-center font-bold text-amber-500 font-mono outline-none focus:border-amber-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor={`counter-xp-${counter.id}`} className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Coût XP</label>
                                        <input
                                            id={`counter-xp-${counter.id}`}
                                            type="number"
                                            value={counter.xpCost}
                                            onChange={(e) => handleUpdateCounter(counter.id, 'xpCost', parseInt(e.target.value))}
                                            className="w-full bg-stone-950 border border-stone-700 rounded-sm px-2 py-1 text-center font-mono text-emerald-500 font-bold outline-none focus:border-amber-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </MotionFade>
                ))}

                <MotionFade delay={Object.values(counters).length * 0.05} className="h-full">
                    <button
                        onClick={handleAddCounter}
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-stone-700 rounded-sm hover:border-amber-500 hover:bg-amber-950/20 text-stone-600 hover:text-amber-500 transition-all h-full min-h-[160px] group w-full"
                    >
                        <Plus size={32} className="mb-2 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-sm tracking-wide uppercase text-xs">Ajouter un Compteur</span>
                    </button>
                </MotionFade>
            </div>
        </MotionCard>
    );
};

export default AdminCountersEditor;
