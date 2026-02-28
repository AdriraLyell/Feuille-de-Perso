import React from 'react';
import { Activity } from 'lucide-react';
import { MotionCard } from '../../../components/ui/motion/MotionCard';
import { RulesCreationConfig } from '../../../types/rules';

interface RankExtensionConfigProps {
    extendedSkills: boolean;
    onUpdate: (value: boolean) => void;
}

export const RankExtensionConfig: React.FC<RankExtensionConfigProps> = ({ extendedSkills, onUpdate }) => {
    return (
        <MotionCard className="p-4 h-full border border-stone-800/50 group" hoverEffect="glow">
            <div className="flex items-start justify-between mb-2">
                <div className="p-2 bg-void-indigo/10 text-indigo-400 rounded-sm border border-indigo-900/20 group-hover:scale-110 transition-transform">
                    <Activity size={18} />
                </div>
                <button
                    onClick={() => onUpdate(!extendedSkills)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-all relative border ${extendedSkills ? 'bg-indigo-600 border-indigo-400 shadow-glow-indigo' : 'bg-stone-800 border-stone-700'}`}
                >
                    <div className={`bg-white w-3.5 h-3.5 rounded-full shadow-md transform transition-transform ${extendedSkills ? 'translate-x-5' : ''}`} />
                </button>
            </div>
            <div>
                <h4 className="text-[10px] font-black text-stone-300 uppercase tracking-widest mb-1">Rangs Étendus</h4>
                <p className="text-[9px] text-stone-600 font-bold italic leading-tight">Autorise le dépassement du rang 5.</p>
            </div>
        </MotionCard>
    );
};
