import React from 'react';
import { CharacterSheetData, DotEntry, SkillCategoryKey } from '../../types';
import { Save, GraduationCap } from 'lucide-react';
import ThematicModal from '../ui/ThematicModal';
import { useRules } from '../../context/RulesContext';
import { useSkillsEditorActions } from './hooks/useSkillsEditorActions';
import { SkillCategoryEditor } from './skills/SkillCategoryEditor';

interface SkillsEditorProps {
    data: CharacterSheetData;
    onUpdate: (newData: CharacterSheetData) => void;
    onAddLog: (message: string, type?: 'success' | 'danger' | 'info', category?: 'sheet' | 'settings') => void;
    draggedItem: { type: 'sheet_skill' | 'lib_skill', category?: string, index?: number, id?: string, data?: any } | null;
    setDraggedItem: (item: any) => void;
}

const SkillsEditor: React.FC<SkillsEditorProps> = ({ data, onUpdate, onAddLog, draggedItem, setDraggedItem }) => {
    const { rules } = useRules();
    const skillCategories = rules?.definitions?.skillCategories || [];

    const actions = useSkillsEditorActions({
        data,
        onUpdate,
        onAddLog,
        draggedItem,
        setDraggedItem,
        rules
    });

    const {
        variantModalOpen,
        setVariantModalOpen,
        pendingSkillDrop,
        setPendingSkillDrop,
        variantInput,
        setVariantInput,
        confirmVariableSkill
    } = actions;

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
            <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {skillCategories.map((cat) => (
                        <div key={cat.id} className="min-h-[200px]">
                            <SkillCategoryEditor
                                title={cat.label}
                                category={cat.id}
                                heightClass="h-full"
                                defaultItemName={cat.behavior === 'Arrière-plan' ? 'Nouvel Arrière Plan' : 'Nouvelle Compétence'}
                                list={(data.skills?.[cat.id as SkillCategoryKey] || []) as DotEntry[]}
                                draggedItem={draggedItem}
                                actions={actions}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Custom Counters section removed per user request (counters managed in Library/System only) */}

            {/* Variable Skill Modal */}
            {variantModalOpen && pendingSkillDrop && (
                <ThematicModal
                    isOpen={variantModalOpen}
                    onClose={() => { setVariantModalOpen(false); setPendingSkillDrop(null); }}
                    title="Précision requise"
                    icon={<GraduationCap size={24} />}
                    size="md"
                    footer={
                        <>
                            <button
                                onClick={() => { setVariantModalOpen(false); setPendingSkillDrop(null); }}
                                className="px-4 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={confirmVariableSkill}
                                className="px-6 py-2 bg-[#5c4d41] text-white rounded-sm font-bold shadow-md hover:bg-[#4a3b32] flex items-center gap-2"
                            >
                                <Save size={16} /> Confirmer
                            </button>
                        </>
                    }
                >
                    <div className="flex flex-col gap-4 py-2">
                        <div className="bg-amber-50/50 border border-amber-200/50 p-3 rounded-sm text-sm text-[#5c4d41]">
                            Vous ajoutez la compétence <strong>{pendingSkillDrop.libItem.name}</strong>.
                            <br />
                            Cette compétence nécessite une précision (variante).
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">
                                Spécialité / Variante (ex: Forge, Histoire, Épées...)
                            </label>
                            <input
                                className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 font-serif font-black text-[#1c1917] bg-white/50 focus:border-amber-500 outline-none shadow-sm text-lg"
                                value={variantInput}
                                onChange={(e) => setVariantInput(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && confirmVariableSkill()}
                            />

                            {/* Suggested Variants */}
                            {pendingSkillDrop.libItem.variants && pendingSkillDrop.libItem.variants.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[#bfae85]/20">
                                    <span className="w-full text-[9px] font-bold text-[#bfae85] uppercase tracking-wider mb-1">Variantes suggérées :</span>
                                    {pendingSkillDrop.libItem.variants.map((v: string) => (
                                        <button
                                            key={v}
                                            onClick={() => setVariantInput(v)}
                                            className={`px-2 py-1 text-xs rounded-full border transition-all ${variantInput === v ? 'bg-[#8b2e2e] text-white border-[#8b2e2e]' : 'bg-white text-[#5c4d41] border-[#bfae85]/30 hover:border-[#8b2e2e] hover:shadow-sm'}`}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </ThematicModal>
            )}
        </div>
    );
};

export default SkillsEditor;
