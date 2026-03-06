import React from 'react';
import { RulesData } from '../../types/rules';
import { Zap, LayoutGrid, Info, Shield } from 'lucide-react';
import ThematicModal from '../../components/ui/ThematicModal';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import AttributeCategoryCard from './attributes/AttributeCategoryCard';
import AttributePresetManager from './attributes/AttributePresetManager';
import { useAttributeEditor } from '../hooks/useAttributeEditor';
import { MotionFade } from '../../components/ui/motion/MotionFade';
import { MotionCard } from '../../components/ui/motion/MotionCard';

interface AdminAttributesEditorProps {
    rules: RulesData;
    onUpdate: (newRules: RulesData) => void;
}

const AdminAttributesEditor: React.FC<AdminAttributesEditorProps> = ({ rules, onUpdate }) => {
    const {
        categories,
        attributesMap,
        secondaryMap,
        labelsMap,
        states,
        actions
    } = useAttributeEditor(rules, onUpdate);

    return (
        <div className="space-y-8">
            {/* Header / Info */}
            <MotionFade delay={0.1}>
                <MotionCard className="p-4 border-l-4 border-amber-600" hoverEffect="glow">
                    <div className="flex gap-4">
                        <Info className="text-amber-500 shrink-0 mt-0.5" size={20} />
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-amber-500 uppercase tracking-wide">Information sur la Structure</h4>
                            <p className="text-xs text-stone-400 leading-relaxed font-medium">
                                Tous les pavés d'attributs doivent avoir le <span className="font-bold underline text-stone-300">même nombre</span> de caractéristiques.
                                Les modifications de nombre d'attributs (ajout/suppression) s'appliquent automatiquement à l'ensemble des pavés.
                            </p>
                        </div>
                    </div>
                </MotionCard>
            </MotionFade>

            {/* PRESETS SECTION */}
            <MotionFade delay={0.2}>
                <AttributePresetManager
                    dbPresets={states.dbPresets}
                    isLoading={states.isLoadingPresets}
                    onLoadRequested={actions.requestPresetLoad}
                    onSaveRequested={actions.handleSaveCurrentAsPreset}
                    onUpdateRequested={actions.handleUpdatePreset}
                    onDeleteRequested={actions.handleDeletePreset}
                    currentStructureSummary={categories.map(cat => ({
                        label: labelsMap[cat] || cat,
                        count: attributesMap[cat].length
                    }))}
                />
            </MotionFade>

            {/* COLUMNS SECTION */}
            <div>
                <MotionFade delay={0.3}>
                    <div className="flex items-center justify-between mb-4 bg-stone-900/40 p-3 rounded-sm border border-stone-700/50 shadow-glass">
                        <h3 className="font-serif font-bold text-stone-300 uppercase tracking-widest text-sm flex items-center gap-2">
                            <LayoutGrid size={18} className="text-amber-500" /> Structure ({categories.length} / 5 Pavés)
                        </h3>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-stone-950/50 px-3 py-1.5 rounded-sm border border-stone-700">
                                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Secondaires</span>
                                <button
                                    onClick={actions.toggleSecondaryGlobal}
                                    className={`w-8 h-4 rounded-full px-0.5 transition-colors duration-200 border flex items-center shrink-0 ${rules.configurations.global.secondaryAttributes ? 'bg-amber-600 border-amber-500 justify-end' : 'bg-stone-800 border-stone-600 justify-start'}`}
                                >
                                    <div className={`bg-stone-200 w-2.5 h-2.5 rounded-full shadow transition-all ${rules.configurations.global.secondaryAttributes ? 'bg-stone-900' : ''}`} />
                                </button>
                            </div>

                            <button
                                onClick={actions.addAttribute}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors bg-amber-600 hover:bg-amber-500 text-stone-900 shadow-glow-gold hover:scale-105 active:scale-95"
                            >
                                <Shield size={14} /> Ajouter un Attribut
                            </button>

                            <button
                                onClick={actions.addCategory}
                                disabled={categories.length >= 5}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wide transition-colors ${categories.length >= 5
                                    ? 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-700'
                                    : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-600 hover:border-stone-500 shadow-sm'}`}
                            >
                                <LayoutGrid size={14} /> Ajouter un Pavé
                            </button>
                        </div>
                    </div>
                </MotionFade>

                <div className={`grid grid-cols-1 md:grid-cols-${Math.min(categories.length, 5)} gap-4`}>
                    {categories.map((cat, index) => (
                        <MotionFade key={cat} delay={0.4 + (index * 0.1)}>
                            <AttributeCategoryCard
                                id={cat}
                                label={labelsMap[cat] || cat}
                                primaryAttrs={attributesMap[cat]}
                                secondaryAttrs={secondaryMap[cat]}
                                isSecondaryActive={!!rules.configurations.global.secondaryAttributes}
                                onUpdateLabel={actions.updateLabel}
                                onUpdatePrimary={actions.updateItemName}
                                onUpdateSecondary={actions.updateSecondaryItemName}
                                onRemoveAttribute={actions.removeAttribute}
                                onRemoveCategory={actions.removeCategory}
                            />
                        </MotionFade>
                    ))}
                </div>
            </div>

            {/* CONFIRM MODAL */}
            {states.showPresetConfirm && states.pendingPreset && (
                <ThematicModal
                    isOpen={states.showPresetConfirm}
                    onClose={() => { states.setShowPresetConfirm(false); states.setPendingPreset(null); }}
                    title="Charger le préréglage ?"
                    icon={<Zap size={24} className="text-amber-500" />}
                    size="md"
                    scheme="mystic"
                    footer={
                        <>
                            <button onClick={() => { states.setShowPresetConfirm(false); states.setPendingPreset(null); }} className="px-4 py-2 text-stone-500 hover:text-stone-300 transition-colors uppercase font-bold text-xs tracking-wider">Annuler</button>
                            <button onClick={actions.executePresetLoad} className="px-6 py-2 bg-amber-600 text-stone-900 hover:bg-amber-500 rounded-sm font-bold shadow-glow-gold uppercase text-xs tracking-wider transition-all hover:scale-105">
                                Confirmer
                            </button>
                        </>
                    }
                >
                    <div className="flex flex-col items-center text-center space-y-4 py-4">
                        <p className="text-sm text-stone-400 font-medium">
                            Cette action remplacera <span className="font-bold text-crimson-blood">toute</span> votre configuration d'attributs actuelle par le modèle :
                        </p>
                        <div className="bg-amber-900/20 px-4 py-2 rounded-sm border border-amber-500/30 font-serif font-bold text-amber-500 text-lg tracking-wide">
                            {states.pendingPreset.name}
                        </div>
                        <p className="text-xs text-stone-500 italic">Les noms et scores actuels seront perdus.</p>
                    </div>
                </ThematicModal>
            )}

            <ConfirmationModal
                isOpen={states.confirmState.isOpen}
                onClose={states.closeConfirm}
                onConfirm={states.confirmState.onConfirm}
                title={states.confirmState.title}
                message={states.confirmState.message}
                type={states.confirmState.type}
                scheme="mystic"
            />
        </div >
    );
};

export default AdminAttributesEditor;
