import React from 'react';
import { Loader2, Save } from 'lucide-react';

interface WizardFooterProps {
    isSaving: boolean;
    isLoading: boolean;
    selectedCount: number;
    onClose: () => void;
    onImport: () => void;
    showCancelOnly?: boolean;
}

export const WizardFooter: React.FC<WizardFooterProps> = ({
    isSaving,
    isLoading,
    selectedCount,
    onClose,
    onImport,
    showCancelOnly = false
}) => {
    return (
        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
            <button
                onClick={onClose}
                className="px-4 py-2 text-slate-500 font-bold hover:text-slate-700 transition-colors"
            >
                {showCancelOnly ? 'Annuler' : '← Retour'}
            </button>
            <button
                onClick={onImport}
                disabled={isLoading || isSaving || selectedCount === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
            >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Importer la sélection ({selectedCount})
            </button>
        </div>
    );
};
