
import React from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

interface ImportResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: {
        success: string[];
        warnings: string[];
    } | null;
}

const ImportResultModal: React.FC<ImportResultModalProps> = ({ isOpen, onClose, report }) => {
    if (!isOpen || !report) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        Résultat de l'Importation
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

                    {/* Success Section */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-emerald-700 uppercase tracking-wider border-b border-emerald-100 pb-1">
                            Données Mises à Jour
                        </h4>
                        {report.success.length > 0 ? (
                            <ul className="space-y-2">
                                {report.success.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                        <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-400 italic">Aucune donnée modifiée.</p>
                        )}
                    </div>

                    {/* Warnings Section */}
                    {report.warnings.length > 0 && (
                        <div className="space-y-3 bg-amber-50 p-4 rounded border border-amber-200">
                            <h4 className="text-sm font-bold text-amber-700 uppercase tracking-wider border-b border-amber-200 pb-1 flex items-center gap-2">
                                <AlertTriangle size={16} /> Ignoré / Manquant
                            </h4>
                            <ul className="space-y-2">
                                {report.warnings.map((item, idx) => (
                                    <li key={idx} className="text-xs text-amber-900 list-disc list-inside">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                            <p className="text-[10px] text-amber-600 italic mt-2">
                                Certaines sections peuvent être ignorées si elles sont absentes du fichier source ou incompatibles avec cette version.
                            </p>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        Terminer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportResultModal;
