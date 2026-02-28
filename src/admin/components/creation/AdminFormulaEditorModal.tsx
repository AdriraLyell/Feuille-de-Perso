import React, { useState, useEffect } from 'react';
import { RulesData } from '../../../types/rules';
import { LibraryFormulaEntry } from '../../../types';
import ThematicModal from '../../../components/ui/ThematicModal';
import { AdminFormulaFormFields } from './AdminFormulaFormFields';
import { evaluateFormula } from '../../../utils/formulaEvaluator';
import { validateFormulaEntry } from '../../../utils/formulaValidation';
import { Calculator, Save, Check, AlertCircle } from 'lucide-react';

interface AdminFormulaEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formula: LibraryFormulaEntry) => void;
    initialFormula: LibraryFormulaEntry | null;
    rules: RulesData;
    targetSuggestions: { value: string, label: string, type: string }[];
    allVariables: string[];
    currentPreviewData: any;
    realCharData?: any;
    isNew?: boolean;
}

export const AdminFormulaEditorModal: React.FC<AdminFormulaEditorModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialFormula,
    rules,
    targetSuggestions,
    allVariables,
    currentPreviewData,
    realCharData,
    isNew = false
}) => {
    const [draft, setDraft] = useState<LibraryFormulaEntry | null>(initialFormula);

    useEffect(() => {
        if (isOpen && initialFormula) {
            setDraft(initialFormula);
        }
    }, [isOpen, initialFormula]);

    if (!isOpen || !draft) return null;

    const handleUpdate = (field: keyof LibraryFormulaEntry, value: any) => {
        const updated = { ...draft, [field]: value };

        // Auto-generation du code à partir du nom
        if (field === 'name') {
            const generateCodeFromName = (name: string) => {
                return name
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "") // retire les accents
                    .toUpperCase()
                    .replace(/[\s\-']/g, '_') // remplace espaces, tirets, apostrophes par underscores
                    .replace(/[^A-Z0-9_]/g, ''); // garde uniquement alphanumérique et underscores
            };

            const oldExpectedCode = generateCodeFromName(draft.name || '');
            if (!draft.code || draft.code === oldExpectedCode || draft.code.startsWith('VAR_')) {
                updated.code = generateCodeFromName(value);
            }
        }

        setDraft(updated);
    };

    const preview = evaluateFormula(draft.formula || '', currentPreviewData, { entry: draft });
    const { status: validationStatus, message: tooltipMessage, isValid } = validateFormulaEntry(draft, rules);

    const footer = (
        <>
            <button
                onClick={onClose}
                className="px-4 py-2 text-stone-400 hover:text-stone-200 font-bold transition-colors"
            >
                Annuler
            </button>
            <button
                onClick={() => onSave(draft)}
                className={`flex items-center gap-2 px-6 py-2 rounded-sm font-bold transition-all ${isValid
                    ? 'bg-amber-600 text-stone-950 shadow-glow-gold hover:bg-amber-500'
                    : 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-700'
                    }`}
                disabled={!isValid}
            >
                <Save size={18} /> {isNew ? 'Créer la Formule' : 'Sauvegarder'}
            </button>
        </>
    );

    return (
        <ThematicModal
            isOpen={isOpen}
            onClose={onClose}
            title={isNew ? "Nouvelle Formule" : "Modifier la Formule"}
            icon={<Calculator className="text-amber-500" />}
            scheme="mystic"
            size="lg"
            footer={footer}
        >
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-8">
                    <AdminFormulaFormFields
                        formula={draft}
                        rules={rules}
                        targetSuggestions={targetSuggestions}
                        allVariables={allVariables}
                        onUpdate={handleUpdate}
                    />
                </div>

                <div className="col-span-12 lg:col-span-4">
                    <div className="bg-stone-900/60 border border-stone-800 rounded-sm p-4 h-full flex flex-col justify-between">
                        <div>
                            <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-4 flex items-center justify-between">
                                Aperçu du Résultat
                                <span className="text-[9px] opacity-60 normal-case font-normal italic">
                                    {realCharData ? 'Personnage Réel' : 'Données Fictives'}
                                </span>
                            </h3>

                            <div className="flex flex-col items-center justify-center p-8 bg-black/40 rounded border border-stone-800/50 mb-4">
                                <span className={`text-4xl font-black mb-1 ${isValid ? 'text-amber-500' : 'text-stone-700'}`}>
                                    {preview !== null && !isNaN(preview) ? preview : '???'}
                                </span>
                                <span className="text-[10px] text-stone-500 font-mono uppercase tracking-tighter">
                                    Valeur calculée
                                </span>
                            </div>

                            <div className={`p-3 rounded text-xs flex gap-3 ${validationStatus === 'valid' ? 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20' :
                                validationStatus === 'warning' ? 'bg-amber-950/20 text-amber-500 border border-amber-500/20' :
                                    'bg-rose-950/20 text-rose-400 border border-rose-500/20'
                                }`}>
                                {validationStatus === 'valid' && <Check size={16} className="shrink-0" />}
                                {(validationStatus === 'warning' || validationStatus === 'error') && <AlertCircle size={16} className="shrink-0" />}
                                <p>{tooltipMessage}</p>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-stone-800/50">
                            <p className="text-[10px] text-stone-500 italic leading-relaxed">
                                Les formules utilisent le moteur de calcul du système. Assurez-vous que les variables et codes utilisés existent dans vos règles.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ThematicModal>
    );
};
