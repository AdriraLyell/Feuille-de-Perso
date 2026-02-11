import React from 'react';
import { X } from 'lucide-react';
import { LibraryEntry } from '../../types';

interface TraitVariantPickerProps {
    variantPicker: LibraryEntry;
    onClose: () => void;
    onSelect: (entry: LibraryEntry, variant: string) => void;
}

const TraitVariantPicker: React.FC<TraitVariantPickerProps> = ({ variantPicker, onClose, onSelect }) => {
    return (
        <div className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center p-4 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-amber-200 overflow-hidden">
                <div className="p-3 bg-stone-100 border-b border-stone-200 flex justify-between items-center">
                    <h4 className="font-bold text-[#4a3b32] text-sm">Choisir une variante : {variantPicker.name}</h4>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X size={18} /></button>
                </div>
                <div className="p-4 flex flex-col gap-4">
                    {variantPicker.variants && variantPicker.variants.length > 0 && (
                        <div>
                            <label className="block text-[10px] font-bold text-stone-500 uppercase mb-2">Suggestions</label>
                            <div className="flex flex-wrap gap-2">
                                {variantPicker.variants.map(v => (
                                    <button
                                        key={v}
                                        onClick={() => onSelect(variantPicker, v)}
                                        className="px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 hover:border-amber-400 hover:bg-amber-50 rounded text-stone-700 transition-all font-medium"
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    <div>
                        <label className="block text-[10px] font-bold text-stone-500 uppercase mb-2">Saisie Libre</label>
                        <div className="flex gap-2">
                            <input
                                autoFocus
                                id="variant-custom-input"
                                placeholder="Ex: Chats, Pollen..."
                                className="flex-grow border border-stone-200 rounded px-3 py-1.5 text-sm focus:border-amber-500 outline-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        const val = (e.target as HTMLInputElement).value;
                                        if (val.trim()) onSelect(variantPicker, val.trim());
                                    } else if (e.key === 'Escape') onClose();
                                }}
                            />
                            <button
                                onClick={() => {
                                    const input = document.getElementById('variant-custom-input') as HTMLInputElement;
                                    if (input.value.trim()) onSelect(variantPicker, input.value.trim());
                                }}
                                className="bg-[#5c4d41] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-[#4a3b32] transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TraitVariantPicker;
