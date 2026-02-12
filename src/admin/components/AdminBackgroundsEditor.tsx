import React, { useState } from 'react';
import { RulesData } from '../../types/rules';
import { Users, Plus, X, ArrowUp, ArrowDown } from 'lucide-react';
import { MotionCard } from '../../components/ui/motion/MotionCard';
import { MotionFade } from '../../components/ui/motion/MotionFade';

interface AdminBackgroundsEditorProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
}

const AdminBackgroundsEditor: React.FC<AdminBackgroundsEditorProps> = ({ rules, onUpdate }) => {
    // Default to empty array if undefined
    const backgrounds = rules.definitions.backgrounds || [];
    const [newItem, setNewItem] = useState("");

    const updateBackgrounds = (newList: string[]) => {
        onUpdate({
            ...rules,
            definitions: {
                ...rules.definitions,
                backgrounds: newList
            }
        });
    };

    const handleAdd = () => {
        if (!newItem.trim()) return;
        updateBackgrounds([...backgrounds, newItem.trim()]);
        setNewItem("");
    };

    const handleRemove = (index: number) => {
        const newList = [...backgrounds];
        newList.splice(index, 1);
        updateBackgrounds(newList);
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === backgrounds.length - 1) return;

        const newList = [...backgrounds];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newList[index], newList[swapIndex]] = [newList[swapIndex], newList[index]];
        updateBackgrounds(newList);
    };

    const handleEdit = (index: number, value: string) => {
        const newList = [...backgrounds];
        newList[index] = value;
        updateBackgrounds(newList);
    };

    return (
        <MotionCard
            className="p-6 h-full"
            hoverEffect="glow"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
        >
            <h2 className="text-2xl font-bold mb-4 text-stone-300 border-b border-stone-700/50 pb-2 flex items-center gap-2 font-serif tracking-wide">
                <Users className="text-amber-500" /> Gestion des Arrière-Plans
            </h2>
            <p className="text-stone-400 italic mb-6 text-sm">
                Définissez la liste des Arrière-Plans (Backgrounds) disponibles.
                <br />
                <span className="text-xs text-stone-500">Ils apparaîtront sous forme de liste de compétences.</span>
            </p>

            <div className="max-w-xl">
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        placeholder="Nouvel Arrière-Plan (ex: Mentor, Ressources...)"
                        className="flex-grow bg-stone-950 border border-stone-700 rounded-sm px-3 py-2 outline-none focus:border-amber-500 text-stone-200 placeholder-stone-600 transition-colors shadow-inner"
                    />
                    <button
                        onClick={handleAdd}
                        className="bg-amber-600 hover:bg-amber-500 text-stone-900 px-4 py-2 rounded-sm font-bold transition-all shadow-glow-gold flex items-center gap-2 uppercase text-xs tracking-wider"
                    >
                        <Plus size={18} /> Ajouter
                    </button>
                </div>

                <div className="space-y-2">
                    {backgrounds.map((bg, index) => (
                        <MotionFade key={`${index}-${bg}`} delay={index * 0.05} className="w-full">
                            <div className="flex items-center gap-2 bg-stone-900 p-2 rounded-sm border border-stone-700/50 group hover:border-amber-500/30 transition-colors">
                                <div className="flex flex-col gap-0.5 text-stone-600">
                                    <button onClick={() => handleMove(index, 'up')} className="hover:text-amber-500 transition-colors"><ArrowUp size={12} /></button>
                                    <button onClick={() => handleMove(index, 'down')} className="hover:text-amber-500 transition-colors"><ArrowDown size={12} /></button>
                                </div>

                                <input
                                    type="text"
                                    value={bg}
                                    onChange={(e) => handleEdit(index, e.target.value)}
                                    className="flex-grow bg-transparent outline-none font-medium text-stone-300 focus:text-amber-500 focus:font-bold transition-all"
                                />

                                <button onClick={() => handleRemove(index)} className="text-stone-600 hover:text-crimson-blood transition-colors p-1">
                                    <X size={18} />
                                </button>
                            </div>
                        </MotionFade>
                    ))}
                    {backgrounds.length === 0 && (
                        <MotionFade>
                            <p className="text-stone-500 italic text-center py-4 text-xs">Aucun arrière-plan défini.</p>
                        </MotionFade>
                    )}
                </div>
            </div>
        </MotionCard>
    );
};

export default AdminBackgroundsEditor;
