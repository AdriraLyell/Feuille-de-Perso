
import React from 'react';
import { UserPlus, AlertTriangle, Sliders, Check } from 'lucide-react';
import { CharacterSheetData } from '../../types';

interface CreationModeModalProps {
    data: CharacterSheetData;
    onClose: () => void;
    onConfirm: () => void;
}

const CreationModeModal: React.FC<CreationModeModalProps> = ({ data, onClose, onConfirm }) => {
    return (
        <div className="fixed inset-0 bg-stone-950/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm no-print animate-in fade-in duration-200">
            <div className="bg-[#fdfbf7] rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden border border-stone-400 relative">
                {/* Paper Texture hint */}
                <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"></div>

                {/* Header */}
                <div className="bg-stone-900 p-6 flex items-center gap-4 border-b-4 border-amber-600 relative z-10">
                    <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center text-amber-500 border-2 border-amber-600 shadow-lg shrink-0">
                        <UserPlus size={32} />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-amber-50 font-serif tracking-wide uppercase">Nouvelle Session</h3>
                        <p className="text-stone-400 text-sm font-medium">Initialisation du protocole de création</p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-8 relative z-10">
                    {/* Warning Block */}
                    <div className="bg-red-50 border-l-8 border-red-600 p-6 mb-8 shadow-sm">
                        <h4 className="text-red-900 font-bold text-lg mb-2 flex items-center gap-2 uppercase tracking-wide font-serif">
                            <AlertTriangle size={24} /> Avertissement
                        </h4>
                        <p className="text-red-800 text-base leading-relaxed">
                            L'activation du mode création va <strong>effacer irréversiblement</strong> les données actuelles du personnage (Identité, XP, Valeurs) pour repartir d'une feuille vierge.
                        </p>
                        <p className="text-red-700 text-sm mt-2 italic">
                            La structure (noms des compétences) et la bibliothèque seront conservées.
                        </p>
                    </div>

                    {/* Settings Recap */}
                    <div className="bg-white border border-stone-200 p-6 rounded-sm shadow-inner">
                        <h4 className="text-stone-500 font-bold text-xs uppercase tracking-widest mb-4 border-b border-stone-200 pb-2 flex items-center gap-2">
                            <Sliders size={14} /> Paramètres de la session
                        </h4>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 md:col-span-1">
                                <span className="block text-xs font-bold text-stone-400 uppercase">Mode de Création</span>
                                <span className="block text-2xl font-serif font-bold text-indigo-900">
                                    {data.creationConfig.mode === 'points' ? 'Par Points (XP)' : 'Par Rangs'}
                                </span>
                            </div>

                            {data.creationConfig.mode === 'points' ? (
                                <>
                                    <div>
                                        <span className="block text-xs font-bold text-stone-400 uppercase">Budget</span>
                                        {(!data.creationConfig.pointsDistributionMode || data.creationConfig.pointsDistributionMode === 'global') ? (
                                            <span className="block text-xl font-mono font-bold text-stone-700">{data.creationConfig.startingXP} XP (Global)</span>
                                        ) : (
                                            <div className="text-sm font-medium text-stone-700 space-y-1 mt-1">
                                                <div className="flex justify-between border-b border-dotted border-stone-300"><span>Attributs:</span> <b>{data.creationConfig.pointsBuckets?.attributes} XP</b></div>
                                                <div className="flex justify-between border-b border-dotted border-stone-300"><span>Compétences:</span> <b>{data.creationConfig.pointsBuckets?.skills} XP</b></div>
                                                <div className="flex justify-between"><span>Arr. Plans:</span> <b>{data.creationConfig.pointsBuckets?.backgrounds} XP</b></div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <span className="block text-xs font-bold text-stone-400 uppercase">Budgets</span>
                                        <div className="text-sm font-medium text-stone-700 mt-1">
                                            <span className="mr-3">Attributs: <b>{data.creationConfig.attributePoints}</b></span>
                                            <span>Arr. Plans: <b>{data.creationConfig.backgroundPoints}</b></span>
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="block text-xs font-bold text-stone-400 uppercase mb-1">Rangs</span>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(r => (
                                                <div key={r} className="bg-stone-100 border border-stone-300 px-3 py-1 rounded text-center">
                                                    <div className="text-[10px] text-stone-500 font-bold uppercase">R{r}</div>
                                                    {/* @ts-expect-error -- dynamic key access */}
                                                    <div className="font-mono font-bold text-lg text-stone-800">{data.creationConfig.rankSlots[r]}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-stone-100 p-6 flex justify-end gap-4 border-t border-stone-300 relative z-10">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white border border-stone-300 text-stone-600 font-bold rounded hover:bg-stone-50 transition-colors uppercase tracking-wide text-sm"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-8 py-3 bg-green-700 text-green-50 font-bold rounded shadow-lg hover:bg-green-800 hover:shadow-xl transition-all uppercase tracking-wide text-sm flex items-center gap-2"
                    >
                        <Check size={18} />
                        Confirmer et Réinitialiser
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreationModeModal;
