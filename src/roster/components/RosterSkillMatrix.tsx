import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import { SyncedCharacter } from '../../services/CharacterSyncService';
import { SkillRow } from '../hooks/useRosterData';

interface RosterSkillMatrixProps {
    characters: SyncedCharacter[];
    skillMatrix: Record<string, SkillRow[]>;
}

export const RosterSkillMatrix: React.FC<RosterSkillMatrixProps> = ({
    characters,
    skillMatrix
}) => {
    const [showSkills, setShowSkills] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

    const isSearching = searchQuery.trim().length > 0;
    const lowerSearch = searchQuery.toLowerCase();

    const filteredMatrix: Record<string, SkillRow[]> = {};
    Object.entries(skillMatrix).forEach(([catName, rows]) => {
        const matchingRows = isSearching ? rows.filter(r => r.name.toLowerCase().includes(lowerSearch)) : rows;
        if (matchingRows.length > 0) {
            filteredMatrix[catName] = matchingRows;
        }
    });

    const toggleCategory = (catName: string) => {
        setOpenCategories(prev => ({ ...prev, [catName]: !prev[catName] }));
    };

    return (
        <div className="bg-stone-900/40 border border-stone-800 rounded-sm overflow-hidden shadow-glass-dark mb-12">
            <button
                onClick={() => setShowSkills(!showSkills)}
                className="w-full p-4 flex justify-between items-center bg-stone-950 border-b border-stone-800 hover:bg-stone-900 transition-colors"
            >
                <h2 className="font-serif font-bold text-lg text-amber-500 uppercase tracking-widest flex items-center gap-2">
                    Matrice des Compétences
                </h2>
                {showSkills ? <ChevronDown size={18} className="text-amber-600" /> : <ChevronRight size={18} className="text-amber-600" />}
            </button>

            {showSkills && (
                <>
                    <div className="p-4 border-b border-stone-800 bg-stone-950/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="text-[10px] text-stone-500 uppercase tracking-[0.2em] font-bold">
                            Vue d'ensemble des savoir-faire
                        </div>
                        <div className="relative w-full sm:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={14} className="text-stone-500" />
                            </div>
                            <input
                                type="text"
                                className="w-full bg-stone-900 border border-stone-700 text-stone-300 text-sm rounded-sm focus:ring-amber-500 focus:border-amber-500 block pl-9 pr-9 p-2 transition-colors"
                                placeholder="Chercher une compétence..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500 hover:text-amber-500 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="divide-y divide-stone-800/50">
                        {Object.keys(filteredMatrix).length === 0 ? (
                            <div className="p-8 text-center text-stone-500 italic font-serif">Aucune compétence trouvée.</div>
                        ) : (
                            Object.entries(filteredMatrix).map(([catName, rows]) => {
                                const isOpen = isSearching || openCategories[catName];
                                return (
                                    <div key={catName} className="flex flex-col">
                                        <button
                                            onClick={() => toggleCategory(catName)}
                                            className="w-full text-left p-3 hover:bg-stone-800 flex items-center gap-2 font-bold text-amber-600/80 uppercase tracking-widest text-xs transition-colors"
                                            style={{ backgroundColor: isOpen ? 'rgba(28, 25, 23, 0.8)' : 'rgba(28, 25, 23, 0.4)' }}
                                        >
                                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            {catName}
                                        </button>
                                        {isOpen && (
                                            <div className="overflow-x-auto bg-stone-900/20">
                                                <table className="w-full text-left text-sm whitespace-nowrap min-w-max">
                                                    <thead className="bg-[#12100e] border-y border-stone-800/50">
                                                        <tr>
                                                            <th className="p-3 text-stone-500 font-bold uppercase tracking-widest text-[10px] w-48 sticky left-0 bg-[#12100e] z-20 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.5)]">
                                                                Compétence
                                                            </th>
                                                            {characters.map(c => (
                                                                <th key={c.id} className="p-3 text-center text-[10px] uppercase font-bold text-stone-500 border-l border-stone-800/30" title={c.character_name}>
                                                                    {c.character_name.split(' ')[0]}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-stone-800/30">
                                                        {rows.map(row => (
                                                            <tr key={row.name} className="hover:bg-amber-900/10 transition-colors">
                                                                <td className="p-3 font-medium text-stone-300 sticky left-0 bg-[#161412] z-10 w-48 border-r border-stone-800/30 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.5)] truncate overflow-hidden max-w-[200px]" title={row.name}>
                                                                    {row.name}
                                                                </td>
                                                                {row.scores.map((score, idx) => {
                                                                    const isBest = score > 0 && score === row.maxScore;
                                                                    return (
                                                                        <td key={idx} className={`p-3 text-center font-mono border-l border-stone-800/30 ${isBest ? 'bg-amber-900/20' : ''}`}>
                                                                            {score > 0 ? (
                                                                                <span className={isBest ? 'text-amber-400 font-bold' : 'text-stone-400'}>{score}</span>
                                                                            ) : (
                                                                                <span className="text-stone-700">-</span>
                                                                            )}
                                                                        </td>
                                                                    );
                                                                })}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
