
import React from 'react';
import { LibraryEntry, TraitEffect, LibraryFormulaEntry } from '../../types';
import { Edit2, Plus, X, AlignLeft, Save, AlertCircle, Coins, Info, Sparkles, BookOpen, Eye } from 'lucide-react';
import TraitEffectEditor from './TraitEffectEditor';
import ThematicModal from '../ui/ThematicModal';

interface TraitFormProps {
    editForm: LibraryEntry;
    isOfficial?: boolean;
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
    updateEffectFields?: (id: string, updates: Partial<TraitEffect>) => void;
    removeEffect: (id: string) => void;
    isEditable?: boolean;
}


const TraitForm: React.FC<TraitFormProps> = ({
    editForm,
    isOfficial = false,
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
    updateEffectFields,
    removeEffect,
    isEditable = true
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
            title={isNew ? 'Nouveau Trait' : isEditable ? 'Éditer le Trait' : 'Détails du Trait'}
            icon={isNew ? <Plus size={20} /> : isEditable ? <Edit2 size={20} /> : <BookOpen size={20} />}
            size="md"
            footer={
                <>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold transition-colors"
                    >
                        {isEditable ? 'Annuler' : 'Fermer'}
                    </button>
                    {isEditable && (
                        <button
                            onClick={handleSave}
                            className={`px-6 py-2 text-white rounded-sm font-bold shadow-md flex items-center gap-2 transition-transform hover:scale-105 ${editForm.type === 'avantage' ? 'bg-[#2d5a27] hover:bg-[#1e3d1a]' : 'bg-[#8b2e2e] hover:bg-[#6a2424]'}`}
                        >
                            <Save size={18} />
                            Enregistrer
                        </button>
                    )}
                </>
            }
        >
            <div className="flex flex-col gap-6 py-2">
                {/* Bannière contextuelle : édition officielle OU consultation */}
                {!isEditable ? (
                    <div className="bg-stone-100 border border-stone-300 text-stone-600 px-3 py-2 rounded-sm flex items-center gap-2 text-[11px] font-bold">
                        <Eye size={13} className="shrink-0" />
                        <span>Mode consultation — ce trait est en <span className="font-black">lecture seule</span>.</span>
                    </div>
                ) : isOfficial ? (
                    <div className="bg-blue-50/50 border border-blue-200 text-blue-800 px-4 py-3 rounded-sm flex items-start gap-3 text-sm shadow-sm">
                        <Info size={18} className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">Modification d'un Trait Officiel</p>
                            <p className="text-xs opacity-80 mt-1">
                                En modifiant ce trait, vous créez une version personnalisée qui remplacera la version officielle pour votre campagne.
                                Vous pouvez à tout moment supprimer cette version locale pour revenir à l'original.
                            </p>
                        </div>
                    </div>
                ) : null}

                {/* Type Switcher */}
                <div className="flex justify-center mb-2">
                    <div className="bg-stone-200/50 p-1 rounded-sm flex shadow-inner border border-[#bfae85]/30">
                        <button
                            disabled={!isEditable}
                            onClick={() => isEditable && setEditForm({ ...editForm, type: 'avantage' })}
                            className={`px-6 py-2 rounded-sm text-xs font-serif font-black uppercase tracking-widest transition ${editForm.type === 'avantage' ? 'bg-[#2d5a27] text-white shadow-md' : 'text-[#5c4d41]'} ${!isEditable ? 'cursor-default' : 'hover:text-stone-800'}`}
                        >
                            Avantage
                        </button>
                        <button
                            disabled={!isEditable}
                            onClick={() => isEditable && setEditForm({ ...editForm, type: 'desavantage' })}
                            className={`px-6 py-2 rounded-sm text-xs font-serif font-black uppercase tracking-widest transition ${editForm.type === 'desavantage' ? 'bg-[#8b2e2e] text-white shadow-md' : 'text-[#5c4d41]'} ${!isEditable ? 'cursor-default' : 'hover:text-stone-800'}`}
                        >
                            Désavantage
                        </button>
                    </div>
                </div>

                {/* Name & Cost (Smart Input) */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                        <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1.5 tracking-widest">Nom du Trait</label>
                        <input
                            className={`w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 font-serif font-black text-[#1c1917] outline-none shadow-sm placeholder-stone-300 ${!isEditable ? 'bg-stone-100 cursor-not-allowed text-stone-600' : 'bg-white/50 focus:border-amber-500'}`}
                            value={editForm.name}
                            disabled={!isEditable}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            placeholder="Ex: Chance, Ennemi..."
                        />
                    </div>
                    <div className="col-span-1 relative">
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
                                className={`w-full border border-[#bfae85]/50 rounded-sm pl-8 pr-3 py-2 font-mono outline-none shadow-sm font-bold ${(editForm.isLocked || !isEditable) ? 'bg-stone-100 text-stone-500 cursor-not-allowed' : 'text-[#1c1917] bg-white/50 focus:border-amber-500'}`}
                                value={editForm.pointsLabel}
                                disabled={editForm.isLocked || !isEditable}
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

                {/* Description & Tags Row */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Description */}
                    <div className="flex flex-col">
                        <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest flex items-center gap-1"><AlignLeft size={12} /> Description</label>
                        <textarea
                            className={`w-full border border-[#bfae85]/40 rounded-sm px-2.5 py-2 text-xs text-[#1c1917] min-h-[85px] h-full outline-none resize-none italic leading-relaxed shadow-sm ${!isEditable
                                    ? 'bg-stone-100 cursor-not-allowed placeholder-stone-400'
                                    : 'bg-white/50 focus:border-amber-500 placeholder-stone-300'
                                }`}
                            value={editForm.description || ""}
                            readOnly={!isEditable}
                            onChange={(e) => !isEditable ? undefined : setEditForm({ ...editForm, description: e.target.value })}
                            placeholder={!isEditable ? '— Aucune description —' : 'Effets narratifs...'}
                        />
                    </div>

                    {/* Tags */}
                    <div className="flex flex-col">
                        <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">Catégories (Tags)</label>
                        <div className={`border border-[#bfae85]/40 rounded-sm p-1.5 flex-grow flex flex-col gap-2 ${!isEditable ? 'bg-stone-100/60' : 'bg-white/40'}`}>
                            {isEditable && (
                                <div className="flex gap-1">
                                    <input
                                        className="flex-grow border border-[#bfae85]/30 rounded-sm px-2 py-1 text-[11px] text-[#1c1917] bg-white focus:border-amber-500 outline-none shadow-inner"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        placeholder="Ajouter..."
                                    />
                                    <button onClick={addTag} className="bg-stone-200 hover:bg-stone-300 text-[#5c4d41] px-2 py-1 rounded-sm text-xs font-bold transition-colors">
                                        +
                                    </button>
                                </div>
                            )}
                            <div className="flex flex-wrap gap-1 max-h-[50px] overflow-y-auto custom-scrollbar">
                                {(editForm.tags || []).map(tag => (
                                    <span key={tag} className="bg-amber-100/40 text-[#845d3e] px-1.5 py-0.5 rounded-sm text-[9px] font-bold flex items-center gap-1 border border-amber-200/40">
                                        {tag}
                                        {isEditable && <button onClick={() => removeTag(tag)} className="hover:text-[#8b2e2e]"><X size={10} /></button>}
                                    </span>
                                ))}
                                {(editForm.tags || []).length === 0 && <span className="text-[9px] text-stone-400 italic">Aucun tag</span>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className={`grid grid-cols-2 gap-3 pb-2 ${!isEditable ? 'opacity-50 pointer-events-none select-none' : ''}`}>
                    {/* Column 1: Core Configuration */}
                    <div className="flex flex-col gap-3">
                        {/* Auto Counter */}
                        <div className={`border rounded-sm p-3 flex flex-col gap-2 border-[#bfae85]/30 ${isOfficial ? 'bg-stone-50 opacity-70' : 'bg-white/40'}`}>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="hasAutoCounter"
                                    className={`w-4 h-4 accent-amber-600 ${editForm.isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                    checked={editForm.hasAutoCounter || false}
                                    disabled={editForm.isLocked}
                                    onChange={(e) => setEditForm({ ...editForm, hasAutoCounter: e.target.checked })}
                                />
                                <label htmlFor="hasAutoCounter" className={`${isOfficial ? 'cursor-not-allowed' : 'cursor-pointer'} select-none flex-grow`}>
                                    <span className="text-[11px] font-bold text-[#5c4d41] uppercase tracking-wider">Compteur Auto</span>
                                </label>
                            </div>
                            {editForm.hasAutoCounter && (
                                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                    <input
                                        className={`w-full border border-[#bfae85]/30 rounded-sm px-2 py-1.5 text-[10px] outline-none font-bold ${editForm.isLocked ? 'bg-stone-100 text-stone-500 cursor-not-allowed' : 'text-[#1c1917] bg-white/80 focus:border-amber-500'}`}
                                        value={editForm.autoCounterName || ''}
                                        disabled={editForm.isLocked}
                                        onChange={(e) => setEditForm({ ...editForm, autoCounterName: e.target.value })}
                                        placeholder="Nom du compteur..."
                                    />
                                </div>
                            )}
                        </div>

                        {/* XP Upgradeable */}
                        <div className={`border rounded-sm p-3 flex items-center gap-3 border-[#bfae85]/30 ${isOfficial ? 'bg-stone-50 opacity-70' : 'bg-white/40'}`}>
                            <input
                                type="checkbox"
                                id="isXPUpgradeable"
                                className={`w-4 h-4 accent-amber-600 ${editForm.isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                checked={editForm.isXPUpgradeable || false}
                                disabled={editForm.isLocked}
                                onChange={(e) => setEditForm({ ...editForm, isXPUpgradeable: e.target.checked })}
                            />
                            <label htmlFor="isXPUpgradeable" className={`${isOfficial ? 'cursor-not-allowed' : 'cursor-pointer'} select-none flex-grow`}>
                                <span className="text-[11px] font-bold text-[#5c4d41] uppercase tracking-wider">Achat par XP</span>
                            </label>
                        </div>
                    </div>

                    {/* Column 2: Types & Variables */}
                    <div className="flex flex-col gap-3">
                        {/* Mystic Ability */}
                        <div className={`border rounded-sm p-3 flex items-center gap-3 ${isOfficial ? 'bg-stone-50 border-purple-200/30 opacity-70' : 'bg-purple-50/20 border-purple-200/50'}`}>
                            <input
                                type="checkbox"
                                id="isMystic"
                                className={`w-4 h-4 accent-purple-600 ${editForm.isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                checked={editForm.isMystic || false}
                                disabled={editForm.isLocked}
                                onChange={(e) => setEditForm({ ...editForm, isMystic: e.target.checked })}
                            />
                            <label htmlFor="isMystic" className={`${isOfficial ? 'cursor-not-allowed' : 'cursor-pointer'} select-none flex-grow`}>
                                <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">Mystique</span>
                            </label>
                        </div>

                        {/* Variable Trait */}
                        {(() => {
                            const isForcedByFormula = (editForm.effects || []).some(ef => {
                                if (!ef.formulaId) return false;
                                const formula = (allFormulas || []).find(f => f.id === ef.formulaId);
                                return formula?.forceVariant;
                            });

                            return (
                                <div className={`border rounded-sm p-3 flex flex-col gap-2 transition ${isForcedByFormula ? 'bg-indigo-50/50 border-indigo-200' : editForm.isLocked ? 'bg-stone-50 border-[#bfae85]/30 opacity-70' : 'bg-white/40 border-[#bfae85]/30'}`}>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="isVariable"
                                            className={`w-4 h-4 ${isForcedByFormula ? 'accent-indigo-600 cursor-not-allowed' : editForm.isLocked ? 'accent-amber-600 cursor-not-allowed' : 'accent-amber-600 cursor-pointer'}`}
                                            checked={editForm.isVariable || false}
                                            disabled={isForcedByFormula || editForm.isLocked}
                                            onChange={(e) => setEditForm({ ...editForm, isVariable: e.target.checked })}
                                        />
                                        <label htmlFor="isVariable" className={`${isForcedByFormula || isOfficial ? 'cursor-not-allowed' : 'cursor-pointer'} select-none flex-grow flex items-center gap-2`}>
                                            <span className={`text-[11px] font-bold uppercase tracking-wider ${isForcedByFormula ? 'text-indigo-900' : 'text-[#5c4d41]'}`}>Variable</span>
                                            {isForcedByFormula && (
                                                <Sparkles size={10} className="text-indigo-600 animate-pulse" />
                                            )}
                                        </label>
                                    </div>
                                    {editForm.isVariable && (
                                        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                            <input
                                                className="w-full border border-[#bfae85]/30 rounded-sm px-2 py-1.5 text-[10px] text-[#1c1917] bg-white/80 focus:border-amber-500 outline-none font-bold"
                                                value={variantDraft}
                                                onChange={(e) => setVariantDraft(e.target.value)}
                                                onBlur={() => {
                                                    const cleaned = variantDraft.split(',').map(v => v.trim()).filter(Boolean);
                                                    setEditForm({ ...editForm, variants: cleaned });
                                                }}
                                                placeholder="Variantes (ex: Chats, Pollen...)"
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Effects Section */}
                <div className={`mt-1 border border-[#bfae85]/20 rounded-sm ${(editForm.isLocked || !isEditable) ? 'bg-stone-50/50 opacity-60 pointer-events-none' : 'bg-white/20'}`}>
                    <TraitEffectEditor
                        effects={editForm.effects || []}
                        allSkills={allSkills}
                        allAttributes={allAttributes}
                        allCounters={allCounters}
                        allFormulas={allFormulas}
                        onAdd={addEffect}
                        onUpdate={updateEffect}
                        onUpdateFields={updateEffectFields}
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
