
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
            footer={
                <>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-[#5c4d41] hover:bg-stone-200/50 rounded-sm font-bold transition-colors uppercase text-xs tracking-wider"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!newName.trim()}
                        className="px-6 py-2 bg-[#8b2e2e] text-white rounded-sm font-bold shadow-md hover:bg-[#a33939] flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-wider"
                    >
                        <Copy size={16} />
                        Dupliquer
                    </button>
                </>
            }
        >
            <div className="flex flex-col gap-6">
                <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-sm text-sm text-[#5c4d41] italic leading-relaxed">
                    Vous êtes sur le point de créer une copie des règles et bibliothèques de <strong className="text-[#8b2e2e] not-italic">{oldName}</strong>.
                    <br />
                    <span className="text-xs opacity-80 not-italic block mt-1">⚠️ Les personnages et les données de jeu (sessions) ne seront pas copiés.</span>
                </div>

                <div>
                    <label className="block text-xs font-bold text-[#bfae85] uppercase mb-1 tracking-widest px-1">
                        Nom de la nouvelle campagne
                    </label>
                    <input
                        autoFocus
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        className="w-full border-b-2 border-[#bfae85]/50 bg-[#fdfbf7] p-2 outline-none focus:border-[#8b2e2e] transition-all font-serif text-xl text-[#2c241b] placeholder-amber-900/20"
                        placeholder="Ex: Campagne (Copie)..."
                    />
                </div>
            </div>
        </ThematicModal>
    );
};

export default DuplicateSettingModal;
