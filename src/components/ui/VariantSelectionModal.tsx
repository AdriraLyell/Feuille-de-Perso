import React, { useState, useEffect } from 'react';
import ThematicModal from './ThematicModal';
import { Layers, Save, PlusCircle, CheckCircle2, Circle } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (variant: string) => void;
    skillName: string;
    variants: string[]; // List of suggested variants from the library
}

const VariantSelectionModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onConfirm,
    skillName,
    variants
}) => {
    const [selectionMode, setSelectionMode] = useState<'suggestion' | 'custom'>('suggestion');
    const [selectedSuggestion, setSelectedSuggestion] = useState<string>('');
    const [customValue, setCustomValue] = useState<string>('');

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            if (variants && variants.length > 0) {
                setSelectionMode('suggestion');
                setSelectedSuggestion(variants[0]);
            } else {
                setSelectionMode('custom');
            }
            setCustomValue('');
        }
    }, [isOpen, variants]);

    const handleConfirm = () => {
        if (selectionMode === 'suggestion' && selectedSuggestion) {
            onConfirm(selectedSuggestion);
        } else if (selectionMode === 'custom' && customValue.trim()) {
            onConfirm(customValue.trim());
        }
    };

    const hasSuggestions = variants && variants.length > 0;

    const footer = (
        <>
            <button
                onClick={onClose}
                className="px-4 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold transition-colors"
            >
                Annuler
            </button>
            <button
                onClick={handleConfirm}
                disabled={selectionMode === 'custom' && !customValue.trim()}
                className={`px-6 py-2 rounded-sm font-bold shadow-md flex items-center gap-2 transition-all
                    ${(selectionMode === 'custom' && !customValue.trim())
                        ? 'bg-stone-400 text-stone-200 cursor-not-allowed'
                        : 'bg-[#5c4d41] text-white hover:bg-[#4a3b32]'}`}
            >
                <Save size={16} /> Valider
            </button>
        </>
    );

    return (
        <ThematicModal
            isOpen={isOpen}
            onClose={onClose}
            title="Préciser la compétence"
            icon={<Layers size={24} />}
            size="md"
            footer={footer}
        >
            <div className="flex flex-col gap-4 py-2">
                <div className="bg-amber-50/50 border border-amber-200/50 p-3 rounded-sm text-sm text-[#5c4d41]">
                    Vous définissez une variante pour la compétence <strong>{skillName}</strong>.
                    <br />
                    <span className="text-xs italic mt-1 block">Une nouvelle ligne vide sera créée automatiquement en dessous pour d'autres variantes.</span>
                </div>

                <div className="flex flex-col gap-3">
                    {/* Option 1: Suggestions */}
                    {hasSuggestions && (
                        <div className={`border ${selectionMode === 'suggestion' ? 'border-amber-500 bg-amber-50/30' : 'border-stone-200'} rounded-md p-3 transition-colors`}>
                            <div
                                className="flex items-center gap-2 cursor-pointer mb-2"
                                onClick={() => setSelectionMode('suggestion')}
                            >
                                {selectionMode === 'suggestion' ? (
                                    <CheckCircle2 size={18} className="text-amber-600" />
                                ) : (
                                    <Circle size={18} className="text-stone-400" />
                                )}
                                <span className="font-bold text-[#5c4d41]">Choisir parmi les variantes officielles</span>
                            </div>

                            <div className={`ml-6 grid grid-cols-2 gap-2 ${selectionMode !== 'suggestion' ? 'opacity-50 pointer-events-none' : ''}`}>
                                {variants.map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => setSelectedSuggestion(v)}
                                        className={`text-left text-xs px-3 py-2 rounded border transition-all ${selectedSuggestion === v
                                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                            : 'bg-white border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-800'
                                            }`}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Option 2: Custom */}
                    <div className={`border ${selectionMode === 'custom' ? 'border-amber-500 bg-amber-50/30' : 'border-stone-200'} rounded-md p-3 transition-colors`}>
                        <div
                            className="flex items-center gap-2 cursor-pointer mb-2"
                            onClick={() => setSelectionMode('custom')}
                        >
                            {selectionMode === 'custom' ? (
                                <CheckCircle2 size={18} className="text-amber-600" />
                            ) : (
                                <Circle size={18} className="text-stone-400" />
                            )}
                            <span className="font-bold text-[#5c4d41]">Créer une variante personnalisée</span>
                        </div>

                        <div className={`ml-6 ${selectionMode !== 'custom' ? 'opacity-50 pointer-events-none' : ''}`}>
                            <label className="block text-[10px] font-bold text-[#bfae85] uppercase mb-1 tracking-widest">
                                Nom de la variante (ex: Poterie, Cuisine...)
                            </label>
                            <input
                                className="w-full border border-[#bfae85]/50 rounded-sm px-3 py-2 font-serif font-black text-[#1c1917] bg-white/50 focus:border-amber-500 outline-none shadow-sm text-lg"
                                value={customValue}
                                onChange={(e) => setCustomValue(e.target.value)}
                                placeholder="Saisissez votre variante..."
                                onFocus={() => setSelectionMode('custom')}
                                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                            />
                            <p className="text-[10px] text-stone-400 mt-1 italic">
                                Cette variante sera soumise au MJ comme suggestion.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ThematicModal>
    );
};

export default VariantSelectionModal;
