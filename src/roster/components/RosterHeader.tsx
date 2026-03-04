import { Users, MessageSquare } from 'lucide-react';

interface RosterHeaderProps {
    settingName: string;
    characterCount: number;
    isMessagingOpen?: boolean;
    onToggleMessaging?: () => void;
}

export const RosterHeader: React.FC<RosterHeaderProps> = ({
    settingName,
    characterCount,
    isMessagingOpen,
    onToggleMessaging
}) => (
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

            <div className="text-stone-500 text-sm font-mono bg-stone-900/50 px-4 py-2 rounded-sm border border-stone-800 shadow-glass-dark flex items-center gap-2 h-[42px]">
                <span className="text-amber-600 font-bold">{characterCount}</span> <span className="uppercase text-[10px] tracking-widest">Âmes</span>
            </div>
        </div>
    </header>
);
