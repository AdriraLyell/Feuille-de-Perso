import React, { useState, useMemo, useCallback } from 'react';
import { LibraryEntry, TraitEffect, CharacterSheetData } from '../../types';
import TraitForm from '../trait-library/TraitForm';
import { useRules } from '../../context/RulesContext';
import ThematicModal from '../ui/ThematicModal';
import { ShieldCheck, Save, AlertOctagon } from 'lucide-react';

interface AdminTraitIntegratorProps {
    initialData: LibraryEntry;
    data: CharacterSheetData;
    onClose: () => void;
    onIntegrate: (finalTrait: LibraryEntry) => void;
}

const AdminTraitIntegrator: React.FC<AdminTraitIntegratorProps> = ({ initialData, data, onClose, onIntegrate }) => {
    const { rules } = useRules();
    const allFormulas = useMemo(() => rules?.libraries?.formulas || [], [rules]);

    const [editForm, setEditForm] = useState<LibraryEntry | null>({
        ...initialData,
        id: Math.random().toString(36).substr(2, 9), // Generate new ID so it doesn't conflict with local
        isGlobal: true, // Mark it as official
    });
    const [tagInput, setTagInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Helpers to mimic useTraitActions for TraitForm
    const addTag = useCallback(() => {
        if (!editForm || !tagInput.trim()) return;
        const newTag = tagInput.trim();
        if (!(editForm.tags || []).includes(newTag)) {
            setEditForm({ ...editForm, tags: [...(editForm.tags || []), newTag] });
        }
        setTagInput('');
    }, [editForm, tagInput]);

    const removeTag = useCallback((tagToRemove: string) => {
        if (!editForm) return;
        setEditForm({ ...editForm, tags: (editForm.tags || []).filter(t => t !== tagToRemove) });
    }, [editForm]);

    const addEffect = useCallback(() => {
        if (!editForm) return;
        const newEffect: TraitEffect = { id: Math.random().toString(36).substr(2, 9), type: 'formula', value: 0 };
        setEditForm({ ...editForm, effects: [...(editForm.effects || []), newEffect] });
    }, [editForm]);

    const updateEffect = useCallback((id: string, field: keyof TraitEffect, value: string | number | boolean | undefined) => {
        if (!editForm) return;
        const newEffects = (editForm.effects || []).map(e => e.id === id ? { ...e, [field]: value } : e);

        // Détecter si une des formules force la variante
        const hasForceVariantFormula = newEffects.some(ef => {
            if (!ef.formulaId) return false;
            const formula = allFormulas.find(f => f.id === ef.formulaId);
            return formula?.forceVariant;
        });

        const updatedForm: LibraryEntry = {
            ...editForm,
            effects: newEffects,
            isVariable: hasForceVariantFormula ? true : editForm.isVariable
        };

        setEditForm(updatedForm);
    }, [editForm, allFormulas]);

    const updateEffectFields = useCallback((id: string, updates: Partial<TraitEffect>) => {
        if (!editForm) return;
        const newEffects = (editForm.effects || []).map(e => e.id === id ? { ...e, ...updates } : e);

        const hasForceVariantFormula = newEffects.some(ef => {
            if (!ef.formulaId) return false;
            const formula = allFormulas.find(f => f.id === ef.formulaId);
            return formula?.forceVariant;
        });

        const updatedForm: LibraryEntry = {
            ...editForm,
            effects: newEffects,
            isVariable: hasForceVariantFormula ? true : editForm.isVariable
        };

        setEditForm(updatedForm);
    }, [editForm, allFormulas]);

    const removeEffect = useCallback((id: string) => {
        if (!editForm) return;
        const newEffects = (editForm.effects || []).filter(e => e.id !== id);

        const hasForceVariantFormula = newEffects.some(ef => {
            if (!ef.formulaId) return false;
            const formula = allFormulas.find(f => f.id === ef.formulaId);
            return formula?.forceVariant;
        });

        setEditForm({
            ...editForm,
            effects: newEffects,
            isVariable: hasForceVariantFormula ? true : editForm.isVariable
        });
    }, [editForm, allFormulas]);


    // Mocks for data references
    const allSkills = useMemo(() => {
        const skills: { id: string, name: string }[] = [];
        if (rules?.libraries) {
            if (rules.libraries.skills) rules.libraries.skills.forEach(s => skills.push({ id: s.id, name: s.name }));
            if (rules.libraries.mysticAbilities) rules.libraries.mysticAbilities.forEach(s => skills.push({ id: s.id, name: s.name }));
            if (rules.libraries.backgrounds) rules.libraries.backgrounds.forEach(s => skills.push({ id: s.id, name: s.name }));
        }
        return skills.sort((a, b) => a.name.localeCompare(b.name));
    }, [rules]);

    const allAttributes = useMemo(() => {
        if (!data || !data.attributes) return [];
        const attrs: { id: string, name: string }[] = [];
        Object.keys(data.attributes).forEach(key => {
            data.attributes![key].forEach(a => {
                if (a.name && a.name.trim() !== '') {
                    attrs.push({ id: a.id, name: a.name });
                }
            });
        });
        return attrs.sort((a, b) => a.name.localeCompare(b.name));
    }, [data.attributes]);

    const allCounters = useMemo(() => {
        if (!data || !data.counters) return [];
        const counters: { id: string, name: string }[] = [];
        Object.keys(data.counters).forEach(key => {
            if (key !== 'custom') {
                const rawEntry = data.counters![key] as import('../../types').DotEntry;
                if (rawEntry && rawEntry.name && rawEntry.name.trim() !== '') {
                    counters.push({ id: rawEntry.id || key, name: rawEntry.name });
                }
            }
        });
        if (data.counters.custom && Array.isArray(data.counters.custom)) {
            data.counters.custom.forEach(c => {
                if (c && c.name && c.name.trim() !== '') counters.push({ id: c.id, name: c.name });
            });
        }
        if (data.counterLibrary && Array.isArray(data.counterLibrary)) {
            data.counterLibrary.forEach(c => {
                if (c && c.name && c.name.trim() !== '' && !counters.some(ex => ex.name === c.name)) {
                    counters.push({ id: c.id, name: c.name });
                }
            });
        }
        return counters.sort((a, b) => a.name.localeCompare(b.name));
    }, [data.counters, data.counterLibrary]);

    const handleSave = () => {
        if (!editForm) return;
        if (!editForm.name.trim()) { setError("Le nom du trait ne peut pas être vide."); return; }

        // Let's strip out 'local' variants that the MJ might not want to make "official", 
        // actually MJ can just edit them.
        onIntegrate(editForm as LibraryEntry);
    };

    if (!editForm) return null;

    return (
        <ThematicModal
            isOpen={true}
            onClose={onClose}
            title="Officialiser le Trait"
            icon={<ShieldCheck size={24} />}
            size="xl"
            footer={
                <>
                    <button onClick={onClose} className="px-4 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold transition">Annuler</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-sm font-bold shadow-md hover:bg-indigo-700 transition flex items-center gap-2">
                        <Save size={16} /> Officialiser
                    </button>
                </>
            }
        >
            <div className="bg-indigo-50/50 border border-indigo-200 text-indigo-800 px-4 py-3 rounded-sm flex items-start gap-3 text-sm shadow-sm mb-4 mx-2">
                <AlertOctagon size={18} className="shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold">Intégration et ajustements</p>
                    <p className="text-xs opacity-80 mt-1">
                        Vous pouvez modifier la proposition du joueur avant de l'Officialiser pour tout le monde. N'oubliez pas de renseigner le Type, Coût, et les effets Mécaniques éventuels.
                    </p>
                </div>
            </div>
            {error && (
                <div className="bg-red-50 text-red-800 text-xs p-3 mx-2 mb-4 rounded-sm border border-red-200 font-bold">
                    {error}
                </div>
            )}
            <TraitForm
                editForm={editForm}
                isOfficial={false} // WE WANT THE MJ TO EDIT EVERYTHING!
                library={rules?.libraries?.traits || []}
                allSkills={allSkills}
                allAttributes={allAttributes}
                allCounters={allCounters}
                allFormulas={allFormulas}
                tagInput={tagInput}
                error={error}
                setEditForm={setEditForm}
                setTagInput={setTagInput}
                onClose={onClose}
                onSave={handleSave}
                addTag={addTag}
                removeTag={removeTag}
                addEffect={addEffect}
                updateEffect={updateEffect as (id: string, field: keyof TraitEffect, value: string | number | boolean | undefined) => void}
                updateEffectFields={updateEffectFields}
                removeEffect={removeEffect}
            />
        </ThematicModal>
    );
};

export default AdminTraitIntegrator;
