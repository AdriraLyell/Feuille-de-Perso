import React from 'react';
import { List } from 'lucide-react';

interface RankSlotsConfigProps {
    rankSlots: { [key: number]: number };
    onUpdateRankSlot: (rank: number, value: number) => void;
}

const RankSlotsConfig: React.FC<RankSlotsConfigProps> = ({ rankSlots, onUpdateRankSlot }) => {
    return (
        <div className="bg-white p-6 rounded shadow-sm border border-slate-200">
            <h4 className="font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
                <List size={18} className="text-blue-500" /> Répartition des Rangs
            </h4>
            <div className="space-y-3">
                {[5, 4, 3, 2, 1].map(rank => (
                    <div key={rank} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                        <span className="font-bold text-slate-600">Rang {rank}</span>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={rankSlots[rank] || 0}
                                onChange={(e) => onUpdateRankSlot(rank, parseInt(e.target.value) || 0)}
                                className="w-20 border border-slate-300 rounded px-2 py-1 text-center font-mono focus:border-blue-500 outline-none"
                            />
                            <span className="text-sm text-slate-400">rangs</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RankSlotsConfig;
