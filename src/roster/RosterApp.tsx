import React, { useEffect, useState } from 'react';
import { CharacterSyncService, SyncedCharacter } from '../services/CharacterSyncService';
import { CampaignService, RulesData } from '../services/CampaignService';
import { Loader2, Users, AlertCircle, Heart, Shield, Droplets, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { MotionFade } from '../components/ui/motion/MotionFade';
import { CharacterSheetData } from '../types';

interface RosterAppProps {
    settingId: string;
}

export const RosterApp: React.FC<RosterAppProps> = ({ settingId }) => {
    const [characters, setCharacters] = useState<SyncedCharacter[]>([]);
    const [rules, setRules] = useState<RulesData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadData();
    }, [settingId]);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [chars, setting] = await Promise.all([
                CharacterSyncService.getFullCharactersBySettingId(settingId),
                CampaignService.loadSetting(settingId)
            ]);

            setCharacters(chars);
            setRules(setting);

            if (!setting) {
                setError("La chronique demandée n'existe pas ou n'est plus accessible.");
            }
        } catch (err) {
            setError("Impossible de charger les données du registre.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-8">
                <Loader2 className="animate-spin text-amber-600 mb-4" size={48} />
                <p className="text-amber-700/60 font-serif italic text-xl">Consultation des registres akashiques...</p>
            </div>
        );
    }

    if (error || !rules) {
        return (
            <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-8">
                <AlertCircle className="text-rose-600 mb-4" size={48} />
                <p className="text-rose-500 font-bold uppercase tracking-widest">{error || "Erreur inconnue"}</p>
            </div>
        );
    }

    // Récupérer la liste des attributs pour l'en-tête (en fusionnant toutes les catégories)
    let allAttributes: { name: string, category: string }[] = [];
    if (characters.length > 0) {
        Object.entries(characters[0].data.attributes || {}).forEach(([catName, attrs]) => {
            (attrs as any[]).forEach(attr => {
                if (!allAttributes.find(a => a.name === attr.name)) {
                    allAttributes.push({ name: attr.name, category: catName });
                }
            });
        });
    }

    const getCategoryColor = (catName: string) => {
        const lower = catName.toLowerCase();
        if (lower.includes('physique')) return '#fb923c'; // orange-400
        if (lower.includes('mental')) return '#38bdf8';   // sky-400
        if (lower.includes('social')) return '#34d399';   // emerald-400
        return '#d97706'; // amber-600
    };

    interface SkillRow {
        name: string;
        scores: number[];
        maxScore: number;
    }

    const skillMatrix: Record<string, SkillRow[]> = {};
    if (characters.length > 0 && rules) {
        const allCats = Object.keys(characters[0].data.skills || {});
        allCats.forEach(catId => {
            // Trouver le label lisible pour cet ID (Col_Comp_1 -> "Combat" par ex)
            const catConfig = rules.definitions.skillCategories?.find(c => c.id === catId);
            const catLabel = catConfig?.label || catId;

            const uniqueSkills = new Set<string>();
            characters.forEach(c => {
                const charData = c.data as CharacterSheetData;
                (charData.skills?.[catId] || []).forEach(s => uniqueSkills.add(s.name));
            });

            const rows: SkillRow[] = [];
            uniqueSkills.forEach(skillName => {
                const scores = characters.map(c => {
                    const charData = c.data as CharacterSheetData;
                    const skillNode = (charData.skills?.[catId] || []).find(s => s.name === skillName);
                    return skillNode?.value || 0;
                });
                const maxScore = Math.max(...scores);
                if (maxScore > 0) {
                    rows.push({ name: skillName, scores, maxScore });
                }
            });

            if (rows.length > 0) {
                rows.sort((a, b) => a.name.localeCompare(b.name));
                skillMatrix[catLabel] = rows;
            }
        });
    }

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
        <div className="min-h-screen bg-stone-950 text-stone-300 p-8 font-sans selection:bg-amber-900/50">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-amber-900/30 pb-6">
                <div>
                    <h1 className="text-4xl font-serif font-black text-amber-500 flex items-center gap-3 tracking-widest uppercase">
                        <Users className="text-amber-600" size={32} />
                        Registre : {rules.settingName}
                    </h1>
                    <p className="text-amber-900/60 font-black text-[10px] uppercase tracking-[0.3em] mt-2 ml-12">
                        Matrice comparative des investigateurs
                    </p>
                </div>
                <div className="text-stone-500 text-sm font-mono bg-stone-900/50 px-4 py-2 rounded-sm border border-stone-800">
                    <span className="text-amber-600 font-bold">{characters.length}</span> Âmes recensées
                </div>
            </header>

            {characters.length === 0 ? (
                <div className="max-w-7xl mx-auto text-center py-32 bg-stone-950/50 rounded-lg border border-stone-800/50">
                    <p className="text-stone-500 font-serif italic text-2xl">Le registre est vide pour cette chronique.</p>
                </div>
            ) : (
                <main className="max-w-7xl mx-auto space-y-12">
                    {/* SECTION HAUT : LE TABLEAU STRICT (Vitals & Attributs) */}
                    <div className="overflow-x-auto rounded-sm border border-stone-800 shadow-glass-dark bg-stone-900/20">
                        <table className="w-full text-left border-collapse min-w-max">
                            <thead className="bg-stone-950 border-b border-stone-800">
                                <tr>
                                    <th className="p-4 font-black uppercase tracking-widest text-amber-700/80 text-[10px] sticky left-0 bg-stone-950 z-30 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.5)]">Identité</th>
                                    {allAttributes.map(attr => (
                                        <th key={attr.name} className="p-4 font-black uppercase tracking-widest text-[9px] text-center border-l border-stone-800/20" style={{ color: getCategoryColor(attr.category) }}>
                                            {attr.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-800/50">
                                {characters.map(char => {
                                    const data = char.data as CharacterSheetData;

                                    // Extraction linéaire de tous les attributs du perso
                                    const charAttrs: Record<string, number> = {};
                                    Object.values(data.attributes || {}).forEach(cat => {
                                        cat.forEach(attr => { charAttrs[attr.name] = parseInt(attr.val1 || "0", 10); });
                                    });

                                    // Extraction des compteurs (Volonté, etc) et custom
                                    const vitalCounters = [];
                                    if (data.counters.volonte && !Array.isArray(data.counters.volonte)) {
                                        vitalCounters.push(data.counters.volonte);
                                    }
                                    if (data.counters.confiance && !Array.isArray(data.counters.confiance)) {
                                        vitalCounters.push(data.counters.confiance);
                                    }
                                    const customCounters = data.counters.custom || [];

                                    return (
                                        <tr key={char.id} className="hover:bg-amber-900/5 transition-colors">
                                            <td className="p-4 sticky left-0 bg-[#161412] z-10 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.5)] border-r border-stone-800/50">
                                                <div className="font-serif font-bold text-lg text-amber-50" title={char.character_name}>
                                                    {char.character_name.split(' ')[0]}
                                                </div>
                                                <div className="text-[10px] uppercase tracking-widest text-stone-500">{char.player_name}</div>
                                                <div className="text-xs text-stone-400 italic mt-1">{data.header?.nature || ""}</div>
                                            </td>
                                            {allAttributes.map(attr => {
                                                const val = charAttrs[attr.name] || 0;
                                                const isExcep = val >= 3;
                                                const isNegative = val < 0;
                                                const isZero = val === 0;

                                                return (
                                                    <td key={attr.name} className="p-4 text-center border-l border-stone-800/10">
                                                        <span className={`font-mono text-sm ${isZero ? 'opacity-20' : ''} ${isExcep ? 'text-amber-400 font-bold scale-110 inline-block' : 'text-stone-300'} ${isNegative ? 'text-rose-500' : ''}`}>
                                                            {val}
                                                        </span>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* SECTION MILIEU : MATRICE DES COMPÉTENCES */}
                    <div className="bg-stone-900/40 border border-stone-800 rounded-sm overflow-hidden shadow-glass-dark">
                        <div className="p-4 border-b border-stone-800 bg-stone-950 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h2 className="font-serif font-bold text-lg text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                Matrice des Compétences
                            </h2>
                            <div className="relative w-full sm:w-64">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search size={14} className="text-stone-500" />
                                </div>
                                <input
                                    type="text"
                                    className="w-full bg-stone-900 border border-stone-700 text-stone-300 text-sm rounded-sm focus:ring-amber-500 focus:border-amber-500 block pl-9 p-2 transition-colors"
                                    placeholder="Chercher une compétence..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
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
                                                                    <td className="p-3 font-medium text-stone-300 sticky left-0 bg-[#161412] z-10 w-48 border-r border-stone-800/30 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.5)]">
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
                    </div>

                    {/* SECTION BAS : GRILLE DE DOSSIERS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {characters.map((char, index) => {
                            const data = char.data as CharacterSheetData;

                            const hasTraitsAdvs = data.page2?.avantages && data.page2.avantages.filter(t => t.name).length > 0;
                            const hasTraitsDesadvs = data.page2?.desavantages && data.page2.desavantages.filter(t => t.name).length > 0;

                            return (
                                <MotionFade key={char.id} delay={0.1 * index}>
                                    <div className="h-full bg-stone-900/30 border border-stone-800 rounded-sm p-5 flex flex-col hover:border-amber-900/50 transition-colors shadow-glass-dark">
                                        <h3 className="font-serif font-bold text-xl text-amber-400 mb-1 border-b border-stone-800 pb-2">
                                            {char.character_name}
                                        </h3>

                                        <div className="mt-4 space-y-4 flex-grow">
                                            {/* Traits (Avantages) */}
                                            {hasTraitsAdvs && (
                                                <div>
                                                    <div className="text-[9px] uppercase tracking-widest text-amber-700/80 mb-2 font-black">Avantages</div>
                                                    <div className="space-y-1">
                                                        {data.page2.avantages.filter(t => t.name).map((trait, i) => (
                                                            <div key={i} className="text-[11px] leading-tight px-2 py-1 rounded-sm border bg-emerald-950/20 text-emerald-400 border-emerald-900/20 truncate flex justify-between items-center">
                                                                <span className="font-bold truncate" title={trait.name}>{trait.name}</span>
                                                                {trait.value && <span className="font-mono text-[10px] opacity-80 shrink-0 ml-2">{trait.value}</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Traits (Désavantages) */}
                                            {hasTraitsDesadvs && (
                                                <div>
                                                    <div className="text-[9px] uppercase tracking-widest text-amber-700/80 mb-2 font-black">Désavantages</div>
                                                    <div className="space-y-1">
                                                        {data.page2.desavantages.filter(t => t.name).map((trait, i) => (
                                                            <div key={i} className="text-[11px] leading-tight px-2 py-1 rounded-sm border bg-rose-950/20 text-rose-400 border-rose-900/20 truncate flex justify-between items-center">
                                                                <span className="font-bold truncate" title={trait.name}>{trait.name}</span>
                                                                {trait.value && <span className="font-mono text-[10px] opacity-80 shrink-0 ml-2">{trait.value}</span>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </MotionFade>
                            );
                        })}
                    </div>
                </main>
            )}
        </div>
    );
};
