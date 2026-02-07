import React from 'react';
import ThematicModal from './ThematicModal';
import { Shield, AlertTriangle } from 'lucide-react';

interface ExpertModeWarningModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

/**
 * Two-step confirmation modal for enabling Expert Mode.
 * Step 1: Explains risks
 * Step 2: "Are you sure?" final confirmation
 */
const ExpertModeWarningModal: React.FC<ExpertModeWarningModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [step, setStep] = React.useState<1 | 2>(1);

    const handleFirstConfirm = () => {
        setStep(2);
    };

    const handleFinalConfirm = () => {
        setStep(1); // Reset for next time
        onConfirm();
    };

    const handleClose = () => {
        setStep(1); // Reset step when closing
        onClose();
    };

    if (!isOpen) return null;

    return (
        <ThematicModal
            isOpen={isOpen}
            onClose={handleClose}
            title={step === 1 ? "Activer le Mode Expert ?" : "Confirmation Finale"}
            icon={step === 1 ? <Shield size={24} /> : <AlertTriangle size={24} className="text-amber-600" />}
            size="md"
            footer={
                step === 1 ? (
                    <>
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleFirstConfirm}
                            className="px-6 py-2 bg-amber-600 text-white rounded-sm font-bold shadow-md hover:bg-amber-700 flex items-center gap-2"
                        >
                            <Shield size={16} /> Activer le Mode Expert
                        </button>
                    </>
                ) : (
                    <>
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold"
                        >
                            Non
                        </button>
                        <button
                            onClick={handleFinalConfirm}
                            className="px-6 py-2 bg-[#8b2e2e] text-white rounded-sm font-bold shadow-md hover:bg-[#6a2424]"
                        >
                            Oui, activer
                        </button>
                    </>
                )
            }
        >
            {step === 1 ? (
                <div className="flex flex-col items-center text-center space-y-4 py-4">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shadow-inner">
                        <Shield size={32} />
                    </div>
                    <div className="space-y-3">
                        <p className="text-sm text-[#5c4d41] leading-relaxed">
                            Le <strong>Mode Expert</strong> vous permet d'accéder aux réglages avancés de la structure de votre feuille.
                        </p>
                        <div className="bg-amber-50/70 border border-amber-200/70 p-4 rounded-sm text-left">
                            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <AlertTriangle size={14} /> Attention
                            </p>
                            <ul className="text-[11px] text-amber-800/80 space-y-1 list-disc list-inside">
                                <li>Modifier ces paramètres peut <strong>désynchroniser</strong> votre feuille avec les règles de la campagne.</li>
                                <li>Certains changements peuvent être <strong>irréversibles</strong> sans réinitialisation complète.</li>
                                <li>Utilisez uniquement si vous savez ce que vous faites.</li>
                            </ul>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center text-center space-y-4 py-4">
                    <div className="w-16 h-16 bg-red-100 text-[#8b2e2e] rounded-full flex items-center justify-center shadow-inner">
                        <AlertTriangle size={32} />
                    </div>
                    <div className="space-y-2">
                        <p className="text-lg font-bold text-[#5c4d41]">
                            Êtes-vous sûr ?
                        </p>
                        <p className="text-sm text-[#5c4d41]/70">
                            Les modifications des réglages avancés peuvent impacter votre personnage de manière permanente.
                        </p>
                    </div>
                </div>
            )}
        </ThematicModal>
    );
};

export default ExpertModeWarningModal;
