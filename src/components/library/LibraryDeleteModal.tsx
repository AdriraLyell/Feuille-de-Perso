import React from 'react';
import { Trash2 } from 'lucide-react';

interface LibraryDeleteModalProps {
    skillName: string;
    onClose: () => void;
    onConfirm: () => void;
}

const LibraryDeleteModal: React.FC<LibraryDeleteModalProps> = ({ skillName, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 z-[130] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-in zoom-in duration-200 border-2 border-red-100">
                <div className="p-6 text-center">
                    <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Trash2 size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer la compétence ?</h3>
                    <div className="bg-gray-50 p-3 rounded border border-gray-200 mb-4">
                        <span className="block font-bold text-gray-800 text-lg">{skillName}</span>
                    </div>
                    <p className="text-[#5c4d41] text-sm leading-relaxed">
                        Cette action est irréversible. La compétence sera retirée de la réserve.
                    </p>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-white transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <Trash2 size={16} /> Supprimer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LibraryDeleteModal;
