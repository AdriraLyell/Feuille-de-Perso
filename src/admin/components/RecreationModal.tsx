import React, { useMemo } from 'react';
import { RotateCcw, AlertTriangle, Coins, Sparkles } from 'lucide-react';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { CharacterSheetData, RulesData } from '../../types';
import { RecreationService } from '../services/RecreationService';
import { MotionFade } from '../../components/ui/motion/MotionFade';

interface RecreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (refundAmount: number) => void;
    character: CharacterSheetData;
}

const RecreationModal: React.FC<RecreationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    character
}) => {
    // Calcul du remboursement pour affichage dans la modale
    const refundInfo = useMemo(() => {
        if (!character) return 0;
        return RecreationService.calculateRefundValue(character);
    }, [character]);

    if (!character) return null;

    const modalContent = (
        <div className="space-y-4 text-left">
            <div className="flex flex-col items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-amber-900/20 rounded-full flex items-center justify-center border border-amber-900/30 shadow-glow-amber/10">
                    <Sparkles className="text-amber-500" size={32} />
                </div>
                <div className="text-center">
                    <p className="text-stone-300 text-sm italic leading-relaxed">
                        Vous vous apprêtez à réinitialiser la destinée de <br />
                        <span className="text-amber-500 font-serif font-black text-xl uppercase tracking-tighter">{character.header.name}</span>
                    </p>
                </div>
            </div>

            <div className="bg-stone-900/50 border border-stone-800 p-4 rounded-sm space-y-3 shadow-inner">
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 border-b border-stone-800/50 pb-2 mb-2 flex items-center gap-2">
                    <Coins size={12} className="text-amber-600" /> Bilan de l'opération
                </h5>
                <div className="flex justify-between items-center px-1">
                    <span className="text-[11px] text-stone-400 font-bold uppercase tracking-tight">XP de progression rendue</span>
                    <span className="text-amber-500 font-mono font-black text-xl tabular-nums">+{refundInfo} XP</span>
                </div>
                <div className="flex justify-between items-center px-1">
                    <span className="text-[11px] text-stone-400 font-bold uppercase tracking-tight">Investissements de création</span>
                    <span className="text-rose-600 font-black text-[10px] uppercase tracking-widest bg-rose-950/30 px-2 py-0.5 rounded-sm border border-rose-900/20">Table Rase</span>
                </div>
            </div>

            <div className="bg-rose-950/20 border border-rose-900/30 p-4 rounded-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-5 translate-x-2 -translate-y-2 group-hover:opacity-10 transition-opacity">
                    <AlertTriangle size={64} />
                </div>
                <div className="flex gap-3 relative z-10">
                    <AlertTriangle className="text-rose-600 shrink-0" size={20} />
                    <div className="space-y-2">
                        <p className="text-rose-200 text-[11px] font-black uppercase tracking-widest">Avertissement</p>
                        <ul className="text-[10px] text-stone-400 space-y-2 list-none leading-tight">
                            <li className="flex gap-2">
                                <span className="text-rose-700">•</span>
                                <div><span className="text-stone-200">Reset Total</span> : Attributs et compétences reviennent à leur minimum.</div>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-rose-700">•</span>
                                <div><span className="text-stone-200">Perte de Spécialisations</span> : Tous les raffinements de compétences sont effacés.</div>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-rose-700">•</span>
                                <div><span className="text-stone-200">Réactivation</span> : La création sera à nouveau ouverte pour ce joueur.</div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="text-center pt-2">
                <p className="text-[9px] text-stone-500 uppercase tracking-[0.2em] font-black opacity-50">
                    Une nouvelle genèse commence.
                </p>
            </div>
        </div>
    );

    return (
        <ConfirmationModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={() => onConfirm(refundInfo)}
            title="Recréation Éthérée"
            message={modalContent}
            confirmLabel="Lancer la Genèse"
            type="warning"
            scheme="mystic"
        />
    );
};

export default RecreationModal;
