import React, { useState, useEffect } from 'react';
import ThematicModal from '../../ui/ThematicModal';
import ThematicButton from '../../ui/ThematicButton';
import { TraitEntry } from '../../../types';
import { Save, X, Edit, Sparkles } from 'lucide-react';
import { useCharacter } from '../../../context/CharacterContext';
import { useRules } from '../../../context/RulesContext';

interface TraitEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    trait: TraitEntry | null;
    onSave: (updatedTrait: TraitEntry) => void;
    type: 'avantages' | 'desavantages';
}

const TraitEditModal: React.FC<TraitEditModalProps> = ({ isOpen, onClose, trait, onSave, type }) => {
    const [editedTrait, setEditedTrait] = useState<TraitEntry | null>(null);
    const { data, updateData: onChange, addLog: onAddLog } = useCharacter();
    const { rules } = useRules();

    useEffect(() => {
        if (isOpen && trait) {
            setEditedTrait({ ...trait });
        }
    }, [isOpen, trait]);

    const isPostCreation = !data.creationConfig?.active;
    const traitCostFactor = rules?.configurations?.xpCosts?.traitCost ?? (data.xpCosts?.traitCost ?? 5);

    const handleChange = (field: keyof TraitEntry, value: string) => {
        setEditedTrait(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleSave = () => {
        if (editedTrait) {
            onSave(editedTrait);
        }
    };

    const handleReduceTrait = () => {
        if (!editedTrait || !isPostCreation) return;

        const currentValue = parseInt(editedTrait.value) || 0;
        if (currentValue <= 0) return;

        const isFixedCost = editedTrait.value.toLowerCase().includes('pts') || !/^\d+$/.test(editedTrait.value.trim());
        const reductionAmount = isFixedCost ? currentValue : 1;
        const newValue = currentValue - reductionAmount;
        const xpCost = reductionAmount * traitCostFactor;

        // update object locally
        const updatedTrait = {
            ...editedTrait,
            value: newValue.toString(),
            creationValue: editedTrait.creationValue ?? editedTrait.value // Store initial if not set
        };

        const xpLog = {
            id: crypto.randomUUID(),
            date: new Date().toLocaleDateString(),
            scenario: isFixedCost ? `Rachat : ${editedTrait.name}` : `Réduction : ${editedTrait.name}`,
            spendingLocation: "Traits",
            amount: -xpCost
        };

        const newData = {
            ...data,
            xpLogs: [xpLog, ...(data.xpLogs || [])]
        };

        // If the trait reaches 0, its effects are already ignored by xpCalculator check if value === 0
        setEditedTrait(updatedTrait);
        onSave(updatedTrait);
        onChange(newData);
        onAddLog(`${isFixedCost ? 'Rachat' : 'Réduction'} du trait ${editedTrait.name} pour ${xpCost} XP.`, 'success', 'sheet');
    };

    if (!editedTrait) return null;

    const currentValue = parseInt(editedTrait.value) || 0;
    const isFixedCost = editedTrait.value.toLowerCase().includes('pts') || !/^\d+$/.test(editedTrait.value.trim());
    const canReduce = isPostCreation && type === 'desavantages' && currentValue > 0;

    return (
        <ThematicModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Éditer ${type === 'avantages' ? 'l\'Avantage' : 'le Désavantage'}`}
            icon={<Edit size={24} />}
            size="md"
            footer={
                <div className="flex justify-between items-center w-full">
                    <div>
                        {canReduce && (
                            <ThematicButton
                                onClick={handleReduceTrait}
                                variant="primary"
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                leftIcon={<Sparkles size={16} />}
                            >
                                {isFixedCost
                                    ? `Racheter totalement (${currentValue * traitCostFactor} XP)`
                                    : `Réduire d'un niveau (${traitCostFactor} XP)`}
                            </ThematicButton>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <ThematicButton onClick={onClose} variant="secondary" leftIcon={<X size={16} />}>
                            Annuler
                        </ThematicButton>
                        <ThematicButton onClick={handleSave} variant="primary" leftIcon={<Save size={16} />}>
                            Sauvegarder
                        </ThematicButton>
                    </div>
                </div>
            }
        >
            <div className="p-4 space-y-4">
                {editedTrait.isPostCreation && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <Sparkles size={14} /> Trait acquis post-création via XP
                    </div>
                )}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Nom du trait</label>
                    <input
                        type="text"
                        value={editedTrait.name || ''}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full border-2 border-stone-200 rounded-lg p-2 focus:border-stone-400 focus:outline-none bg-white font-handwriting text-lg"
                        placeholder="Ex: Chance..."
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Coût / Valeur</label>
                        <input
                            type="text"
                            value={editedTrait.value || ''}
                            onChange={(e) => handleChange('value', e.target.value)}
                            className="w-full border-2 border-stone-200 rounded-lg p-2 focus:border-stone-400 focus:outline-none bg-white"
                            placeholder="Ex: 5 PTS, 1/rang..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Variante / Spécialité</label>
                        <input
                            type="text"
                            value={editedTrait.variant || ''}
                            onChange={(e) => handleChange('variant', e.target.value)}
                            className="w-full border-2 border-stone-200 rounded-lg p-2 focus:border-stone-400 focus:outline-none bg-white font-handwriting text-lg"
                            placeholder="Ex: Épée longue..."
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Description / Effet</label>
                    <textarea
                        value={editedTrait.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="w-full border-2 border-stone-200 rounded-lg p-2 focus:border-stone-400 focus:outline-none bg-white min-h-[100px] resize-y"
                        placeholder="Saisissez la description du trait..."
                    />
                </div>
            </div>
        </ThematicModal>
    );
};

export default TraitEditModal;
