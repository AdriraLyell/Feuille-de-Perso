import React, { useState, useEffect } from 'react';
import ThematicModal from '../../ui/ThematicModal';
import ThematicButton from '../../ui/ThematicButton';
import { TraitEntry } from '../../../types';
import { Save, X, Edit, Sparkles, RotateCcw } from 'lucide-react';
import { useCharacter } from '../../../context/CharacterContext';
import { useRules } from '../../../context/RulesContext';
import { normalizeString } from '../../../utils/stringUtils';

interface TraitEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    trait: TraitEntry | null;
    onSave: (updatedTrait: TraitEntry) => void;
    type: 'avantages' | 'desavantages';
}

const TraitEditModal: React.FC<TraitEditModalProps> = ({ isOpen, onClose, trait, onSave, type }) => {
    const [editedTrait, setEditedTrait] = useState<TraitEntry | null>(null);
    const { data } = useCharacterState();
    const { addLog: onAddLog } = useCharacterActions();
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

        setEditedTrait(updatedTrait);
        onSave(updatedTrait);
        onAddLog(`${isFixedCost ? 'Rachat' : 'Réduction'} du trait ${editedTrait.name} pour ${xpCost} XP.`, 'success', 'sheet');
    };

    const handleIncreaseTrait = () => {
        if (!editedTrait || !isPostCreation) return;

        const currentValue = parseInt(editedTrait.value) || 0;

        const updatedTrait = {
            ...editedTrait,
            value: (currentValue + 1).toString(),
            creationValue: editedTrait.creationValue ?? editedTrait.value // Preserve initial creation value
        };

        setEditedTrait(updatedTrait);
        onSave(updatedTrait);
        onAddLog(`Amélioration du trait ${editedTrait.name} pour ${traitCostFactor} XP.`, 'success', 'sheet');
    };

    const handleRevertXP = () => {
        if (!editedTrait || !editedTrait.creationValue) return;
        const creationVal = parseInt(editedTrait.creationValue) || 0;
        const levelsRefunded = (parseInt(editedTrait.value) || 0) - creationVal;
        if (levelsRefunded <= 0) return;
        const xpRefund = levelsRefunded * traitCostFactor;

        const updatedTrait = { ...editedTrait, value: creationVal.toString() };
        setEditedTrait(updatedTrait);
        onSave(updatedTrait);
        onAddLog(`Annulation de ${levelsRefunded} amélioration(s) XP sur "${editedTrait.name}" : +${xpRefund} XP remboursés.`, 'success', 'sheet');
    };

    if (!editedTrait) return null;

    const currentValue = parseInt(editedTrait.value) || 0;
    const isFixedCost = editedTrait.value.toLowerCase().includes('pts') || !/^\d+$/.test(editedTrait.value.trim());

    // Extract max value from library cost strings (e.g., "1-3", "2 à 5", "1, 2, 3")
    const extractMaxFromCost = (cost: string): number => {
        const matches = cost.match(/\d+/g);
        if (matches && matches.length >= 2) {
            return Math.max(...matches.map(Number));
        }
        return 0; // Not a range
    };

    // Check if the trait is variable in the library and get its max
    const libEntry = data.library?.find(e => e.id === editedTrait.definitionId);
    const libCost = libEntry?.pointsLabel || libEntry?.cost || '';
    const maxValue = extractMaxFromCost(libCost);
    const isActuallyVariable = maxValue > 0;
    // Is the trait flagged as variant-requiring in the library?
    const isVariantTrait = !!libEntry?.isVariable || !!editedTrait.variant;

    const isImproved = !editedTrait.isPostCreation && editedTrait.creationValue !== undefined && currentValue > (parseInt(editedTrait.creationValue) || 0);

    // Check if upgradeable via new property (native to TraitEntry or LibraryEntry)
    const isUpgradeable = !!editedTrait.isXPUpgradeable || !!libEntry?.isXPUpgradeable ||
        !!rules?.libraries?.traits?.find(t => t.id === editedTrait.definitionId || normalizeString(t.name) === normalizeString(editedTrait.name))?.isXPUpgradeable;

    const canReduce = isPostCreation && type === 'desavantages' && currentValue > 0;
    const canIncrease = isPostCreation && type === 'avantages' && (isActuallyVariable || isUpgradeable) && currentValue > 0;
    const canRevertXP = isPostCreation && type === 'avantages' && isImproved;

    return (
        <ThematicModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Éditer ${type === 'avantages' ? 'l\'Avantage' : 'le Désavantage'}`}
            icon={<Edit size={24} />}
            size="md"
            footer={
                <div className="flex items-center w-full gap-3">
                    {/* Zone XP — gauche */}
                    {(canReduce || canIncrease || canRevertXP) && (
                        <div className="flex items-center gap-2 flex-1">
                            {canReduce && (
                                <button
                                    onClick={handleReduceTrait}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                                >
                                    <Sparkles size={12} />
                                    {isFixedCost
                                        ? `Racheter (${currentValue * traitCostFactor} XP)`
                                        : `Réduire (${traitCostFactor} XP)`}
                                </button>
                            )}
                            {canIncrease && (
                                <button
                                    onClick={handleIncreaseTrait}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                                >
                                    <Sparkles size={12} />
                                    Améliorer ({traitCostFactor} XP)
                                </button>
                            )}
                            {canRevertXP && (
                                <>
                                    {(canReduce || canIncrease) && (
                                        <div className="w-px h-5 bg-stone-300" />
                                    )}
                                    <button
                                        onClick={handleRevertXP}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 transition-colors"
                                        title="Annuler toutes les améliorations XP sur ce trait"
                                    >
                                        <RotateCcw size={12} />
                                        Annuler (+{((currentValue - (parseInt(editedTrait!.creationValue!) || 0)) * traitCostFactor)} XP)
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Zone formulaire — droite */}
                    <div className="flex items-center gap-2 ml-auto shrink-0">
                        <ThematicButton onClick={onClose} variant="secondary" size="sm" leftIcon={<X size={14} />}>
                            Fermer
                        </ThematicButton>
                        <ThematicButton onClick={handleSave} variant="primary" size="sm" leftIcon={<Save size={14} />}>
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
                {isImproved && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-blue-800 text-xs font-bold flex items-center gap-2">
                        <Sparkles size={14} /> Trait amélioré post-création via XP
                    </div>
                )}

                {/* Nom — lecture seule, défini par la règle */}
                <div>
                    <label htmlFor="trait-name" className="block text-sm font-bold text-slate-700 mb-1">Nom du trait</label>
                    <input
                        id="trait-name"
                        type="text"
                        value={editedTrait.name || ''}
                        readOnly
                        className="w-full border-2 border-stone-100 rounded-lg p-2 bg-stone-50 text-stone-600 font-handwriting text-lg cursor-not-allowed"
                    />
                </div>

                {/* Coût — lecture seule, fixé par la bibliothèque */}
                <div>
                    <label htmlFor="trait-cost" className="block text-sm font-bold text-slate-700 mb-1">
                        Coût / Valeur <span className="text-[10px] font-normal text-slate-400">(défini par les règles)</span>
                    </label>
                    <input
                        id="trait-cost"
                        type="text"
                        value={editedTrait.value || ''}
                        readOnly
                        className="w-full border-2 border-stone-100 rounded-lg p-2 bg-stone-50 text-stone-500 font-mono cursor-not-allowed"
                    />
                </div>

                {/* Variante — uniquement si le trait est à variante */}
                {isVariantTrait && (
                    <div>
                        <label htmlFor="trait-variant" className="block text-sm font-bold text-slate-700 mb-1">Variante / Spécialité</label>
                        <input
                            id="trait-variant"
                            type="text"
                            value={editedTrait.variant || ''}
                            onChange={(e) => handleChange('variant', e.target.value)}
                            className="w-full border-2 border-stone-200 rounded-lg p-2 focus:border-stone-400 focus:outline-none bg-white font-handwriting text-lg"
                            placeholder="Ex: Épée longue..."
                        />
                    </div>
                )}

                {/* Description — modifiable par le joueur (notes perso) */}
                <div>
                    <label htmlFor="trait-notes" className="block text-sm font-bold text-slate-700 mb-1">Description / Notes personnelles</label>
                    <textarea
                        id="trait-notes"
                        value={editedTrait.description || ''}
                        onChange={(e) => handleChange('description', e.target.value)}
                        className="w-full border-2 border-stone-200 rounded-lg p-2 focus:border-stone-400 focus:outline-none bg-white min-h-[100px] resize-y"
                        placeholder="Ajoutez vos notes ou la description narrative du trait..."
                    />
                </div>
            </div>
        </ThematicModal>
    );
};

export default TraitEditModal;
