import React from 'react';
import { AlertTriangle, RotateCcw, Check, Download, ArrowRightLeft } from 'lucide-react';
import ThematicModal from './ThematicModal';

interface CampaignConflictModalProps {
    isOpen: boolean;
    onClose: () => void;
    characterName: string;
    currentCampaignName: string;
    newCampaignName: string;
    onConfirmReset: () => void; // Start fresh for new campaign
    onStay: () => void;         // Cancel change and stay on current
    onBackup: () => void;       // Trigger JSON export
}

const CampaignConflictModal: React.FC<CampaignConflictModalProps> = ({
    isOpen,

    characterName,
    currentCampaignName,
    newCampaignName,
    onConfirmReset,
    onStay,
    onBackup
}) => {
    return (
        <ThematicModal
            isOpen={isOpen}
            onClose={onStay}
            title="Conflit de Campagne"
            icon={<AlertTriangle size={28} className="text-amber-500" />}
            size="md"
            footer={
                <div className="flex justify-between items-center w-full">
                    <button
                        onClick={onBackup}
                        className="flex items-center gap-2 px-4 py-2 text-blue-700 hover:bg-blue-50 rounded-lg transition-colors font-bold border border-blue-200"
                    >
                        <Download size={18} />
                        Sauvegarder {characterName || 'Personnage'}
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onStay}
                            className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors font-bold"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            }
        >
            <div className="space-y-6 py-2">
                {/* Comparison Header */}
                <div className="flex items-center justify-center gap-6 p-4 bg-stone-50 rounded-xl border border-stone-200 shadow-inner">
                    <div className="text-center flex-1">
                        <div className="text-[10px] uppercase font-bold text-stone-400 mb-1">Actuel</div>
                        <div className="font-serif font-bold text-[#8b2e2e] truncate">{currentCampaignName || 'Campagne Actuelle'}</div>
                    </div>
                    <div className="bg-white p-2 rounded-full shadow-sm border border-stone-100">
                        <ArrowRightLeft className="text-stone-300" size={20} />
                    </div>
                    <div className="text-center flex-1">
                        <div className="text-[10px] uppercase font-bold text-blue-500 mb-1">Cible</div>
                        <div className="font-serif font-bold text-blue-900 truncate">{newCampaignName || 'Nouvelle Campagne'}</div>
                    </div>
                </div>

                <div className="text-center space-y-3">
                    <h3 className="text-xl font-bold text-stone-800 font-serif">
                        Que faire de <span className="text-[#8b2e2e] underline decoration-stone-300 underline-offset-4">{characterName || 'votre personnage'}</span> ?
                    </h3>
                    <p className="text-stone-600 text-sm leading-relaxed">
                        Vous tentez de charger la campagne <strong>{newCampaignName}</strong>, mais un personnage est déjà en mémoire.
                        Adapter les données d'une campagne à l'autre est risqué et peut causer des pertes.
                    </p>
                </div>

                {/* Main Action Choice */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={onStay}
                        className="group flex flex-col items-center p-5 rounded-xl border-2 border-stone-200 hover:border-stone-400 hover:bg-stone-50 transition-all text-center"
                    >
                        <div className="bg-stone-100 p-3 rounded-full text-stone-500 mb-3 group-hover:bg-stone-200 group-hover:text-stone-700 transition-colors">
                            <Check size={28} />
                        </div>
                        <span className="font-bold text-stone-800 mb-1">Rester ici</span>
                        <span className="text-[11px] text-stone-500">Annuler le changement et garder {characterName} sur {currentCampaignName}.</span>
                    </button>

                    <button
                        onClick={onConfirmReset}
                        className="group flex flex-col items-center p-5 rounded-xl border-2 border-red-100 hover:border-red-400 hover:bg-red-50 transition-all text-center"
                    >
                        <div className="bg-red-50 p-3 rounded-full text-red-600 mb-3 group-hover:bg-red-100 transition-colors">
                            <RotateCcw size={28} />
                        </div>
                        <span className="font-bold text-red-800 mb-1">Nouveau Départ</span>
                        <span className="text-[11px] text-red-500 font-medium">Effacer {characterName} et charger les règles de {newCampaignName}.</span>
                    </button>
                </div>

                <div className="bg-red-50 border-l-4 border-red-400 p-3 flex gap-3 rounded-r-md">
                    <AlertTriangle className="text-red-500 shrink-0" size={18} />
                    <p className="text-[11px] text-red-800 font-medium italic">
                        <strong>Attention :</strong> Commencer un nouveau personnage est irréversible si vous n'avez pas fait de sauvegarde JSON au préalable.
                    </p>
                </div>
            </div>
        </ThematicModal>
    );
};

export default CampaignConflictModal;
