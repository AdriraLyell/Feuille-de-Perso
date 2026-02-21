import React from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import ThematicModal from './ThematicModal';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string | React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    type?: 'danger' | 'warning' | 'info' | 'success';
    scheme?: 'paper' | 'mystic';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = "Confirmer",
    cancelLabel = "Annuler",
    type = 'info',
    scheme = 'paper'
}) => {
    const isMystic = scheme === 'mystic';

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertTriangle size={24} className={isMystic ? "text-crimson-blood" : "text-[#8b2e2e]"} />;
            case 'warning': return <AlertTriangle size={24} className={isMystic ? "text-amber-500" : "text-[#d97706]"} />;
            case 'success': return <CheckCircle2 size={24} className={isMystic ? "text-emerald-500" : "text-[#65a30d]"} />;
            default: return <HelpCircle size={24} className={isMystic ? "text-stone-400" : "text-[#bfae85]"} />;
        }
    };

    const getBtnColor = () => {
        switch (type) {
            case 'danger': return 'bg-crimson-blood hover:bg-rose-700 text-white';
            case 'warning': return 'bg-amber-600 hover:bg-amber-500 text-stone-900';
            case 'success': return 'bg-emerald-600 hover:bg-emerald-500 text-stone-900';
            default: return isMystic ? 'bg-stone-700 hover:bg-stone-600 text-stone-200' : 'bg-stone-700 hover:bg-stone-600 text-white';
        }
    };

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const cancelBtnClass = isMystic
        ? "px-4 py-2 text-stone-500 hover:text-stone-300 hover:bg-stone-800 rounded-sm font-bold transition-colors uppercase text-xs tracking-wider"
        : "px-4 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold transition-colors uppercase text-xs tracking-wider";

    const messageClass = isMystic
        ? "text-stone-300 text-sm leading-relaxed italic"
        : "text-[#5c4d41] text-sm leading-relaxed italic";

    return (
        <ThematicModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            icon={getIcon()}
            size="sm"
            scheme={scheme}
            footer={
                <>
                    {cancelLabel && (
                        <button
                            onClick={onClose}
                            className={cancelBtnClass}
                            aria-label={cancelLabel}
                        >
                            {cancelLabel}
                        </button>
                    )}
                    <button
                        onClick={handleConfirm}
                        className={`px-6 py-2 rounded-sm font-bold shadow-md flex items-center gap-2 transition-all uppercase leading-none tracking-wider text-xs ${getBtnColor()}`}
                        aria-label={confirmLabel}
                    >
                        {confirmLabel}
                    </button>
                </>
            }
        >
            <div className="text-center">
                {typeof message === 'string' ? (
                    <p className={messageClass}>{message}</p>
                ) : (
                    <div className={messageClass}>{message}</div>
                )}
            </div>
        </ThematicModal>
    );
};

export default ConfirmationModal;
