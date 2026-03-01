import React from 'react';
import { History, RefreshCw, RotateCcw } from 'lucide-react';
import { CharacterHistoryEntry } from '../../../services/CharacterSyncService';

interface SyncHistoryTabProps {
    history: CharacterHistoryEntry[];
    isLoading: boolean;
    isRestoring: boolean;
    onRestore: (entry: CharacterHistoryEntry) => void;
}

const SyncHistoryTab: React.FC<SyncHistoryTabProps> = ({
    history,
    isLoading,
    isRestoring,
    onRestore
}) => {
    return (
        <div className="mt-6 border-t border-[#bfae85]/50 pt-5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#4a3b32] mb-3">
                <History size={18} className="text-[#8b2e2e]" />
                Historique des sauvegardes (Cloud)
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-4 text-stone-400">
                    <RefreshCw size={20} className="animate-spin" />
                </div>
            ) : history.length === 0 ? (
                <div className="bg-stone-50 border border-dashed border-stone-200 rounded p-4 text-center text-xs text-stone-500 italic">
                    Aucun historique disponible pour ce personnage.
                </div>
            ) : (
                <div className="space-y-2">
                    {history.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-3 bg-white border border-stone-200 rounded-md hover:border-[#bfae85] transition-colors group">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-stone-700">
                                    {new Date(entry.archived_at).toLocaleString('fr-FR')}
                                </span>
                                <span className={`text-[10px] uppercase font-black ${entry.version_reason === 'manual' ? 'text-blue-600' : 'text-amber-600'}`}>
                                    {entry.version_reason === 'manual' ? 'Sauvegarde manuelle' : 'Auto-save (1h)'}
                                </span>
                            </div>
                            <button
                                onClick={() => onRestore(entry)}
                                disabled={isRestoring}
                                className="px-3 py-1.5 bg-stone-100 hover:bg-[#8b2e2e] hover:text-white text-[#8b2e2e] text-xs font-bold rounded flex items-center gap-1.5 transition-all disabled:opacity-50"
                            >
                                <RotateCcw size={12} />
                                Restaurer
                            </button>
                        </div>
                    ))}
                    <p className="text-[10px] text-stone-400 italic mt-2 text-center">
                        Seules les 2 dernières versions sont conservées.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SyncHistoryTab;
