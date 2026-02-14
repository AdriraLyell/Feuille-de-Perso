import React from 'react';
import { Plus, Loader2, Scroll } from 'lucide-react';
import { MotionFade } from '../../../components/ui/motion/MotionFade';

interface DashboardCreateBannerProps {
    newName: string;
    setNewName: (val: string) => void;
    handleCreate: () => void;
    isCreating: boolean;
}

export const DashboardCreateBanner: React.FC<DashboardCreateBannerProps> = ({
    newName,
    setNewName,
    handleCreate,
    isCreating
}) => {
    return (
        <MotionFade delay={0.3}>
            <div className="flex gap-4 mb-10 items-end bg-stone-900/60 p-6 rounded-sm shadow-glass border border-stone-800 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Scroll size={120} className="text-stone-500 rotate-12" />
                </div>

                <div className="flex-grow z-10">
                    <label className="block text-xs font-bold text-amber-700 uppercase mb-2 tracking-widest">Nouvelle Chronique</label>
                    <input
                        type="text"
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="Ex: Les Ombres de l'Aube..."
                        className="w-full border-b border-stone-700 py-3 bg-transparent outline-none focus:border-amber-500 text-stone-200 font-serif text-xl placeholder-stone-700 transition-colors"
                    />
                </div>
                <button
                    onClick={handleCreate}
                    disabled={isCreating || !newName.trim()}
                    className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-stone-950 px-8 py-3 rounded-sm font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-amber-500/20 active:scale-95 z-10"
                >
                    {isCreating ? <Loader2 className="animate-spin" /> : <Plus size={20} className="stroke-[3]" />}
                    <span className="uppercase tracking-wide">Créer</span>
                </button>
            </div>
        </MotionFade>
    );
};
