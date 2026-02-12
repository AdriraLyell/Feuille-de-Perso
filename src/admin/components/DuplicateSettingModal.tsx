
import React, { useState, useEffect } from 'react';
import { Copy } from 'lucide-react';
import ThematicModal from '../../components/ui/ThematicModal';

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

    const handleSubmit = () => {
        if (newName.trim()) {
            onConfirm(newName.trim());
            onClose();
        }
    };

    return (
        <ThematicModal
            isOpen={isOpen}
            onClose={onClose}
            title="Dupliquer la Campagne"
            icon={<Copy size={24} />}
            size="sm"
            scheme="mystic"
            footer={
                <>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-sm font-bold transition-colors uppercase text-xs tracking-wider"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!newName.trim()}
                        className="px-6 py-2 bg-amber-600 text-stone-900 rounded-sm font-bold shadow-md hover:bg-amber-500 hover:scale-105 active:scale-95 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-wider"
                    >
                        <Copy size={16} />
                        Dupliquer
                    </button>
                </>
            }
        >
            <div className="flex flex-col gap-6">
                <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-sm text-sm text-stone-300 italic leading-relaxed">
                    Vous êtes sur le point de créer une copie des règles et bibliothèques de <strong className="text-amber-500 not-italic">{oldName}</strong>.
                    <br />
                    <span className="text-xs text-stone-500 not-italic block mt-1 flex items-center gap-1">
                        ⚠️ Les personnages et les données de jeu (sessions) ne seront pas copiés.
                    </span>
                </div>

                <div>
                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1 tracking-widest px-1">
                        Nom de la nouvelle campagne
                    </label>
                    <input
                        autoFocus
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        className="w-full border-b-2 border-stone-700 bg-stone-900/50 p-2 outline-none focus:border-amber-500 transition-all font-serif text-xl text-stone-200 placeholder-stone-700"
                        placeholder="Ex: Campagne (Copie)..."
                    />
                </div>
            </div>
        </ThematicModal>
    );
};

export default DuplicateSettingModal;
