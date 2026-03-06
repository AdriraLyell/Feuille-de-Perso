import React from 'react';
import { RulesData } from '../../../types/rules';
import { CharacterSheetData, LibraryFormulaEntry } from '../../../types';
import { evaluateFormula } from '../../../utils/formulaEvaluator';
import { Trash2, Calculator, Check, Sigma, AlertCircle, Sparkles } from 'lucide-react';
import { validateFormulaEntry } from '../../../utils/formulaValidation';

interface AdminFormulaEditorItemProps {
    counter: LibraryFormulaEntry;
    rules: RulesData;
    previewValue: number | null;
    currentPreviewData: CharacterSheetData;
    allVariables: string[];
    realCharData?: CharacterSheetData | null;
    onEdit: () => void;
    onRemove: (id: string) => void;
}

export const AdminFormulaEditorItem: React.FC<AdminFormulaEditorItemProps> = ({
    counter,
    rules,
    previewValue,
    currentPreviewData,
    realCharData,
    onEdit,
    onRemove
}) => {
    const preview = previewValue !== null ? previewValue : evaluateFormula(counter.formula || '', currentPreviewData, { entry: counter });

    const { status: validationStatus, message: tooltipMessage, isValid } = validateFormulaEntry(counter, rules);

    return (
        <div className="border border-stone-700/50 bg-stone-900/40 rounded-sm overflow-hidden transition-all hover:border-amber-500/30 group">
            {/* Header Content (Single View) */}
            <div className="p-3 flex justify-between items-center h-16">
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${counter.type === 'variable' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-500'}`}>
                        {counter.aggregateConfig ? <Sigma size={18} /> : <Calculator size={18} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-stone-200">{counter.name}</h3>
                            {counter.code && <span className="text-[9px] bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded font-mono uppercase border border-stone-700">{counter.code}</span>}
                        </div>
                        <p className="text-[10px] text-stone-500 font-mono mt-0.5 max-w-[300px] truncate">{counter.formula || (counter.aggregateConfig ? 'Agrégat automatique' : 'Valeur fixe')}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Character Preview Value */}
                    <div className="text-right flex flex-col items-end">
                        <span className="text-[9px] text-stone-500 uppercase tracking-widest font-bold flex items-center gap-1" title={tooltipMessage}>
                            Aperçu {realCharData ? 'Réel' : '(Fictif)'}
                            {validationStatus === 'valid' && <Check size={10} className="text-emerald-500" />}
                            {validationStatus === 'warning' && <AlertCircle size={10} className="text-amber-500" />}
                            {validationStatus === 'error' && <AlertCircle size={10} className="text-rose-500" />}
                        </span>
                        <span className={`font-black text-xl leading-none ${isValid ? 'text-amber-500' : 'text-stone-600'}`}>
                            {preview !== null && !isNaN(preview) ? preview : 'ERROR'}
                        </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onEdit}
                            className="p-2 text-stone-400 hover:text-amber-500 hover:bg-amber-500/10 rounded transition-colors"
                            title="Modifier la formule"
                        >
                            <Sparkles size={16} />
                        </button>
                        <button
                            onClick={() => onRemove(counter.id)}
                            className="p-2 text-stone-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Supprimer la formule"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
