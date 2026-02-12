import React from 'react';
import { PieChart } from 'lucide-react';

interface CreationPointsPreviewProps {
    pointsBuckets: {
        attributes: number;
        skills: number;
        backgrounds: number;
    };
}

const CreationPointsPreview: React.FC<CreationPointsPreviewProps> = ({ pointsBuckets }) => {
    const totalXP = (pointsBuckets.attributes || 0) + (pointsBuckets.skills || 0) + (pointsBuckets.backgrounds || 0);

    return (
        <div className="bg-stone-900/40 p-6 rounded-sm shadow-sm border border-stone-700/50">
            <h4 className="font-serif font-bold text-stone-300 border-b border-stone-700/50 pb-2 mb-4 flex items-center gap-2 uppercase tracking-widest text-sm">
                <PieChart size={18} className="text-amber-500" /> Répartition Totale
            </h4>
            <div className="space-y-4">
                <div className="flex justify-between items-center group">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider group-hover:text-stone-400 transition-colors">Attributs</span>
                    <span className="font-bold font-mono text-stone-300">{pointsBuckets.attributes || 0} XP</span>
                </div>
                <div className="flex justify-between items-center group">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider group-hover:text-stone-400 transition-colors">Compétences</span>
                    <span className="font-bold font-mono text-stone-300">{pointsBuckets.skills || 0} XP</span>
                </div>
                <div className="flex justify-between items-center group">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider group-hover:text-stone-400 transition-colors">Arrière-plans</span>
                    <span className="font-bold font-mono text-stone-300">{pointsBuckets.backgrounds || 0} XP</span>
                </div>
                <div className="pt-2 border-t border-stone-700/50 flex justify-between items-center">
                    <span className="font-bold text-stone-200 uppercase tracking-widest text-xs">Total</span>
                    <span className="font-bold text-amber-500 text-lg font-mono drop-shadow-sm">
                        {totalXP} XP
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CreationPointsPreview;
