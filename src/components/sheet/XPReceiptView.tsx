import React, { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, ChevronDown, Activity, BookOpen, User, Maximize2, Sparkles, Database, Zap, Wrench, Swords, Bookmark } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { ExperienceBreakdown, ExperienceBreakdownItem } from '../../types';

interface XPReceiptViewProps {
    breakdown?: ExperienceBreakdown;
    totalGain: string;
    totalSpent: string;
    totalRest: string;
}

interface AggregatedEntry {
    name: string;
    amount: number;
    count?: number;
    type: 'earn' | 'spend' | 'refund';
}

interface GroupedTransaction {
    category: string;
    label: string;
    icon: React.ReactNode;
    colorClass: string;
    entries: AggregatedEntry[];
    total: number;
}

export const XPReceiptView: React.FC<XPReceiptViewProps> = ({ breakdown, totalGain, totalSpent, totalRest }) => {
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    const getCategorizedData = useMemo(() => {
        if (!breakdown) return { gains: [], spends: [] };

        const finalize = (key: string, label: string, icon: React.ReactNode, colorClass: string, items: ExperienceBreakdownItem[] = [], type: 'earn' | 'spend' | 'refund'): GroupedTransaction => {
            const entries: AggregatedEntry[] = items.map(item => ({
                name: item.name,
                amount: Math.abs(item.amount),
                count: item.count,
                type
            })).sort((a, b) => b.amount - a.amount);

            return {
                category: key,
                label,
                icon,
                colorClass,
                entries,
                total: entries.reduce((sum, e) => sum + e.amount, 0)
            };
        };

        const gainsRaw = breakdown.gains || [];
        const sessionGains = gainsRaw.filter(g => g.name.startsWith('Base :'));
        const traitGains = gainsRaw.filter(g => g.name.startsWith('Bonus :'));
        const otherGains = gainsRaw.filter(g => !g.name.startsWith('Base :') && !g.name.startsWith('Bonus :'));

        const gains = [
            finalize('sessions', 'Sessions & Scénarios', <BookOpen size={16} />, 'text-emerald-700', sessionGains, 'earn'),
            finalize('traits_gain', 'Traits (Désavantages/Bonus)', <Database size={16} />, 'text-amber-600', traitGains, 'earn'),
            finalize('other_gain', 'Autres Gains', <Sparkles size={16} />, 'text-indigo-600', otherGains, 'earn')
        ].filter(c => c.entries.length > 0);

        const skillGroupsMap = new Map<string, ExperienceBreakdownItem[]>();
        breakdown.skills.forEach(skill => {
            const catName = skill.category || 'Autres Compétences';
            if (!skillGroupsMap.has(catName)) {
                skillGroupsMap.set(catName, []);
            }
            skillGroupsMap.get(catName)!.push(skill);
        });

        const skillGroupSpends = Array.from(skillGroupsMap.entries()).map(([catName, items], index) => {
            let icon = <Activity size={16} />;
            let colorClass = 'text-rose-600';

            const lowerCat = catName.toLowerCase();
            if (lowerCat.includes('talent')) {
                icon = <Zap size={16} />;
                colorClass = 'text-orange-600';
            } else if (lowerCat.includes('connaissance') || lowerCat.includes('langue')) {
                icon = <BookOpen size={16} />;
                colorClass = 'text-sky-600';
            } else if (lowerCat.includes('savoir-faire') || lowerCat.includes('artisanat')) {
                icon = <Wrench size={16} />;
                colorClass = 'text-stone-500';
            } else if (lowerCat.includes('mêlée') || lowerCat.includes('combat') || lowerCat.includes('tir') || lowerCat.includes('arme')) {
                icon = <Swords size={16} />;
                colorClass = 'text-red-700';
            } else if (lowerCat.includes('arrière-plan') || lowerCat.includes('spécialisation')) {
                icon = <Bookmark size={16} />;
                colorClass = 'text-stone-600';
            }

            return finalize(`skills-${index}`, catName, icon, colorClass, items, 'spend');
        });

        const spends = [
            finalize('attributes', 'Attributs', <User size={16} />, 'text-amber-600', breakdown.attributes, 'spend'),
            ...skillGroupSpends,
            finalize('traits_spend', 'Traits (Avantages)', <Database size={16} />, 'text-purple-600', breakdown.traits, 'spend'),
            finalize('counters', 'Compteurs', <Maximize2 size={16} />, 'text-cyan-600', breakdown.counters, 'spend'),
            finalize('mystic', 'Habilités Mystiques', <Sparkles size={16} />, 'text-indigo-600', breakdown.mystic || [], 'spend')
        ].filter(c => c.entries.length > 0);

        return { gains, spends };
    }, [breakdown]);

    const renderTooltipContent = (group: GroupedTransaction) => {
        const topEntries = [...group.entries].slice(0, 5);
        return (
            <div className="p-2 min-w-64 max-w-sm">
                <div className="font-bold border-b border-stone-600 pb-1 mb-2 text-stone-200">{group.label} (Top Investissements)</div>
                {topEntries.length === 0 ? <div className="text-stone-400 italic text-sm">Aucune donnée</div> : null}
                <ul className="space-y-1.5 text-sm">
                    {topEntries.map((e, i) => (
                        <li key={i} className="flex justify-between items-start gap-3 text-stone-300">
                            <span className="grow line-clamp-2" title={e.name}>
                                {e.name} {e.count !== undefined && e.count > 1 && <span className="text-[10px] text-stone-500 font-normal"> (x{e.count})</span>}
                            </span>
                            <span className={`shrink-0 font-bold ${e.type === 'spend' ? 'text-red-400' : e.type === 'refund' ? 'text-blue-400' : 'text-green-400'}`}>
                                {e.type === 'spend' ? '-' : '+'}{e.amount}
                            </span>
                        </li>
                    ))}
                </ul>
                {group.entries.length > 5 && (
                    <div className="mt-2 pt-1 border-t border-stone-700 text-xs text-stone-400 text-center italic">
                        + {group.entries.length - 5} autres types de dépenses...
                    </div>
                )}
            </div>
        );
    };

    const renderExpandedTable = (group: GroupedTransaction) => {
        return (
            <div className="bg-stone-50 border-t border-stone-200 px-4 py-3 text-[13px] animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-[1fr_80px] gap-4 mb-2 border-b border-stone-300 font-bold text-stone-500 uppercase tracking-wider text-[11px] py-1.5">
                    <div className="text-left">Sujet de l'Investissement</div>
                    <div className="text-right">Total XP</div>
                </div>
                <div className="max-h-64 overflow-y-auto pr-2 space-y-1">
                    {group.entries.map((e, i) => (
                        <div key={i} className="grid grid-cols-[1fr_80px] gap-4 py-2 border-b border-stone-100 last:border-0 hover:bg-stone-100/80 transition-colors">
                            <div className="text-stone-800 font-medium truncate flex items-center gap-2" title={e.name}>
                                {e.name}
                                {e.count !== undefined && e.count > 1 && <span className="bg-stone-200 text-stone-500 px-1.5 py-0.5 rounded text-[10px] font-bold">x{e.count}</span>}
                            </div>
                            <div className={`font-mono font-bold text-right flex items-center justify-end ${e.type === 'spend' ? 'text-red-600' : e.type === 'refund' ? 'text-blue-600' : 'text-green-600'}`}>
                                {e.type === 'spend' ? '-' : '+'}{e.amount}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderGroup = (group: GroupedTransaction) => {
        const isExpanded = expandedCategory === group.category;
        return (
            <div key={group.category} className={`border border-stone-200 rounded-lg overflow-hidden transition-all duration-200 ${isExpanded ? 'bg-white shadow-md my-2 ring-1 ring-stone-300' : 'bg-white/60 hover:bg-white mb-2'}`}>
                <Tippy
                    content={renderTooltipContent(group)}
                    placement="left"
                    theme="translucent"
                    arrow={true}
                    delay={[200, 0]}
                    disabled={isExpanded} // Disable tooltip when expanded
                    className="bg-stone-800/95 backdrop-blur-sm text-stone-100 rounded-lg shadow-xl border border-stone-700 font-sans"
                >
                    <button
                        type="button"
                        className="px-4 py-3 flex items-center justify-between cursor-pointer group select-none text-left w-full outline-none"
                        onClick={() => setExpandedCategory(isExpanded ? null : group.category)}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-md bg-stone-100 border border-stone-200 ${group.colorClass} group-hover:scale-105 transition-transform`}>
                                {group.icon}
                            </div>
                            <div>
                                <div className="font-bold text-stone-800 text-sm">{group.label}</div>
                                <div className="text-[11px] text-stone-500">{group.entries.length} élément{group.entries.length > 1 ? 's' : ''} distinct{group.entries.length > 1 ? 's' : ''}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className={`font-mono font-bold text-lg ${group.colorClass}`}>
                                {group.total} XP
                            </div>
                            <div className={`text-stone-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-stone-800' : 'group-hover:text-stone-800'}`}>
                                <ChevronDown size={20} />
                            </div>
                        </div>
                    </button>
                </Tippy>

                {isExpanded && renderExpandedTable(group)}
            </div>
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 bg-stone-50/50 font-sans">

            {/* Colonne Gains */}
            <div className="flex flex-col gap-1">
                <div className="flex items-end justify-between mb-2 border-b border-stone-300 pb-1">
                    <h2 className="text-lg font-bold font-serif text-emerald-900 flex items-center gap-2">
                        <ArrowUpRight className="text-emerald-600" size={20} />
                        RECETTES & GAINS
                    </h2>
                    <div className="text-xl font-black text-emerald-700 tracking-tighter">
                        {totalGain} <span className="text-sm text-emerald-600 font-normal">XP</span>
                    </div>
                </div>

                <div className="flex-grow space-y-1">
                    {getCategorizedData.gains.length === 0 ? (
                        <div className="text-center p-8 text-stone-400 italic bg-white/50 border border-stone-200 border-dashed rounded-lg">
                            Aucun gain enregistré.
                        </div>
                    ) : (
                        getCategorizedData.gains.map(renderGroup)
                    )}
                </div>
            </div>

            {/* Colonne Dépenses */}
            <div className="flex flex-col gap-1">
                <div className="flex items-end justify-between mb-2 border-b border-stone-300 pb-1">
                    <h2 className="text-lg font-bold font-serif text-rose-900 flex items-center gap-2">
                        <ArrowDownRight className="text-rose-600" size={20} />
                        INVESTISSEMENTS
                    </h2>
                    <div className="text-xl font-black text-rose-700 tracking-tighter">
                        {totalSpent} <span className="text-sm text-rose-600 font-normal">XP</span>
                    </div>
                </div>

                <div className="flex-grow space-y-1">
                    {getCategorizedData.spends.length === 0 ? (
                        <div className="text-center p-8 text-stone-400 italic bg-white/50 border border-stone-200 border-dashed rounded-lg">
                            Aucune dépense enregistrée.
                        </div>
                    ) : (
                        getCategorizedData.spends.map(renderGroup)
                    )}
                </div>

            </div>

        </div>
    );
};

export default XPReceiptView;
