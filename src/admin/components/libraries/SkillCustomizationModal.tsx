import React from 'react';
import { GraduationCap, Save, AlertOctagon, X, Sparkles } from 'lucide-react';
import ThematicModal from '../../../components/ui/ThematicModal';
import { RulesData } from '../../../types/rules';

interface SkillCustomizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingSkill: any;
    setEditingSkill: (skill: any) => void;
    variantDraft: string;
    setVariantDraft: (draft: string) => void;
    handleSave: () => void;
    error: string | null;
    showCategoryHelp: boolean;
    setShowCategoryHelp: (show: boolean) => void;
    availableCategories: { code: string; label: string }[];
    rules: RulesData;
}

export const SkillCustomizationModal: React.FC<SkillCustomizationModalProps> = ({
    isOpen,
    onClose,
    editingSkill,
    setEditingSkill,
    variantDraft,
    setVariantDraft,
    handleSave,
    error,
    showCategoryHelp,
    setShowCategoryHelp,
    availableCategories,
    rules
}) => {
    if (!isOpen || !editingSkill) return null;

    return (
        <ThematicModal
            isOpen={isOpen}
            onClose={onClose}
            title="Personnalisation Campagne"
            icon={<GraduationCap size={20} />}
            size={showCategoryHelp ? 'lg' : 'md'}
            footer={
                <>
                    <button onClick={onClose} className="px-4 py-2 text-stone-400 hover:text-stone-200 font-bold hover:bg-stone-800 rounded">Annuler</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-amber-600 text-stone-900 rounded font-bold shadow hover:bg-amber-500 flex items-center gap-2">
                        <Save size={16} /> Enregistrer
                    </button>
                </>
            }
        >
            <div className="flex flex-col gap-5 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-4 text-stone-300">
                        <div>
                            <label htmlFor="skill-name" className="block text-xs font-bold text-stone-500 uppercase mb-1">Nom</label>
                            <input
                                id="skill-name"
                                className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 font-bold focus:border-amber-500 outline-none text-stone-100"
                                value={editingSkill.name}
                                onChange={(e) => setEditingSkill({ ...editingSkill, name: e.target.value })}
                            />
                        </div>
                        <div className="bg-amber-950/20 border border-amber-500/20 rounded p-3 flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="isVariableSkill"
                                className="w-4 h-4 text-amber-600 rounded bg-stone-900 border-stone-700 cursor-pointer"
                                checked={editingSkill.isVariable || false}
                                onChange={(e) => setEditingSkill({ ...editingSkill, isVariable: e.target.checked })}
                            />
                            <label htmlFor="isVariableSkill" className="cursor-pointer select-none">
                                <span className="block text-sm font-bold text-amber-500 leading-tight">Variantes requises</span>
                                <span className="block text-[10px] text-amber-700/70 leading-tight italic">Ex: "Artisanat : Forge"</span>
                            </label>
                        </div>

                        <div className={`bg-stone-900/50 border border-stone-700 rounded p-3 flex flex-col gap-2 transition-all ${editingSkill.mysticAbilityId ? 'ring-1 ring-amber-500/30 border-amber-500/30' : ''}`}>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isMysticAbility"
                                    className="w-4 h-4 text-amber-600 rounded bg-stone-900 border-stone-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    checked={!!editingSkill.mysticAbilityId}
                                    disabled={!rules.libraries.mysticAbilities?.length}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            const firstId = rules.libraries.mysticAbilities?.[0]?.id || '';
                                            if (firstId) {
                                                setEditingSkill({ ...editingSkill, mysticAbilityId: firstId });
                                            }
                                        } else {
                                            const { mysticAbilityId: maId, ...rest } = editingSkill;
                                            setEditingSkill(rest);
                                        }
                                    }}
                                />
                                <label htmlFor="isMysticAbility" className="cursor-pointer select-none">
                                    <span className="block text-sm font-bold text-stone-200 leading-tight flex items-center gap-1.5">
                                        Lien Mystique <Sparkles size={12} className="text-amber-500" />
                                    </span>
                                    <span className="block text-[10px] text-stone-500 leading-tight">Lier à une habilité magique/martiale</span>
                                </label>
                            </div>
                            {editingSkill.mysticAbilityId !== undefined && rules.libraries.mysticAbilities && rules.libraries.mysticAbilities.length > 0 && (
                                <select
                                    className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1 text-xs focus:border-amber-500 outline-none text-amber-500 font-bold"
                                    value={editingSkill.mysticAbilityId || ""}
                                    onChange={(e) => setEditingSkill({ ...editingSkill, mysticAbilityId: e.target.value })}
                                >
                                    <option value="">-- Choisir une habilité --</option>
                                    {rules.libraries.mysticAbilities?.map(ma => (
                                        <option key={ma.id} value={ma.id}>{ma.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {editingSkill.isVariable && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                                <label htmlFor="skill-variants" className="block text-xs font-bold text-stone-500 uppercase mb-1">Suggestions de variantes</label>
                                <input
                                    id="skill-variants"
                                    className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:border-amber-500 outline-none text-stone-200"
                                    placeholder="Forge, Menuiserie, Peinture..."
                                    value={variantDraft}
                                    onChange={(e) => setVariantDraft(e.target.value)}
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <label htmlFor="skill-description" className="block text-xs font-bold text-stone-500 uppercase mb-1">Description</label>
                        <textarea
                            id="skill-description"
                            className="w-full flex-grow bg-stone-900 border border-stone-700 rounded px-3 py-2 text-sm focus:border-amber-500 outline-none resize-none min-h-[120px] text-stone-300"
                            value={editingSkill.description || ''}
                            onChange={(e) => setEditingSkill({ ...editingSkill, description: e.target.value })}
                            placeholder="Description de la compétence..."
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-950/30 text-red-400 text-xs p-3 rounded border border-red-900/50 font-bold flex items-center gap-2">
                        <AlertOctagon size={16} /> {error}
                    </div>
                )}
            </div>

            {showCategoryHelp && (
                <div className="w-full lg:w-72 shrink-0 animate-in slide-in-from-right-4 duration-300 bg-stone-900 p-4 rounded border border-stone-800 shadow-xl">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-stone-800">
                        <h4 className="font-bold text-amber-500 text-xs uppercase tracking-wider">Codes Catégories</h4>
                        <button onClick={() => setShowCategoryHelp(false)} className="text-stone-500 hover:text-stone-300"><X size={14} /></button>
                    </div>
                    <div className="space-y-2 text-[10px] custom-scrollbar max-h-60 overflow-y-auto">
                        {availableCategories.map(cat => (
                            <div key={cat.code} className="grid grid-cols-[60px_1fr] gap-2 items-start border-b border-stone-800/50 pb-1">
                                <code className="bg-stone-950 px-1 rounded font-mono text-amber-500/70 border border-amber-500/10 text-[9px] truncate">{cat.code}</code>
                                <span className="text-stone-400 font-medium">{cat.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </ThematicModal>
    );
};
