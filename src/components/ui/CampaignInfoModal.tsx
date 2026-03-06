import React from 'react';
import { X, Info, MessageSquare, BookOpen } from 'lucide-react';

interface CampaignInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    campaignName: string;
    description?: string;
    welcomeMessage?: string;
}

const CampaignInfoModal: React.FC<CampaignInfoModalProps> = ({
    isOpen,
    onClose,
    campaignName,
    description,
    welcomeMessage
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="bg-[#fdfcf7] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-amber-900/20 flex flex-col animate-in zoom-in-95 duration-300"
            >
                {/* Header */}
                <div className="p-6 bg-amber-900 text-amber-50 flex justify-between items-center bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')]">
                    <div className="flex items-center gap-3">
                        <BookOpen size={24} className="text-amber-300" />
                        <div>
                            <h2 className="text-xl font-serif font-bold tracking-wide">Infos de Campagne</h2>
                            <p className="text-xs text-amber-200/70 font-sans uppercase tracking-widest">{campaignName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Fermer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] font-serif text-[#4a3b32]">
                    {welcomeMessage && (
                        <div className="relative p-6 bg-blue-50/50 rounded-xl border border-blue-100 shadow-inner">
                            <MessageSquare className="absolute -top-3 -left-3 text-blue-500 bg-white rounded-full p-1 border border-blue-100 shadow-sm" size={32} />
                            <h3 className="text-sm font-bold text-blue-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                                Message du MJ
                            </h3>
                            <p className="whitespace-pre-wrap leading-relaxed italic text-blue-900/80">
                                "{welcomeMessage}"
                            </p>
                        </div>
                    )}

                    {description ? (
                        <div className="space-y-3">
                            <h3 className="text-sm font-bold text-amber-900/50 uppercase tracking-widest flex items-center gap-2">
                                <Info size={16} /> À propos de cette aventure
                            </h3>
                            <p className="whitespace-pre-wrap leading-relaxed text-lg">
                                {description}
                            </p>
                        </div>
                    ) : !welcomeMessage && (
                        <div className="text-center py-10 opacity-40 italic">
                            Aucune information détaillée n'a été fournie pour cette campagne.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-center">
                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 bg-amber-900 hover:bg-amber-800 text-amber-50 rounded-full font-bold shadow-lg transition active:scale-95"
                    >
                        Compris
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CampaignInfoModal;
