import React, { useMemo, useState } from 'react';
import { AlertTriangle, Coins, Sparkles } from 'lucide-react';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { CharacterSheetData } from '../../types';
import { RecreationService } from '../services/RecreationService';


interface RecreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (refundAmount: number, fullReset: boolean) => void;
    character: CharacterSheetData;
}

const RecreationModal: React.FC<RecreationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    character
}) => {
    const [isFullReset, setIsFullReset] = useState(true);

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

            {/* Sélecteur de mode */}
            <div className="flex gap-2 p-1 bg-stone-900/50 rounded-sm border border-stone-800">
                <button
                    onClick={() => setIsFullReset(true)}
                    className={`flex-1 py-2 px-3 text-xs font-bold uppercase tracking-widest rounded-sm transition-all ${isFullReset
                        ? 'bg-rose-950/40 text-rose-500 border border-rose-900/30 shadow-inner'
                        : 'text-stone-500 hover:bg-stone-800/50'
                        }`}
                >
                    Table Rase
                </button>
                <button
                    onClick={() => setIsFullReset(false)}
                    className={`flex-1 py-2 px-3 text-xs font-bold uppercase tracking-widest rounded-sm transition-all ${!isFullReset
                        ? 'bg-emerald-950/40 text-emerald-500 border border-emerald-900/30 shadow-inner'
                        : 'text-stone-500 hover:bg-stone-800/50'
                        }`}
                >
                    Ouverture Simple
                </button>
            </div>

            <div className={`bg-stone-900/50 border border-stone-800 p-4 rounded-sm space-y-3 shadow-inner transition-opacity ${!isFullReset ? 'opacity-50 grayscale' : ''}`}>
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500 border-b border-stone-800/50 pb-2 mb-2 flex items-center gap-2">
                    <Coins size={12} className="text-amber-600" /> Bilan de l'opération
                </h5>
                <div className="flex justify-between items-center px-1">
                    <span className="text-[11px] text-stone-400 font-bold uppercase tracking-tight">XP de progression rendue</span>
                    <span className="text-amber-500 font-mono font-black text-xl tabular-nums">+{isFullReset ? refundInfo : 0} XP</span>
                </div>
                <div className="flex justify-between items-center px-1">
                    <span className="text-[11px] text-stone-400 font-bold uppercase tracking-tight">Investissements de création</span>
                    <span className="text-rose-600 font-black text-[10px] uppercase tracking-widest bg-rose-950/30 px-2 py-0.5 rounded-sm border border-rose-900/20">
                        {isFullReset ? 'Table Rase' : 'Conservés'}
                    </span>
                </div>
            </div>

            <div className={`bg-${isFullReset ? 'rose' : 'emerald'}-950/20 border border-${isFullReset ? 'rose' : 'emerald'}-900/30 p-4 rounded-sm relative overflow-hidden group transition-colors duration-500`}>
                <div className="absolute top-0 right-0 p-2 opacity-5 translate-x-2 -translate-y-2 group-hover:opacity-10 transition-opacity">
                    <AlertTriangle size={64} className={`text-${isFullReset ? 'rose' : 'emerald'}-600`} />
                </div>
                <div className="flex gap-3 relative z-10">
                    <AlertTriangle className={`text-${isFullReset ? 'rose' : 'emerald'}-600 shrink-0`} size={20} />
                    <div className="space-y-2">
                        <p className={`text-${isFullReset ? 'rose' : 'emerald'}-200 text-[11px] font-black uppercase tracking-widest`}>
                            {isFullReset ? 'Avertissement : Purge' : 'Information : Ouverture'}
                        </p>
                        <ul className="text-[10px] text-stone-400 space-y-2 list-none leading-tight">
                            {isFullReset ? (
                                <>
                                    <li className="flex gap-2">
                                        <span className="text-emerald-700 font-bold">✓</span>
                                        <div><span className="text-stone-200">Conservation</span> : Identité, Image, Équipement et Notes sont préservés.</div>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-rose-700">•</span>
                                        <div><span className="text-stone-200">Reset Statistique</span> : Attributs et compétences reviennent à leur minimum.</div>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-rose-700">•</span>
                                        <div><span className="text-stone-200">Perte de Spécialisations</span> : Ces raffinements doivent être redistribués.</div>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-rose-700">•</span>
                                        <div><span className="text-stone-200">Réactivation</span> : La création sera à nouveau ouverte pour ce joueur.</div>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li className="flex gap-2">
                                        <span className="text-emerald-700 font-bold">✓</span>
                                        <div><span className="text-stone-200">Conservation Totale</span> : Toutes les statistiques, attributs, et compétences sont inchangés.</div>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-emerald-700 font-bold">✓</span>
                                        <div><span className="text-stone-200">Progression maintenue</span> : L'expérience déjà investie n'est pas remboursée.</div>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="text-emerald-700 font-bold">✓</span>
                                        <div><span className="text-stone-200">Réactivation</span> : La création sera simplement à nouveau ouverte pour le joueur, lui permettant d'éditer manuellement sa version de départ.</div>
                                    </li>
                                </>
                            )}
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
            onConfirm={() => onConfirm(refundInfo, isFullReset)}
            title="Recréation Éthérée"
            message={modalContent}
            confirmLabel={isFullReset ? "Lancer la Genèse (Table Rase)" : "Ouvrir au Joueur"}
            type={isFullReset ? "warning" : "info"}
            scheme="mystic"
        />
    );
};

export default RecreationModal;
