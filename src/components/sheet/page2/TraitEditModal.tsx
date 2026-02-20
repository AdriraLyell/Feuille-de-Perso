import React, { useState, useEffect } from 'react';
import ThematicModal from '../../ui/ThematicModal';
import ThematicButton from '../../ui/ThematicButton';
import { TraitEntry } from '../../../types';
import { Save, X, Edit } from 'lucide-react';

interface TraitEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    trait: TraitEntry | null;
    onSave: (updatedTrait: TraitEntry) => void;
    type: 'avantages' | 'desavantages';
}

const TraitEditModal: React.FC<TraitEditModalProps> = ({ isOpen, onClose, trait, onSave, type }) => {
    const [editedTrait, setEditedTrait] = useState<TraitEntry | null>(null);

    useEffect(() => {
        if (isOpen && trait) {
            setEditedTrait({ ...trait });
        }
    }, [isOpen, trait]);

    const handleChange = (field: keyof TraitEntry, value: string) => {
        setEditedTrait(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleSave = () => {
        if (editedTrait) {
            onSave(editedTrait);
        }
    };

    if (!editedTrait) return null;

    return (
        <ThematicModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Éditer ${type === 'avantages' ? 'l\'Avantage' : 'le Désavantage'}`}
            icon={<Edit size={24} />}
            size="md"
            footer={
                <div className="flex justify-end gap-2 w-full">
                    <ThematicButton onClick={onClose} variant="secondary" leftIcon={<X size={16} />}>
                        Annuler
                    </ThematicButton>
                    <ThematicButton onClick={handleSave} variant="primary" leftIcon={<Save size={16} />}>
                        Sauvegarder
                    </ThematicButton>
                </div>
            }
        >
            <div className="p-4 space-y-4">
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
