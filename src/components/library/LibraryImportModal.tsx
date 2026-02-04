import React from 'react';
import { Download, AlertTriangle } from 'lucide-react';

interface LibraryImportModalProps {
    onClose: () => void;
    onConfirm: () => void;
}

const LibraryImportModal: React.FC<LibraryImportModalProps> = ({ onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in duration-200">
                <div className="p-6 text-center">
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                        <Download size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Importer depuis la fiche ?</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        Cette action va scanner votre fiche de personnage et ajouter toutes les compétences trouvées à la réserve.
                    </p>
                    <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded-lg border border-yellow-200 text-left flex gap-2">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        <span>Les doublons (compétences portant le même nom) seront ignorés pour éviter les répétitions.</span>
                    </div>
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
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-sm transition-colors"
                    >
                        Confirmer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LibraryImportModal;
