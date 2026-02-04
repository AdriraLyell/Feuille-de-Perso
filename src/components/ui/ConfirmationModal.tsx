import React from 'react';
import { AlertTriangle, CheckCircle2, HelpCircle, X } from 'lucide-react';

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
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'danger': return <AlertTriangle size={24} className="text-red-600" />;
            case 'warning': return <AlertTriangle size={24} className="text-amber-600" />;
            case 'success': return <CheckCircle2 size={24} className="text-green-600" />;
            default: return <HelpCircle size={24} className="text-blue-600" />;
        }
    };

    const getColors = () => {
        switch (type) {
            case 'danger': return 'bg-red-100 text-red-600 border-red-200';
            case 'warning': return 'bg-amber-100 text-amber-600 border-amber-200';
            case 'success': return 'bg-green-100 text-green-600 border-green-200';
            default: return 'bg-blue-100 text-blue-600 border-blue-200';
        }
    };

    const getBtnColor = () => {
        switch (type) {
            case 'danger': return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
            case 'warning': return 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500';
            case 'success': return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
            default: return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in duration-200 border-2 border-slate-100">
                <div className="p-6 text-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm ${getColors()}`}>
                        {getIcon()}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 font-serif">{title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {message}
                    </p>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-200">
                    {cancelLabel && (
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-white transition-colors text-sm"
                        >
                            {cancelLabel}
                        </button>
                    )}
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`flex-1 px-4 py-2 text-white rounded-lg font-bold shadow-sm transition-colors text-sm ${getBtnColor()}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
