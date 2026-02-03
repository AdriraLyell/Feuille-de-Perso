
import React, { useState } from 'react';
import { RulesData } from '../../types/rules';
import { Users, Plus, X, ArrowUp, ArrowDown } from 'lucide-react';

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
        <div className="bg-white p-6 rounded shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 border-b pb-2 flex items-center gap-2">
                <Users className="text-orange-600" /> Gestion des Arrière-Plans
            </h2>
            <p className="text-slate-500 italic mb-6">
                Définissez la liste des Arrière-Plans (Backgrounds) disponibles.
                <br />
                <span className="text-xs">Ils apparaîtront sous forme de liste de compétences.</span>
            </p>

            <div className="max-w-xl">
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        placeholder="Nouvel Arrière-Plan (ex: Mentor, Ressources...)"
                        className="flex-grow border border-slate-300 rounded px-3 py-2 outline-none focus:border-orange-500"
                    />
                    <button
                        onClick={handleAdd}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded font-bold transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} /> Ajouter
                    </button>
                </div>

                <div className="space-y-2">
                    {backgrounds.map((bg, index) => (
                        <div key={index} className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200 group">
                            <div className="flex flex-col gap-0.5 text-slate-300">
                                <button onClick={() => handleMove(index, 'up')} className="hover:text-slate-600"><ArrowUp size={12} /></button>
                                <button onClick={() => handleMove(index, 'down')} className="hover:text-slate-600"><ArrowDown size={12} /></button>
                            </div>

                            <input
                                type="text"
                                value={bg}
                                onChange={(e) => handleEdit(index, e.target.value)}
                                className="flex-grow bg-transparent outline-none font-medium text-slate-800 focus:text-black focus:font-bold"
                            />

                            <button onClick={() => handleRemove(index)} className="text-slate-300 hover:text-red-500 p-1">
                                <X size={18} />
                            </button>
                        </div>
                    ))}
                    {backgrounds.length === 0 && (
                        <p className="text-slate-400 italic text-center py-4">Aucun arrière-plan défini.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminBackgroundsEditor;
