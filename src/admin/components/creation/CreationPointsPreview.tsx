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
        <div className="bg-white p-6 rounded shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                <PieChart size={18} className="text-blue-500" /> Répartition Totale
            </h4>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Attributs</span>
                    <span className="font-bold">{pointsBuckets.attributes || 0} XP</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Compétences</span>
                    <span className="font-bold">{pointsBuckets.skills || 0} XP</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Arrière-plans</span>
                    <span className="font-bold">{pointsBuckets.backgrounds || 0} XP</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="font-bold text-slate-800">Total</span>
                    <span className="font-bold text-blue-600 text-lg">
                        {totalXP} XP
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CreationPointsPreview;
