
import React from 'react';
import { CharacterSheetData, SuggestionEntry } from '../../types';
import { useRules } from '../../context/RulesContext';
import { Check, X, BookmarkPlus, type LucideIcon, Lightbulb } from 'lucide-react';
import ThematicButton from '../ui/ThematicButton';

interface Props {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    onAddLog: (msg: string, type: 'success' | 'info' | 'danger', cat: 'sheet' | 'settings' | 'both') => void;
}

const AdminSuggestions: React.FC<Props> = ({ data, onUpdate, onAddLog }) => {
    const { rules, updateRules } = useRules();
    const suggestions = data.suggestions || [];

    const handleReject = (id: string) => {
        const newSuggestions = suggestions.filter(s => s.id !== id);
        onUpdate({ ...data, suggestions: newSuggestions });
        onAddLog("Suggestion rejetée et supprimée.", 'info', 'settings');
    };

    const handlePromote = (suggestion: SuggestionEntry) => {
        if (!rules) return;

        const newRules = JSON.parse(JSON.stringify(rules)); // Deep clone
        let promoted = false;

        if (suggestion.type === 'variant' && suggestion.parentId) {
            // Logic for Variants: Add to parent skill's variants list
            const skill = newRules.libraries.skills.find((s: any) => s.id === suggestion.parentId);
            if (skill) {
                if (!skill.variants) skill.variants = [];
                if (!skill.variants.includes(suggestion.name)) {
                    skill.variants.push(suggestion.name);
                    skill.variants.sort((a: string, b: string) => a.localeCompare(b)); // Keep sorted
                    promoted = true;
                    onAddLog(`Variante "${suggestion.name}" ajoutée à la compétence "${skill.name}".`, 'success', 'settings');
                } else {
                    onAddLog("Cette variante existe déjà dans la définition.", 'info', 'settings');
                    // Mark as promoted anyway to remove it
                    promoted = true;
                }
            } else {
                onAddLog("Erreur : Compétence parente introuvable.", 'danger', 'settings');
            }
        }
        /* 
        // Future logic for Traits/Skills promotion
        else if (suggestion.type === 'trait') {
             // ... create new trait entry in library ...
        }
        */

        if (promoted) {
            updateRules(newRules);
            handleReject(suggestion.id); // Remove from list after promotion
        }
    };

    if (suggestions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-stone-500 italic">
                <Lightbulb size={48} className="mb-4 opacity-20" />
                <p>Aucune suggestion en attente.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-sm flex items-start gap-3">
                <Lightbulb className="text-amber-600 shrink-0 mt-1" size={20} />
                <div>
                    <h3 className="font-bold text-amber-800 text-sm uppercase tracking-wide mb-1">Suggestions des Joueurs</h3>
                    <p className="text-xs text-amber-900/80">
                        Ces éléments ont été créés localement par les joueurs. Vous pouvez les valider pour les intégrer officiellement aux règles de la campagne (Bibliothèque).
                    </p>
                </div>
            </div>

            <div className="grid gap-3">
                {suggestions.map(s => (
                    <div key={s.id} className="bg-white border border-stone-200 p-4 rounded-sm shadow-sm flex items-center justify-between hover:border-amber-300 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${s.type === 'variant' ? 'bg-indigo-100 text-indigo-700' : 'bg-stone-100 text-stone-600'}`}>
                                {s.type === 'variant' ? <BookmarkPlus size={18} /> : <Lightbulb size={18} />}
                            </div>
                            <div>
                                <div className="font-bold text-[#2c241b]">{s.name}</div>
                                <div className="text-xs text-stone-500 uppercase tracking-widest flex items-center gap-2">
                                    <span>{s.type === 'variant' ? 'Nouvelle Variante' : 'Nouvel Élément'}</span>
                                    {s.category && <span className="px-1.5 py-0.5 bg-stone-100 rounded text-[10px]">{s.category}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <ThematicButton onClick={() => handlePromote(s)} variant="primary" className="!px-3 !py-1.5 text-xs">
                                <Check size={14} className="mr-1" /> Intégrer
                            </ThematicButton>
                            <ThematicButton onClick={() => handleReject(s.id)} variant="secondary" className="!px-3 !py-1.5 text-xs !bg-stone-100 hover:!bg-red-50 hover:!text-red-700 hover:!border-red-200">
                                <X size={14} />
                            </ThematicButton>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminSuggestions;
