import React, { useState, useMemo } from 'react';
import { XPTransaction } from '../../types';
import { ArrowUpRight, ArrowDownRight, RotateCcw, ChevronDown, Activity, BookOpen, User, Maximize2, Sparkles, Database } from 'lucide-react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css'; // optional

interface XPReceiptViewProps {
    transactions: XPTransaction[];
    totalGain: string;
    totalSpent: string;
    totalRest: string;
}

interface AggregatedEntry {
    name: string;
    amount: number;
    count: number;
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

export const XPReceiptView: React.FC<XPReceiptViewProps> = ({ transactions, totalGain, totalSpent, totalRest }) => {
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    const cleanDescription = (desc: string): string => {
        // Nettoie les descriptions type "Amélioration : Compétence (1 -> 2)"
        // On cherche ce qu'il y a entre ":" et "("
        const colonIndex = desc.indexOf(':');
        const parenIndex = desc.indexOf('(');

        if (colonIndex !== -1) {
            let name = desc.substring(colonIndex + 1);
            if (parenIndex !== -1 && parenIndex > colonIndex) {
                name = desc.substring(colonIndex + 1, parenIndex);
            }
            return name.trim();
        }
        return desc.trim();
    };

    const getCategorizedData = useMemo(() => {
        const categories: Record<string, { label: string, icon: React.ReactNode, colorClass: string, raw: Record<string, AggregatedEntry>, total: number }> = {
            sessions: { label: 'Sessions & Scénarios', icon: <BookOpen size={16} />, colorClass: 'text-emerald-700', raw: {}, total: 0 },
            traits_gain: { label: 'Traits (Désavantages)', icon: <Database size={16} />, colorClass: 'text-amber-600', raw: {}, total: 0 },
            other_gain: { label: 'Création & Autres Gains', icon: <Sparkles size={16} />, colorClass: 'text-indigo-600', raw: {}, total: 0 },
            refunds: { label: 'Remboursements', icon: <RotateCcw size={16} />, colorClass: 'text-blue-600', raw: {}, total: 0 },

            attributes: { label: 'Attributs', icon: <User size={16} />, colorClass: 'text-amber-600', raw: {}, total: 0 },
            skills: { label: 'Compétences', icon: <Activity size={16} />, colorClass: 'text-rose-600', raw: {}, total: 0 },
            traits_spend: { label: 'Traits (Avantages)', icon: <Database size={16} />, colorClass: 'text-purple-600', raw: {}, total: 0 },
            counters: { label: 'Compteurs', icon: <Maximize2 size={16} />, colorClass: 'text-cyan-600', raw: {}, total: 0 },
        };

        transactions.forEach(t => {
            let catKey = 'skills';
            if (t.type === 'earn') {
                if (t.source === 'Session' || t.source === 'Scénario') catKey = 'sessions';
                else if (t.description.toLowerCase().includes('trait') || t.description.toLowerCase().includes('désavantage')) catKey = 'traits_gain';
                else catKey = 'other_gain';
            } else if (t.type === 'refund') {
                catKey = 'refunds';
            } else if (t.type === 'spend') {
                const desc = t.description.toLowerCase();
                if (desc.includes('attribut')) catKey = 'attributes';
                else if (desc.includes('trait') || desc.includes('avantage')) catKey = 'traits_spend';
                else if (desc.includes('compteur') || desc.includes('volonté') || desc.includes('confiance')) catKey = 'counters';
            }

            const name = cleanDescription(t.description);
            const cat = categories[catKey];

            if (!cat.raw[name]) {
                cat.raw[name] = { name, amount: 0, count: 0, type: t.type };
            }
            cat.raw[name].amount += t.amount;
            cat.raw[name].count += 1;
            cat.total += t.amount;
        });

        const finalize = (key: string): GroupedTransaction => {
            const cat = categories[key];
            const entries = Object.values(cat.raw).sort((a, b) => b.amount - a.amount);
            return {
                category: key,
                label: cat.label,
                icon: cat.icon,
                colorClass: cat.colorClass,
                entries,
                total: cat.total
            };
        };

        const gains = ['sessions', 'traits_gain', 'other_gain', 'refunds'].map(finalize).filter(c => c.total > 0 || c.entries.length > 0);
        const spends = ['attributes', 'skills', 'traits_spend', 'counters'].map(finalize).filter(c => c.total > 0 || c.entries.length > 0);

        return { gains, spends };
    }, [transactions]);

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
                                {e.name} {e.count > 1 && <span className="text-[10px] text-stone-500 font-normal"> (x{e.count})</span>}
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
                                {e.count > 1 && <span className="bg-stone-200 text-stone-500 px-1.5 py-0.5 rounded text-[10px] font-bold">x{e.count}</span>}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-stone-50/50 flex-grow font-sans h-full overflow-y-auto">

            {/* Colonne Gains */}
            <div className="flex flex-col gap-2">
                <div className="flex items-end justify-between mb-4 border-b border-stone-300 pb-2">
                    <h2 className="text-xl font-bold font-serif text-emerald-900 flex items-center gap-2">
                        <ArrowUpRight className="text-emerald-600" size={24} />
                        Recettes & Gains
                    </h2>
                    <div className="text-2xl font-black text-emerald-700 tracking-tighter">
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
            <div className="flex flex-col gap-2">
                <div className="flex items-end justify-between mb-4 border-b border-stone-300 pb-2">
                    <h2 className="text-xl font-bold font-serif text-rose-900 flex items-center gap-2">
                        <ArrowDownRight className="text-rose-600" size={24} />
                        Investissements
                    </h2>
                    <div className="text-2xl font-black text-rose-700 tracking-tighter">
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

                {/* Solde Card */}
                <div className="mt-auto pt-6">
                    <div className="bg-indigo-950 text-indigo-50 p-5 rounded-xl shadow-lg border border-indigo-900 flex items-center justify-between relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-10">
                            <Sparkles size={100} />
                        </div>
                        <div>
                            <div className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-1">Solde Disponible</div>
                            <div className="text-xs text-indigo-400/80">Reste à dépenser</div>
                        </div>
                        <div className="text-4xl font-black tracking-tighter font-mono bg-clip-text text-transparent bg-gradient-to-tr from-indigo-200 to-white">
                            {totalRest} <span className="text-base text-indigo-300 font-normal">XP</span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default XPReceiptView;
