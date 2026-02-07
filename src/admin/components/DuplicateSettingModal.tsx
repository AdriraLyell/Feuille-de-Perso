
import React, { useState, useEffect } from 'react';
import { Copy, X } from 'lucide-react';

interface DuplicateSettingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newName: string) => void;
    oldName: string;
}

const DuplicateSettingModal: React.FC<DuplicateSettingModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    oldName
}) => {
    const [newName, setNewName] = useState(`${oldName} (Copie)`);

    useEffect(() => {
        if (isOpen) {
            setNewName(`${oldName} (Copie)`);
        }
    }, [isOpen, oldName]);

    if (!isOpen) return null;

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (newName.trim()) {
            onConfirm(newName.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in duration-200 border-2 border-slate-100">
                <div className="p-6">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm bg-blue-100 text-blue-600 border-blue-200">
                        <Copy size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 font-serif text-center">Dupliquer la campagne</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-6 text-center">
                        Créez une copie complète des règles et bibliothèques de <strong>{oldName}</strong>.
                        Les personnages ne seront pas copiés.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 px-1">Nom de la nouvelle campagne</label>
                            <input
                                autoFocus
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="w-full border-2 border-slate-100 rounded-lg p-3 outline-none focus:border-blue-500 transition-all font-serif text-lg"
                                placeholder="Nom de la campagne..."
                            />
                        </div>
                    </form>
                </div>

                <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-center border-t border-gray-200">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-white transition-colors text-sm"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={() => handleSubmit()}
                        disabled={!newName.trim()}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors text-sm disabled:opacity-50"
                    >
                        Dupliquer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DuplicateSettingModal;
