import { useState, useRef, useEffect } from 'react';
import { Users, MessageSquare, Check, X } from 'lucide-react';
import { SyncedCharacter } from '../../services/CharacterSyncService';

interface RosterHeaderProps {
    settingName: string;
    characterCount: number;
    allCharacters: SyncedCharacter[];
    hiddenCharacterIds: string[];
    onToggleCharacter: (id: string) => void;
    isMessagingOpen?: boolean;
    onToggleMessaging?: () => void;
}

export const RosterHeader: React.FC<RosterHeaderProps> = ({
    settingName,
    characterCount,
    allCharacters,
    hiddenCharacterIds,
    onToggleCharacter,
    isMessagingOpen,
    onToggleMessaging
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-amber-900/30 pb-6">
            <div>
                <h1 className="text-4xl font-serif font-black text-amber-500 flex items-center gap-3 tracking-widest uppercase">
                    <Users className="text-amber-600" size={32} />
                    Registre : {settingName}
                </h1>
                <p className="text-amber-900/60 font-black text-[10px] uppercase tracking-[0.3em] mt-2 ml-12">
                    Matrice comparative des investigateurs
                </p>
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={onToggleMessaging}
                    className={`p-2.5 rounded-full transition-all duration-300 border shadow-glass-dark ${isMessagingOpen
                        ? 'bg-amber-600 text-white border-amber-400'
                        : 'bg-stone-900/50 text-stone-400 border-stone-800 hover:text-amber-500 hover:border-amber-900/50'
                        }`}
                    title="Messagerie du MJ"
                >
                    <MessageSquare size={20} />
                </button>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`text-stone-500 text-sm font-mono bg-stone-900/50 px-4 py-2 rounded-sm border shadow-glass-dark flex items-center gap-2 h-[42px] transition-all duration-300 ${isMenuOpen ? 'border-amber-600 ring-1 ring-amber-600/20' : 'border-stone-800 hover:border-amber-900'
                            }`}
                        title="Gérer les personnages affichés"
                    >
                        <span className="text-amber-600 font-bold">{characterCount}</span>
                        <span className="uppercase text-[10px] tracking-widest">Âmes</span>
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-stone-900 border border-amber-900/40 rounded-md shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                            <div className="p-3 border-b border-white/5 bg-stone-950/50">
                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-600/70">Sélection des investigateurs</span>
                            </div>
                            <div className="max-h-80 overflow-y-auto py-1 custom-scrollbar">
                                {allCharacters.length === 0 ? (
                                    <div className="p-4 text-center text-stone-600 italic text-xs">Aucun personnage</div>
                                ) : (
                                    allCharacters.map(char => {
                                        const isHidden = hiddenCharacterIds.includes(char.id);
                                        return (
                                            <button
                                                key={char.id}
                                                onClick={() => onToggleCharacter(char.id)}
                                                className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-amber-900/10 group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center overflow-hidden transition-all duration-300 bg-stone-950 ${isHidden ? 'border-stone-800 grayscale opacity-40' : 'border-amber-900/50 grayscale-0 opacity-100'
                                                        }`}>
                                                        {char.data.portrait ? (
                                                            <img src={char.data.portrait as string} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Users size={14} className={isHidden ? 'text-stone-700' : 'text-amber-700'} />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`text-sm font-medium transition-colors ${isHidden ? 'text-stone-600' : 'text-stone-300 group-hover:text-amber-500'
                                                            }`}>
                                                            {char.character_name}
                                                        </span>
                                                        <span className="text-[9px] text-stone-600 uppercase tracking-tighter">
                                                            {char.player_name || "Sans joueur"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={`transition-all duration-300 ${isHidden ? 'text-stone-700' : 'text-amber-500'
                                                    }`}>
                                                    {isHidden ? <X size={14} /> : <Check size={14} />}
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

