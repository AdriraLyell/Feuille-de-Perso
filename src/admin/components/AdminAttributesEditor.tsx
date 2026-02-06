import React from 'react';
import { RulesData } from '../../types/rules';
import { Zap, LayoutGrid, Info, Shield } from 'lucide-react';
import ThematicModal from '../../components/ui/ThematicModal';
import AttributeCategoryCard from './attributes/AttributeCategoryCard';
import AttributePresetManager from './attributes/AttributePresetManager';
import { useAttributeEditor } from '../hooks/useAttributeEditor';

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
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header / Info */}
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
                <div className="flex gap-3">
                    <Info className="text-blue-500 shrink-0" size={20} />
                    <div className="space-y-1">
                        <h4 className="text-sm font-bold text-blue-900">Information sur la Structure</h4>
                        <p className="text-xs text-blue-800/80 leading-relaxed">
                            Tous les pavés d'attributs doivent avoir le <span className="font-bold underline">même nombre</span> de caractéristiques.
                            Les modifications de nombre d'attributs (ajout/suppression) s'appliquent automatiquement à l'ensemble des pavés.
                        </p>
                    </div>
                </div>
            </div>

            {/* PRESETS SECTION */}
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

            {/* COLUMNS SECTION */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-700 uppercase tracking-widest text-sm flex items-center gap-2">
                        <LayoutGrid size={18} className="text-blue-600" /> Structure ({categories.length} / 5 Pavés)
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Secondaires</span>
                            <button
                                onClick={actions.toggleSecondaryGlobal}
                                className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-200 ${rules.configurations.global.secondaryAttributes ? 'bg-blue-600' : 'bg-slate-300'}`}
                            >
                                <div className={`bg-white w-3 h-3 rounded-full shadow transform transition-transform duration-200 ${rules.configurations.global.secondaryAttributes ? 'translate-x-4' : ''}`} />
                            </button>
                        </div>

                        <button
                            onClick={actions.addAttribute}
                            className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-colors bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        >
                            <Shield size={14} /> Ajouter un Attribut
                        </button>

                        <button
                            onClick={actions.addCategory}
                            disabled={categories.length >= 5}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-colors ${categories.length >= 5
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-slate-800 hover:bg-slate-700 text-white shadow-sm'}`}
                        >
                            <LayoutGrid size={14} /> Ajouter un Pavé
                        </button>
                    </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-${Math.min(categories.length, 5)} gap-6`}>
                    {categories.map(cat => (
                        <AttributeCategoryCard
                            key={cat}
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
                    ))}
                </div>
            </div>

            {/* CONFIRM MODAL */}
            {states.showPresetConfirm && states.pendingPreset && (
                <ThematicModal
                    isOpen={states.showPresetConfirm}
                    onClose={() => { states.setShowPresetConfirm(false); states.setPendingPreset(null); }}
                    title="Charger le préréglage ?"
                    icon={<Zap size={24} className="text-amber-600" />}
                    size="md"
                    footer={
                        <>
                            <button onClick={() => { states.setShowPresetConfirm(false); states.setPendingPreset(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded font-bold">Annuler</button>
                            <button onClick={actions.executePresetLoad} className="px-6 py-2 bg-amber-600 text-white rounded font-bold shadow hover:bg-amber-700">
                                Confirmer
                            </button>
                        </>
                    }
                >
                    <div className="flex flex-col items-center text-center space-y-4 py-4">
                        <p className="text-sm text-slate-600">
                            Cette action remplacera <span className="font-bold text-red-600">toute</span> votre configuration d'attributs actuelle par le modèle :
                        </p>
                        <div className="bg-amber-50 p-2 rounded border border-amber-200 font-bold text-amber-900">
                            {states.pendingPreset.name}
                        </div>
                        <p className="text-xs text-slate-400 italic">Les noms et scores actuels seront perdus.</p>
                    </div>
                </ThematicModal>
            )}
        </div>
    );
};

export default AdminAttributesEditor;
