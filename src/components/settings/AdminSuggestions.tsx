
import React from 'react';
import { CharacterSheetData, SuggestionEntry, LibraryEntry, LibrarySkillEntry } from '../../types';
import { useRules } from '../../context/RulesContext';
import { Check, X, BookmarkPlus, Lightbulb, User } from 'lucide-react';
import ThematicButton from '../ui/ThematicButton';
import AdminTraitIntegrator from './AdminTraitIntegrator';
import AdminSkillIntegrator from './AdminSkillIntegrator';

interface Props {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    onAddLog: (msg: string, type: 'success' | 'info' | 'danger', cat: 'sheet' | 'settings' | 'both') => void;
}

const AdminSuggestions: React.FC<Props> = ({ data, onUpdate, onAddLog }) => {
    const { rules, updateRules } = useRules();
    const suggestions = data.suggestions || [];

    // States for displaying modals when the MJ clicks "Integrer" on a full Element
    const [traitToIntegrate, setTraitToIntegrate] = React.useState<{ suggestionId: string, entry: LibraryEntry } | null>(null);
    const [skillToIntegrate, setSkillToIntegrate] = React.useState<{ suggestionId: string, entry: LibrarySkillEntry } | null>(null);

    const handleReject = (id: string) => {
        const newSuggestions = suggestions.filter(s => s.id !== id);
        onUpdate({ ...data, suggestions: newSuggestions });
        onAddLog("Suggestion rejetée et supprimée.", 'info', 'settings');
    };

    const handlePromote = (suggestion: SuggestionEntry) => {
        if (!rules) return;

        const newRules = JSON.parse(JSON.stringify(rules)) as import('../../types/rules').RulesData;

        // --- 1. Variante Spécifique : Ajout Automatique ---
        if (suggestion.type === 'variant' && suggestion.parentId) {
            const skill = newRules.libraries.skills.find((s) => s.id === suggestion.parentId);
            if (skill) {
                if (!skill.variants) skill.variants = [];
                if (!skill.variants.includes(suggestion.name)) {
                    skill.variants.push(suggestion.name);
                    skill.variants.sort((a: string, b: string) => a.localeCompare(b));
                    onAddLog(`Variante "${suggestion.name}" ajoutée à la compétence "${skill.name}".`, 'success', 'settings');
                } else {
                    onAddLog("Cette variante existe déjà dans la définition.", 'info', 'settings');
                }
            } else {
                onAddLog("Erreur : Compétence parente introuvable.", 'danger', 'settings');
            }
            updateRules(newRules);
            handleReject(suggestion.id);
            return;
        }

        // --- 1.5 Spécialisation : Ajout Automatique ---
        if (suggestion.type === 'specialization' && suggestion.parentId) {
            if (!newRules.libraries.specializations) newRules.libraries.specializations = [];
            const isKnown = newRules.libraries.specializations.some((s) => s.name.toLowerCase() === suggestion.name.toLowerCase());
            if (!isKnown) {
                newRules.libraries.specializations.push({
                    id: `spec_${Date.now()}`,
                    name: suggestion.name,
                    skillIds: [suggestion.parentId],
                    defaultMinLevel: 0,
                    isActive: true,
                    isGlobal: true
                });
                newRules.libraries.specializations.sort((a, b) => a.name.localeCompare(b.name));
                onAddLog(`Spécialisation "${suggestion.name}" ajoutée à la bibliothèque.`, 'success', 'settings');
            } else {
                onAddLog("Cette spécialisation existe déjà dans la bibliothèque.", 'info', 'settings');
            }
            updateRules(newRules);
            handleReject(suggestion.id);
            return;
        }

        // --- 2. Nouvel Élément Complet : Ouvrir le Modal d'Ajustement ---
        if (suggestion.type === 'trait') {
            const localEntry = (data.library || []).find(l => l.name === suggestion.name);
            if (localEntry) {
                setTraitToIntegrate({ suggestionId: suggestion.id, entry: localEntry });
            } else {
                onAddLog("Impossible de trouver les données du trait proposé dans la fiche du joueur.", "danger", "settings");
            }
        }
        else if (suggestion.type === 'skill') {
            const localEntry = (data.skillLibrary || []).find(s => s.name === suggestion.name);
            if (localEntry) {
                setSkillToIntegrate({ suggestionId: suggestion.id, entry: localEntry });
            } else {
                onAddLog("Impossible de trouver les données de la compétence proposée dans la fiche du joueur.", "danger", "settings");
            }
        }
    };

    const handleConfirmIntegration = (
        finalEntry: LibraryEntry | LibrarySkillEntry,
        originalSuggestionId: string,
        listType: 'traits' | 'skills' | 'backgrounds'
    ) => {
        if (!rules) return;
        const newRules = JSON.parse(JSON.stringify(rules)) as import('../../types/rules').RulesData;

        // Push the finalized element to the official rules library
        if (!newRules.libraries[listType]) {
            (newRules.libraries as Record<string, (LibraryEntry | LibrarySkillEntry)[]>)[listType] = [];
        }
        (newRules.libraries[listType] as (LibraryEntry | LibrarySkillEntry)[]).push(finalEntry);

        // Sort
        (newRules.libraries[listType] as { name: string }[]).sort((a, b) => a.name.localeCompare(b.name));

        updateRules(newRules);

        // Mettre à jour l'ID dans la fiche du joueur pour garder le lien
        const originalSuggestion = suggestions.find(s => s.id === originalSuggestionId);
        if (originalSuggestion && (listType === 'skills' || listType === 'backgrounds')) {
            const newSheetData = { ...data };
            let modified = false;
            Object.keys(newSheetData.skills).forEach(cat => {
                newSheetData.skills[cat] = newSheetData.skills[cat].map(s => {
                    if (s.name?.trim().toLowerCase() === originalSuggestion.name.trim().toLowerCase() && s.id !== finalEntry.id) {
                        modified = true;
                        return { ...s, id: finalEntry.id, definitionId: finalEntry.id };
                    }
                    return s;
                });
            });

            if (modified) {
                const newSuggestions = newSheetData.suggestions?.filter(s => s.id !== originalSuggestionId) || [];
                onUpdate({ ...newSheetData, suggestions: newSuggestions });
            } else {
                handleReject(originalSuggestionId);
            }
        } else if (originalSuggestion && listType === 'traits') {
            const newSheetData = { ...data };
            const newLibrary = newSheetData.library?.map(t => {
                if (t.name.trim().toLowerCase() === originalSuggestion.name.trim().toLowerCase() && t.id !== finalEntry.id) {
                    return { ...t, id: finalEntry.id };
                }
                return t;
            }) || [];
            const newSuggestions = newSheetData.suggestions?.filter(s => s.id !== originalSuggestionId) || [];
            onUpdate({ ...newSheetData, library: newLibrary, suggestions: newSuggestions });
        } else {
            handleReject(originalSuggestionId);
        }

        onAddLog(`L'élément "${finalEntry.name}" a été officialisé !`, 'success', 'settings');

        // Close modal
        setTraitToIntegrate(null);
        setSkillToIntegrate(null);
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
                        <div className="flex items-center gap-4 flex-grow">
                            <div className={`p-2.5 rounded-full ${s.type === 'variant' ? 'bg-indigo-100 text-indigo-700' : s.type === 'specialization' ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {s.type === 'variant' || s.type === 'specialization' ? <BookmarkPlus size={20} /> : <Lightbulb size={20} />}
                            </div>
                            <div>
                                <div className="font-bold text-[#2c241b] text-base">{s.name}</div>
                                <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                                    <span className="font-bold uppercase tracking-widest text-[#8b2e2e]">
                                        {s.type === 'variant' ? 'Nouvelle Variante' : s.type === 'specialization' ? 'Nouvelle Spécialité' : 'Nouvel Élément'}
                                    </span>
                                    {s.category && <span className="px-1.5 py-0.5 bg-stone-100/80 rounded text-[10px] font-mono">{s.category}</span>}
                                    <span className="flex items-center gap-1 ml-1 opacity-70">
                                        • <User size={10} /> {data.header?.player || 'Joueur Inconnu'}
                                    </span>
                                    {s.timestamp && (
                                        <span className="opacity-70 italic text-[10px] ml-1">
                                            • le {new Date(s.timestamp).toLocaleDateString()} à {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    )}
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

            {/* INTEGRATOR MODALS */}
            {traitToIntegrate && (
                <AdminTraitIntegrator
                    initialData={traitToIntegrate.entry}
                    data={data}
                    onClose={() => setTraitToIntegrate(null)}
                    onIntegrate={(finalEntry) => handleConfirmIntegration(finalEntry, traitToIntegrate.suggestionId, 'traits')}
                />
            )}

            {skillToIntegrate && (
                <AdminSkillIntegrator
                    initialData={skillToIntegrate.entry}
                    onClose={() => setSkillToIntegrate(null)}
                    onIntegrate={(finalEntry) => handleConfirmIntegration(finalEntry, skillToIntegrate.suggestionId, 'skills')}
                />
            )}
        </div>
    );
};

export default AdminSuggestions;
