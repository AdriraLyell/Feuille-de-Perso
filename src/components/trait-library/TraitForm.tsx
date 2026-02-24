
import React from 'react';
import { LibraryEntry, TraitEffect, LibraryFormulaEntry } from '../../types';
import { Edit2, Plus, X, AlignLeft, Save, AlertCircle, Coins, Info } from 'lucide-react';
import TraitEffectEditor from './TraitEffectEditor';
import ThematicModal from '../ui/ThematicModal';

interface TraitFormProps {
    editForm: LibraryEntry;
    library: LibraryEntry[];
    allSkills: { id: string, name: string }[];
    allAttributes: { id: string, name: string }[];
    allCounters: { id: string, name: string }[];
    allFormulas?: LibraryFormulaEntry[];
    tagInput: string;
    error: string | null;
    setEditForm: (entry: LibraryEntry | null) => void;
    setTagInput: (val: string) => void;
    onClose: () => void;
    onSave: (updatedTrait?: LibraryEntry) => void;
    addTag: () => void;
    removeTag: (tag: string) => void;
    addEffect: () => void;
    updateEffect: <K extends keyof TraitEffect>(id: string, field: K, value: TraitEffect[K]) => void;
    removeEffect: (id: string) => void;
}


const TraitForm: React.FC<TraitFormProps> = ({
    editForm,
    library,
    allSkills,
    allAttributes,
    allCounters,
    allFormulas,
    tagInput,
    error,
    setEditForm,
    setTagInput,
    onClose,
    onSave,
    addTag,
    removeTag,
    addEffect,
    updateEffect,
    removeEffect
}) => {
    const [variantDraft, setVariantDraft] = React.useState(editForm.variants?.join(', ') || '');

    // Logic for "Smart Cost Information"
    const parsedCostInfo = React.useMemo(() => {
        const val = editForm.pointsLabel?.toString() || '';
        if (!val.trim()) return { type: 'none', label: 'Aucun coût défini' };

        // 1. Simple Number (Fixed)
        if (/^\d+$/.test(val.trim())) {
            return { type: 'fixed', label: `Prix fixe : ${val} pts`, color: 'text-emerald-600' };
        }

        // 2. Range (1-5)
        if (/[-,–—]/.test(val) || val.includes('..')) {
            const nums = val.match(/\d+/g);
            if (nums && nums.length >= 2) {
                return { type: 'range', label: `Plage de ${nums[0]} à ${nums[1]} pts`, color: 'text-amber-600' };
            }
        }

        // 3. List (1, 3, 5)
        if (val.includes(',') || val.includes(';')) {
            const nums = val.match(/\d+/g);
            if (nums && nums.length > 0) {
                return { type: 'list', label: `Choix multiples : ${nums.join(', ')} pts`, color: 'text-blue-600' };
            }
        }

        return { type: 'text', label: 'Coût narratif / Spécial', color: 'text-stone-500' };
    }, [editForm.pointsLabel]);

    React.useEffect(() => {
        setVariantDraft(editForm.variants?.join(', ') || '');
    }, [editForm.id, editForm.variants?.join(',')]);

    const handleSave = () => {
        const cleaned = variantDraft.split(',').map(v => v.trim()).filter(Boolean);
        const finalForm = { ...editForm, variants: cleaned };

        // Update local state just in case, but pass final version to onSave immediately
        setEditForm(finalForm);
        onSave(finalForm);
    };
    const isNew = !library.some(l => l.id === editForm.id);

    return (
        <ThematicModal
            isOpen={true}
            onClose={onClose}
            title={isNew ? 'Nouveau Trait' : 'Éditer le Trait'}
            icon={isNew ? <Plus size={20} /> : <Edit2 size={20} />}
            size="md"
            footer={
                <>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSave}
                        className={`px-6 py-2 text-white rounded-sm font-bold shadow-md flex items-center gap-2 transition-transform hover:scale-105 ${editForm.type === 'avantage' ? 'bg-[#2d5a27] hover:bg-[#1e3d1a]' : 'bg-[#8b2e2e] hover:bg-[#6a2424]'}`}
                    >
                        <Save size={18} />
                        Enregistrer
                    </button>
                </>
            }
        >
            <div className="flex flex-col gap-6 py-2">

                {/* Type Switcher */}
                <div className="flex justify-center mb-2">
                    <div className="bg-stone-200/50 p-1 rounded-sm flex shadow-inner border border-[#bfae85]/30">
                        <button
                            onClick={() => setEditForm({ ...editForm, type: 'avantage' })}
                            className={`px-6 py-2 rounded-sm text-xs font-serif font-black uppercase tracking-widest transition-all ${editForm.type === 'avantage' ? 'bg-[#2d5a27] text-white shadow-md' : 'text-[#5c4d41] hover:text-stone-800'}`}
                        >
                            Avantage
                        </button>
                        <button
                            onClick={() => setEditForm({ ...editForm, type: 'desavantage' })}
                            className={`px-6 py-2 rounded-sm text-xs font-serif font-black uppercase tracking-widest transition-all ${editForm.type === 'desavantage' ? 'bg-[#8b2e2e] text-white shadow-md' : 'text-[#5c4d41] hover:text-stone-800'}`}
                        >
                            Désavantage
                        </button>
                    </div>
                </div>

                {/* Name & Cost (Smart Input) */}
                <div className="grid grid-cols-5 gap-4">
                    <div className="col-span-3">
                        <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1.5 tracking-widest">Nom du Trait</label>
                        <input
                            className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 font-serif font-black text-[#1c1917] bg-white/50 focus:border-amber-500 outline-none shadow-sm placeholder-stone-300"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            placeholder="Ex: Chance, Ennemi..."
                        />
                    </div>
                    <div className="col-span-2 relative">
                        <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1.5 tracking-widest flex items-center justify-between">
                            <span>Coût / Valeur</span>
                            <div className="group relative">
                                <Info size={12} className="text-[#bfae85] cursor-help" />
                                <div className="absolute right-0 bottom-full mb-2 w-48 bg-stone-800 text-white text-[9px] p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 font-sans normal-case tracking-normal leading-normal">
                                    Saisissez un nombre (ex: 3), une plage (ex: 1-5) ou une liste (ex: 1, 3, 5).
                                </div>
                            </div>
                        </label>
                        <div className="relative">
                            <input
                                className="w-full border border-[#bfae85]/50 rounded-sm pl-8 pr-3 py-2 font-mono focus:border-amber-500 outline-none text-[#1c1917] bg-white/50 shadow-sm font-bold"
                                value={editForm.pointsLabel}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const firstNumMatch = val.match(/\d+/);
                                    const firstNum = firstNumMatch ? firstNumMatch[0] : '0';
                                    const isVar = /[-,–—,;]/.test(val) || val.includes('..');

                                    setEditForm({
                                        ...editForm,
                                        pointsLabel: val,
                                        cost: firstNum,
                                        isVariableCost: isVar
                                    });
                                }}
                                placeholder="ex: 1-5"
                            />
                            <Coins size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#bfae85]" />
                        </div>

                        {/* Cost Helper Legend */}
                        <div className={`text-[9px] mt-1.5 font-bold flex items-center gap-1.5 ${parsedCostInfo.color} animate-in fade-in slide-in-from-left-1 duration-300`}>
                            <div className={`w-1.5 h-1.5 rounded-full bg-current opacity-40`} />
                            {parsedCostInfo.label}
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1.5 tracking-widest flex items-center gap-1"><AlignLeft size={12} /> Description Narrative</label>
                    <textarea
                        className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-3 text-sm text-[#1c1917] bg-white/50 min-h-[100px] focus:border-amber-500 outline-none resize-y placeholder-stone-300 italic leading-relaxed shadow-sm"
                        value={editForm.description || ""}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Décrivez les effets narratifs ou les conditions d'utilisation..."
                    />
                </div>

                {/* Tags */}
                <div>
                    <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1.5 tracking-widest">Catégories (Tags)</label>
                    <div className="flex gap-2 mb-3">
                        <input
                            className="flex-grow border border-[#bfae85]/50 rounded-sm px-3 py-2 text-sm text-[#1c1917] bg-white/50 focus:border-amber-500 outline-none shadow-sm"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                            placeholder="Ajouter une catégorie..."
                        />
                        <button onClick={addTag} className="bg-stone-200 hover:bg-stone-300 text-[#5c4d41] px-4 py-2 rounded-sm text-sm font-bold transition-colors">
                            +
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {(editForm.tags || []).map(tag => (
                            <span key={tag} className="bg-amber-100/50 text-[#845d3e] px-2.5 py-1 rounded-sm text-[10px] font-bold flex items-center gap-1.5 border border-amber-200/50 shadow-sm">
                                {tag}
                                <button onClick={() => removeTag(tag)} className="hover:text-[#8b2e2e] transition-colors"><X size={12} /></button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Configuration: Variable Trait */}
                <div className="bg-[#bfae85]/10 border border-[#bfae85]/30 rounded-sm p-3 flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="isVariable"
                        className="w-4 h-4 accent-amber-600 cursor-pointer"
                        checked={editForm.isVariable || false}
                        onChange={(e) => setEditForm({ ...editForm, isVariable: e.target.checked })}
                    />
                    <label htmlFor="isVariable" className="cursor-pointer select-none">
                        <span className="block text-sm font-bold text-[#5c4d41]">Trait à Complément / Variable</span>
                        <span className="block text-[10px] text-[#5c4d41]/70 italic">Cochez si le joueur doit préciser quelque chose à la sélection (ex: "Allergie : Chats").</span>
                    </label>
                </div>

                {editForm.isVariable && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200 -mt-4 px-1">
                        <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">Variantes suggérées (Réserve)</label>
                        <input
                            className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 text-xs text-[#1c1917] bg-[#fdfbf7] focus:border-amber-500 outline-none shadow-sm font-bold placeholder:italic placeholder:font-normal"
                            value={variantDraft}
                            onChange={(e) => setVariantDraft(e.target.value)}
                            onBlur={() => {
                                const cleaned = variantDraft.split(',').map(v => v.trim()).filter(Boolean);
                                setEditForm({ ...editForm, variants: cleaned });
                            }}
                            placeholder="Ex: Chats, Pollen, Poussière..."
                        />
                        <p className="text-[9px] text-[#5c4d41]/70 mt-1 italic px-1">Séparez par des virgules. Ces options seront proposées lors de l'édition du trait sur la fiche perso.</p>
                    </div>
                )}

                {/* Effects Section */}
                <div className="border border-[#bfae85]/20 rounded-sm bg-white/30">
                    <TraitEffectEditor
                        effects={editForm.effects || []}
                        allSkills={allSkills}
                        allAttributes={allAttributes}
                        allCounters={allCounters}
                        allFormulas={allFormulas}
                        onAdd={addEffect}
                        onUpdate={updateEffect}
                        onRemove={removeEffect}
                    />
                </div>

                {error && (
                    <div className="bg-[#8b2e2e]/5 border border-[#8b2e2e]/20 text-[#8b2e2e] px-4 py-3 rounded-sm flex items-center gap-3 text-xs font-bold animate-shake">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

            </div>
        </ThematicModal>
    );
};

export default TraitForm;
