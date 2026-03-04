import React from 'react';
import { Check, Info, X, ShieldAlert, AlertTriangle, ThumbsUp, CheckSquare } from 'lucide-react';

interface CreationValidationModalProps {
    isOpen: boolean;
    hasErrors: boolean;
    messages: string[];
    overspent: string[];
    onClose: () => void;
    onConfirm: () => void;
}

export const CreationValidationModal: React.FC<CreationValidationModalProps> = ({
    isOpen,
    hasErrors,
    messages,
    overspent,
    onClose,
    onConfirm
}) => {
    if (!isOpen) return null;

    const hasWarnings = !hasErrors && messages.length > 0;

    return (
        <div className="fixed inset-0 bg-stone-950/90 z-[110] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
            <div className={`bg-[#fdfbf7] rounded-sm shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border-4 ${hasErrors ? 'border-red-700' : hasWarnings ? 'border-amber-500' : 'border-green-700'} relative`}>

                {/* Paper Texture Overlay */}
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

                {/* Modal Header */}
                <div className={`p-6 border-b-2 flex justify-between items-center relative z-10 ${hasErrors ? 'bg-red-50 border-red-200 text-red-900' : hasWarnings ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-green-50 border-green-200 text-green-900'}`}>
                    <div>
                        <h3 className="font-black text-3xl font-serif tracking-tight flex items-center gap-3 uppercase">
                            {hasErrors ? (
                                <>
                                    <ShieldAlert size={32} />
                                    Rapport d'Erreur
                                </>
                            ) : hasWarnings ? (
                                <>
                                    <AlertTriangle size={32} />
                                    Avertissement
                                </>
                            ) : (
                                <>
                                    <Check size={32} />
                                    Validation Finale
                                </>
                            )}
                        </h3>
                        <p className="text-sm font-medium opacity-80 mt-1">
                            {hasErrors ? "La création ne respecte pas les contraintes définies." : hasWarnings ? "Il reste des ressources non dépensées sur cette fiche." : "Le personnage semble prêt à l'aventure."}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-800 p-2 rounded-full transition-colors hover:bg-stone-200/50">
                        <X size={32} />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-8 overflow-y-auto relative z-10 bg-stone-50/50">
                    {!hasErrors && messages.length === 0 ? (
                        <div className="flex flex-col items-center text-center py-8">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce border-4 border-green-200">
                                <ThumbsUp className="text-green-600" size={48} />
                            </div>
                            <p className="text-2xl font-serif font-bold text-stone-800 mb-2">Création Impeccable</p>
                            <p className="text-stone-600 text-lg">Toutes les ressources ont été allouées parfaitement.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">

                            {overspent.length > 0 && (
                                <div className="bg-white border-l-4 border-red-600 shadow-sm p-5">
                                    <h4 className="font-bold text-red-800 text-lg mb-4 uppercase flex items-center gap-2 border-b border-red-100 pb-2 font-serif">
                                        <AlertTriangle size={20} /> Anomalies Détectées
                                    </h4>
                                    <ul className="space-y-3">
                                        {overspent.map((msg, i) => (
                                            <li key={i} className="flex items-start gap-3 text-red-700 font-medium text-base">
                                                <X size={18} className="mt-1 shrink-0" />
                                                {msg}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {messages.length > 0 && (
                                <div className="bg-white border-l-4 border-blue-500 shadow-sm p-5">
                                    <h4 className="font-bold text-blue-900 text-lg mb-4 uppercase flex items-center gap-2 border-b border-blue-100 pb-2 font-serif">
                                        <Info size={20} /> Opportunités Restantes
                                    </h4>
                                    <ul className="space-y-3">
                                        {messages.map((msg, i) => (
                                            <li key={i} className="flex items-start gap-3 text-blue-800 font-medium text-base">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                                                {msg}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="text-center pt-4">
                                <p className="text-sm text-stone-500 italic font-serif">
                                    En validant, les valeurs actuelles deviendront les valeurs de base (coût 0 XP).
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="p-6 bg-stone-100 flex justify-between gap-4 border-t border-stone-300 relative z-10">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 text-stone-600 hover:bg-white hover:text-stone-900 rounded border border-stone-300 font-bold transition-colors text-base"
                    >
                        {hasErrors ? 'Retourner corriger' : 'Annuler'}
                    </button>

                    <div className="flex gap-4">
                        {hasErrors && (
                            <button
                                onClick={onConfirm}
                                className="px-6 py-3 text-red-700 hover:bg-red-50 hover:underline text-base font-bold transition-colors"
                            >
                                Ignorer et Valider
                            </button>
                        )}
                        {hasWarnings && (
                            <button
                                onClick={onConfirm}
                                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded shadow-lg transition-transform hover:scale-105 font-bold text-lg flex items-center gap-2 font-serif tracking-wide"
                            >
                                <CheckSquare size={20} />
                                Valider tout de même
                            </button>
                        )}
                        {(!hasErrors && !hasWarnings) && (
                            <button
                                onClick={onConfirm}
                                className="bg-green-700 hover:bg-green-800 text-white px-8 py-3 rounded shadow-lg transition-transform hover:scale-105 font-bold text-lg flex items-center gap-2 font-serif tracking-wide"
                            >
                                <CheckSquare size={20} />
                                Confirmer
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
