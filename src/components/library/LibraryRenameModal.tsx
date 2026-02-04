import React from 'react';
import { Edit2, ArrowRight, AlertCircle, AlertTriangle } from 'lucide-react';
import ThematicModal from '../ui/ThematicModal';

interface LibraryRenameModalProps {
    oldName: string;
    newName: string;
    onClose: () => void;
    onConfirm: () => void;
}

const LibraryRenameModal: React.FC<LibraryRenameModalProps> = ({ oldName, newName, onClose, onConfirm }) => {
    return (
        <ThematicModal
            isOpen={true}
            onClose={onClose}
            title="Renommer la compétence ?"
            icon={<AlertTriangle size={24} className="text-[#8b2e2e]" />}
            size="md"
            footer={
                <>
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-[#bfae85]/50 rounded-sm text-[#5c4d41] font-bold hover:bg-stone-200/50 transition-colors"
                    >
                        Non, annuler
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 px-4 py-2 bg-[#8b2e2e] text-white rounded-sm font-bold shadow-md hover:bg-[#6a2424] transition-colors"
                    >
                        Oui, renommer partout
                    </button>
                </>
            }
        >
            <div className="flex flex-col items-center text-center space-y-5 py-4">
                <div className="w-16 h-16 bg-[#8b2e2e]/10 text-[#8b2e2e] rounded-full flex items-center justify-center shadow-inner">
                    <Edit2 size={32} />
                </div>
                <div className="space-y-3">
                    <p className="text-sm text-[#5c4d41] leading-relaxed max-w-sm">
                        Cette modification sera répercutée sur **toutes les instances** de cette compétence présentes sur votre fiche.
                    </p>
                    <div className="flex items-center justify-center gap-3 text-sm font-serif bg-stone-100/50 px-4 py-2 rounded-sm border border-[#bfae85]/30">
                        <span className="line-through text-red-700/60 opacity-60 uppercase tracking-wider">{oldName}</span>
                        <ArrowRight size={14} className="text-[#bfae85]" />
                        <span className="font-black text-green-800 uppercase tracking-widest">{newName}</span>
                    </div>
                </div>

                <div className="bg-amber-50/50 border border-amber-200/50 p-4 rounded-sm flex gap-3 text-left">
                    <AlertCircle className="text-amber-700 shrink-0" size={18} />
                    <p className="text-[10px] text-amber-900 leading-tight">
                        <strong>Notes :</strong> Vos points acquis, l'expérience dépensée et les spécialisations déjà saisies seront intégralement conservés sous le nouveau nom.
                    </p>
                </div>
            </div>
        </ThematicModal>
    );
};

export default LibraryRenameModal;
