import React from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import ThematicModal from './ThematicModal';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirmer",
    cancelLabel = "Annuler",
    type = 'info'
}) => {
    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertTriangle size={24} className="text-[#8b2e2e]" />; // Red
            case 'warning': return <AlertTriangle size={24} className="text-[#d97706]" />; // Amber
            case 'success': return <CheckCircle2 size={24} className="text-[#65a30d]" />; // Green
            default: return <HelpCircle size={24} className="text-[#bfae85]" />; // Parchment Dark
        }
    };

    const getBtnColor = () => {
        switch (type) {
            case 'danger': return 'bg-[#8b2e2e] hover:bg-[#a33939]';
            case 'warning': return 'bg-[#d97706] hover:bg-[#f59e0b]';
            case 'success': return 'bg-[#65a30d] hover:bg-[#84cc16]';
            default: return 'bg-[#5c4d41] hover:bg-[#786c5f]';
        }
    };

    // Auto-close on confirm
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <ThematicModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            icon={getIcon()}
            size="sm"
            footer={
                <>
                    {cancelLabel && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold transition-colors uppercase text-xs tracking-wider"
                        >
                            {cancelLabel}
                        </button>
                    )}
                    <button
                        onClick={handleConfirm}
                        className={`px-6 py-2 text-white rounded-sm font-bold shadow-md flex items-center gap-2 transition-all uppercase leading-none tracking-wider text-xs ${getBtnColor()}`}
                    >
                        {confirmLabel}
                    </button>
                </>
            }
        >
            <div className="text-center">
                <p className="text-[#5c4d41] text-sm leading-relaxed italic">
                    {message}
                </p>
            </div>
        </ThematicModal>
    );
};

export default ConfirmationModal;
