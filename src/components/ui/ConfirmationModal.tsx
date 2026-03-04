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
        const iconClass = `drop-shadow-sm ${type === 'danger' || type === 'warning' ? 'animate-pulse-subtle' : ''}`;
        switch (type) {
            case 'danger': return <AlertTriangle size={28} className={`${isMystic ? "text-crimson-blood" : "text-[#8b2e2e]"} ${iconClass}`} />;
            case 'warning': return <AlertTriangle size={28} className={`${isMystic ? "text-amber-500" : "text-[#d97706]"} ${iconClass}`} />;
            case 'success': return <CheckCircle2 size={28} className={`${isMystic ? "text-emerald-500" : "text-[#65a30d]"} ${iconClass}`} />;
            default: return <HelpCircle size={28} className={`${isMystic ? "text-stone-400" : "text-[#bfae85]"} ${iconClass}`} />;
        }
    };

    const getBtnColor = () => {
        switch (type) {
            case 'danger': return 'bg-[#8b2e2e] hover:bg-[#a83a3a] text-white shadow-md transition-all duration-300';
            case 'warning': return 'bg-amber-600 hover:bg-amber-500 text-stone-900 shadow-md transition-all duration-300';
            case 'success': return 'bg-emerald-600 hover:bg-emerald-500 text-stone-900 shadow-md transition-all duration-300';
            default: return isMystic
                ? 'bg-stone-700 hover:bg-stone-600 text-stone-200 shadow-md transition-all duration-300'
                : 'bg-stone-700 hover:bg-stone-600 text-white shadow-md transition-all duration-300';
        }
    };

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const cancelBtnClass = isMystic
        ? "px-5 py-2.5 text-stone-500 hover:text-stone-300 hover:bg-stone-800 rounded-sm font-bold transition-all uppercase text-xs tracking-widest"
        : "px-5 py-2.5 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold transition-all uppercase text-xs tracking-widest";

    const messageClass = isMystic
        ? "text-stone-300 text-lg leading-relaxed italic"
        : "text-[#5c4d41] text-lg leading-relaxed italic font-medium";

    return (
        <ThematicModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            icon={getIcon()}
            size="sm"
            scheme={scheme}
            footer={
                <div className="flex items-center gap-6">
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
                        className={`px-8 py-3 rounded-sm font-black shadow-lg flex items-center gap-3 transition-all duration-200 active:translate-y-0.5 uppercase leading-none tracking-widest text-xs ${getBtnColor()}`}
                        aria-label={confirmLabel}
                    >
                        {confirmLabel}
                    </button>
                </div>
            }
        >
            <div className="text-center py-4 px-2">
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
