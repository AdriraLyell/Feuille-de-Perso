import React from 'react';
import { X, User, Clock, Download, Scroll } from 'lucide-react';
import { SyncedCharacter } from '../../../services/CharacterSyncService';

interface ReadOnlyHeaderProps {
    character: SyncedCharacter;
    onClose: () => void;
    onImport: () => void;
}

export const ReadOnlyHeader: React.FC<ReadOnlyHeaderProps> = ({ character, onClose, onImport }) => {
    return (
        <div className="bg-stone-950/80 border-b border-stone-800 p-6 flex justify-between items-center z-10">
            {/* Header Decoration */}
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Scroll size={200} className="rotate-12 text-stone-500" />
            </div>

            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-900/20 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-500 shadow-glow-gold">
                    <User size={28} />
                </div>
                <div>
                    <h2 className="text-3xl font-serif font-black text-amber-500 flex items-center gap-2 tracking-wide uppercase">
                        {character.character_name}
                    </h2>
                    <div className="flex items-center gap-3 text-stone-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                        <span className="text-white bg-amber-900/40 px-2 py-0.5 rounded border border-amber-900/30">Maître : {character.player_name}</span>
                        <span className="text-stone-700 font-serif">•</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> Sync : {new Date(character.last_synced).toLocaleString('fr-FR')}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={onImport}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-sm text-xs font-black transition-all shadow-lg hover:shadow-amber-500/10 active:scale-95 uppercase tracking-widest"
                    title={character.setting_id ? "Importer dans la bibliothèque de la campagne" : "Importer dans la bibliothèque d'une campagne au choix"}
                >
                    <Download size={16} className="stroke-[3]" />
                    Importer
                </button>
                <button
                    onClick={onClose}
                    className="p-2 text-stone-500 hover:text-amber-500 hover:bg-stone-800 rounded-sm transition-all border border-stone-800 hover:border-amber-900/30"
                >
                    <X size={24} />
                </button>
            </div>
        </div>
    );
};
