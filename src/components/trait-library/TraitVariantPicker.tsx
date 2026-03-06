import React, { useState, useMemo } from 'react';
import { X, Settings, Check } from 'lucide-react';
import { LibraryEntry, LibraryFormulaEntry } from '../../types';
import { normalizeString } from '../../utils/stringUtils';

interface TraitVariantPickerProps {
    variantPicker: LibraryEntry;
    onClose: () => void;
    onSelect: (entry: LibraryEntry, variant: string, cost?: string) => void;
    allFormulas?: LibraryFormulaEntry[];
    allSkills?: { id: string; name: string; category?: string }[];
    allAttributes?: { id: string; name: string }[];
}

const TraitVariantPicker: React.FC<TraitVariantPickerProps> = ({
    variantPicker, onClose, onSelect,
    allFormulas = [], allSkills = [], allAttributes = []
}) => {
    const [customVariant, setCustomVariant] = useState('');
    const [selectedCost, setSelectedCost] = useState<string>(variantPicker.pointsLabel || variantPicker.points_label || variantPicker.cost || '');
    
    const costInputRef = React.useRef<HTMLInputElement>(null);
    const variantInputRef = React.useRef<HTMLInputElement>(null);

    // Unified variable cost detection (hyphen, en-dash, em-dash, comma, semicolon, dots)
    const isVariableCost = useMemo(() => {
        if (variantPicker.isVariableCost || variantPicker.is_variable_cost) return true;
        const label = variantPicker.pointsLabel || variantPicker.points_label || variantPicker.cost;
        if (!label) return false;
        return /[-,–—,;]/.test(label) || label.includes('..');
    }, [variantPicker]);

    const isVariable = variantPicker.isVariable || variantPicker.is_variable;

    React.useEffect(() => {
        if (isVariableCost) {
            costInputRef.current?.focus();
        } else {
            variantInputRef.current?.focus();
        }
    }, [isVariableCost]);

    // Suggestions for costs if it's a range (1-3) or list (1, 3, 5)
    const costSuggestions = useMemo(() => {
        if (!isVariableCost) return [];
        const label = variantPicker.pointsLabel || variantPicker.points_label || variantPicker.cost;
        if (!label) return [];

        const numbers = label.match(/\d+/g);
        if (!numbers || numbers.length < 2) return [];

        // Handle Range: 1-3, 1..3, 1–3
        if (label.includes('-') || label.includes('..') || label.includes('–')) {
            const start = parseInt(numbers[0]);
            const end = parseInt(numbers[1]);
            // Limit range to 10 items to avoid UI clutter
            if (isNaN(start) || isNaN(end) || end < start || end - start > 10) return numbers;
            return Array.from({ length: end - start + 1 }, (_, i) => (start + i).toString());
        }

        // Handle List: 1, 3, 5
        return numbers;
    }, [isVariableCost, variantPicker.cost, variantPicker.pointsLabel, variantPicker.points_label]);

    // New: Dynamic suggestions based on Force Variant formulas
    const dynamicSuggestions = useMemo(() => {
        const forceEffect = variantPicker.effects?.find(eff => {
            if (!eff.formulaId) return false;
            const formula = allFormulas.find(f => f.id === eff.formulaId);
            return formula?.forceVariant;
        });

        if (!forceEffect) return [];

        const formula = allFormulas.find(f => f.id === forceEffect.formulaId);
        const targetRaw = formula?.target || "";
        const targetClean = normalizeString(targetRaw);

        if (targetClean === 'competence') return allSkills.map(s => s.name);
        if (targetClean === 'attribut') return allAttributes.map(a => a.name);

        // Filter by category if target matches a category name
        const byCategory = allSkills.filter(s => normalizeString(s.category || "") === targetClean);
        if (byCategory.length > 0) return byCategory.map(s => s.name);

        return [];
    }, [variantPicker, allFormulas, allSkills, allAttributes]);

    // Combiner les variantes statiques du trait et les suggestions dynamiques
    const allVariantSuggestions = useMemo(() => {
        const statics = variantPicker.variants || [];
        const combined = [...statics, ...dynamicSuggestions];
        // Dédupliquer par nom
        return Array.from(new Set(combined));
    }, [variantPicker.variants, dynamicSuggestions]);

    const handleConfirm = (variant: string) => {
        let finalCost = selectedCost;

        // If user didn't change the range string (e.g. "1-3"), try to pick the first number
        const originalLabel = variantPicker.pointsLabel || variantPicker.points_label || variantPicker.cost;
        if (isVariableCost && finalCost === originalLabel) {
            const match = finalCost.match(/\d+/);
            if (match) finalCost = match[0];
        }

        onSelect(variantPicker, variant.trim(), finalCost);
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-[120] flex items-center justify-center p-4 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-stone-200">
                <div className="p-4 border-b bg-stone-50 flex justify-between items-center">
                    <h4 className="font-bold text-stone-800 flex items-center gap-2">
                        <Settings size={18} className="text-blue-600" />
                        Configuration du Trait
                    </h4>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors"><X size={20} /></button>
                </div>

                <div className="p-5 space-y-6">
                    {/* Trait Summary */}
                    <div className="bg-stone-50 p-3 rounded border border-stone-200">
                        <div className="text-sm font-bold text-stone-900">{variantPicker.name}</div>
                        <div className="text-[10px] text-stone-500 uppercase font-bold mt-1 tracking-tight">
                            {variantPicker.type === 'avantage' ? 'Avantage' : 'Désavantage'} • {selectedCost} {selectedCost === "1" ? "pt" : "pts"}
                        </div>
                    </div>

                    {/* Cost Selector (if variable) */}
                    {isVariableCost && (
                        <div className="space-y-3 bg-blue-50/50 p-3 rounded border border-blue-100">
                            <label htmlFor="trait-cost-input" className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider">Valeur</label>

                            {/* Suggested costs as buttons */}
                            {costSuggestions.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-2">
                                    {costSuggestions.map((c: string) => (
                                        <button
                                            key={c}
                                            onClick={() => setSelectedCost(c)}
                                            className={`px-3 py-1 text-xs font-bold rounded border transition ${selectedCost === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <input
                                    id="trait-cost-input"
                                    ref={costInputRef}
                                    type="text"
                                    placeholder="Valeur choisie..."
                                    className="flex-grow border border-stone-200 rounded px-3 py-1.5 text-sm focus:border-blue-500 outline-none font-mono"
                                    value={selectedCost}
                                    onChange={(e) => setSelectedCost(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Variant Section */}
                    {(isVariable || allVariantSuggestions.length > 0) ? (
                        <div className="space-y-3">
                            <label htmlFor="trait-variant-input" className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider">Précision / Variant (Ex: Alcool, Chats...)</label>
                            <div className="flex gap-2">
                                <input
                                    id="trait-variant-input"
                                    ref={variantInputRef}
                                    type="text"
                                    className="flex-grow border border-stone-200 rounded px-3 py-1.5 text-sm focus:border-blue-500 outline-none"
                                    placeholder="Saisir un variant..."
                                    value={customVariant}
                                    onChange={(e) => setCustomVariant(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleConfirm(customVariant);
                                        if (e.key === 'Escape') onClose();
                                    }}
                                />
                                <button
                                    onClick={() => handleConfirm(customVariant)}
                                    className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-1"
                                >
                                    <Check size={16} /> OK
                                </button>
                            </div>

                            {/* Suggested Variants */}
                            {allVariantSuggestions.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto p-1 bg-stone-50/50 rounded border border-stone-100 no-scrollbar">
                                    {allVariantSuggestions.map(v => (
                                        <button
                                            key={v}
                                            onClick={() => {
                                                if (isVariableCost) {
                                                    setCustomVariant(v);
                                                } else {
                                                    handleConfirm(v);
                                                }
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${customVariant === v ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'}`}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* No variants defined, but variable cost: Show a centered confirmation button */
                        isVariableCost && (
                            <div className="flex flex-col items-center gap-4 py-2">
                                <p className="text-[10px] text-stone-400 italic">Ce trait ne nécessite pas de variant, seulement le choix du coût.</p>
                                <button
                                    onClick={() => handleConfirm('')}
                                    className="w-full bg-blue-600 text-white px-6 py-2.5 rounded font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-300"
                                >
                                    <Check size={18} /> Confirmer ce trait
                                </button>
                            </div>
                        )
                    )}
                </div>

                <div className="px-5 py-3 bg-stone-50 border-t flex justify-between items-center text-[10px] text-stone-500 italic">
                    <span>* Cliquer sur un bouton ou appuyer sur Entrée</span>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600 py-1">Annuler</button>
                </div>
            </div>
        </div>
    );
};

export default TraitVariantPicker;
