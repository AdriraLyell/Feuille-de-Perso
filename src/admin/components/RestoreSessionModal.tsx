import React from 'react';
import { History, XCircle, CheckCircle } from 'lucide-react';
import { RulesData } from '../../types/rules';

interface RestoreSessionModalProps {
    isOpen: boolean;
    restorableRules: RulesData | null;
    currentVersion: string; // The official API version (loaded normally)
    onConfirm: () => void;
    onDiscard: () => void;
}

const RestoreSessionModal: React.FC<RestoreSessionModalProps> = ({
    isOpen,
    restorableRules,
    currentVersion,
    onConfirm,
    onDiscard
}) => {
    if (!isOpen || !restorableRules) return null;

    // Helper to format date if available (assuming we might store it, or just use current if not)
    // For now we don't have exact save date in rules object reliably unless we look at lastSaved metadata 
    // but the hook uses "DB_KEY", we could decode it but let's keep it simple.

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">

                {/* Header */}
                <div className="bg-slate-900 text-white p-5 flex items-center gap-3">
                    <History size={24} className="text-amber-400" />
                    <div>
                        <h2 className="text-lg font-bold">Session non sauvegardée</h2>
                        <p className="text-slate-400 text-xs">Restauration automatique</p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-900 text-sm">
                        <p className="font-bold mb-1">Attention !</p>
                        <p>
                            Une session précédente a été interrompue sans être publiée.
                            Souhaitez-vous restaurer vos modifications locales ?
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-slate-50 p-3 rounded border border-slate-200">
                            <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Version Sauvegardée</span>
                            <span className="font-mono font-bold text-slate-900 text-lg">{restorableRules.version}</span>
                            <span className="block text-xs text-amber-600 font-medium mt-1">Locale (Browser)</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded border border-slate-200 opacity-60">
                            <span className="block text-xs font-bold text-slate-500 uppercase mb-1">Version Officielle</span>
                            <span className="font-mono font-bold text-slate-700 text-lg">{currentVersion}</span>
                            <span className="block text-xs text-slate-500 mt-1">GitHub (Défaut)</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        <CheckCircle size={18} /> Restaurer la session
                    </button>

                    <button
                        onClick={onDiscard}
                        className="w-full py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <XCircle size={16} /> Ignorer et repartir à zéro
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RestoreSessionModal;
