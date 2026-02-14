import React from 'react';
import { FileCog, Eye, EyeOff, Users, LogOut } from 'lucide-react';
import { MotionFade } from '../../../components/ui/motion/MotionFade';

interface DashboardHeaderProps {
    showArchived: boolean;
    setShowArchived: (val: boolean) => void;
    onViewPlayers: () => void;
    onLogout: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    showArchived,
    setShowArchived,
    onViewPlayers,
    onLogout
}) => {
    return (
        <MotionFade className="flex justify-between items-center mb-10" delay={0.1}>
            <h1 className="text-4xl font-serif font-black text-amber-500 flex items-center gap-4 drop-shadow-lg">
                <div className="relative">
                    <FileCog size={40} className="text-amber-600 animate-spin-slow opacity-80" />
                    <FileCog size={40} className="text-amber-400 absolute top-0 left-0 blur-sm opacity-50 animate-pulse" />
                </div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-700 font-black">
                    Bureau du Maître
                </span>
            </h1>

            <div className="flex items-center gap-4">
                <button
                    onClick={() => setShowArchived(!showArchived)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${showArchived ? 'bg-amber-950/50 text-amber-500 border-amber-900/50' : 'text-stone-500 border-stone-800 hover:text-stone-300 hover:border-stone-600'}`}
                    title={showArchived ? "Masquer les archives" : "Afficher les archives"}
                >
                    {showArchived ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showArchived ? "Archives visibles" : "Voir archives"}
                </button>

                <button
                    onClick={onViewPlayers}
                    className="flex items-center gap-2 bg-crimson-blood/90 hover:bg-crimson-blood text-white px-5 py-2 rounded-sm font-serif font-bold transition-all shadow-lg hover:shadow-crimson-blood/50 border border-crimson-blood group"
                >
                    <Users size={18} className="group-hover:scale-110 transition-transform" />
                    Joueurs
                </button>

                <button
                    onClick={onLogout}
                    className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 px-4 py-2 rounded-sm font-bold transition-all shadow-md group border border-stone-800"
                    title="Se déconnecter"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Déconnexion
                </button>
            </div>
        </MotionFade>
    );
};
