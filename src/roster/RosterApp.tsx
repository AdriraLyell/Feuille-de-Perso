import React, { useEffect, useState } from 'react';
import { CharacterSyncService, SyncedCharacter } from '../services/CharacterSyncService';
import { CampaignService, RulesData } from '../services/CampaignService';
import { Loader2, Users, AlertCircle, Heart, Shield, Droplets, Search, ChevronDown, ChevronRight, CalendarDays, Clock } from 'lucide-react';
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
    const [showAttributes, setShowAttributes] = useState(true);
    const [showSkills, setShowSkills] = useState(true);
    const [showTraits, setShowTraits] = useState(true);
    const [showTimeManagement, setShowTimeManagement] = useState(true);

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
        // Dictionnaire "Référentiel Central", nom -> catId
        const officialSkillMap = new Map<string, string>();

        const addToMap = (lib: any[] | undefined) => {
            lib?.forEach(s => {
                const lowerName = s.name.trim().toLowerCase();
                if (s.mysticAbilityId) {
                    officialSkillMap.set(lowerName, `MYSTIC_${s.mysticAbilityId}`);
                } else if (s.defaultCategory) {
                    officialSkillMap.set(lowerName, s.defaultCategory);
                }
            });
        };

        addToMap(rules?.libraries?.skills);
        addToMap(rules?.libraries?.backgrounds);

        // Ajouter les habiletés elles-mêmes au cas où elles seraient saisies comme compétences
        rules?.libraries?.mysticAbilities?.forEach(s => {
            officialSkillMap.set(s.name.trim().toLowerCase(), `MYSTIC_${s.id}`);
        });

        // 2. Récolter TOUTES les compétences uniques et leur attribuer une "catégorie maître"
        const masterCategoriesMap = new Map<string, Set<string>>();

        characters.forEach(c => {
            const charData = c.data as CharacterSheetData;
            Object.entries(charData.skills || {}).forEach(([_, skillList]) => {
                skillList.forEach(s => {
                    const baseName = s.name.trim();
                    const variantName = s.variant?.trim();
                    const cleanName = variantName ? `${baseName} : ${variantName}` : baseName;
                    const lowerName = cleanName.toLowerCase();

                    // Extraire le nom racine (soit depuis baseName, soit via le nettoyage habituel pour les cas hybrides)
                    let rootName = baseName.toLowerCase();
                    if (rootName.includes('(')) {
                        rootName = rootName.split('(')[0].trim();
                    } else if (rootName.includes(':')) {
                        rootName = rootName.split(':')[0].trim();
                    }

                    // On prend la catégorie officielle (par match exact ou par nom racine)
                    let masterCatId = officialSkillMap.get(lowerName) || officialSkillMap.get(rootName);

                    // Si non trouvé dans le référentiel, on check si l'instance porte un tag mystique (custom skills liés)
                    if (!masterCatId) {
                        const mId = (s as any).mysticAbilityId;
                        if (mId) {
                            masterCatId = `MYSTIC_${mId}`;
                        } else {
                            masterCatId = "Col_Comp_Custom";
                        }
                    }

                    if (!masterCategoriesMap.has(masterCatId)) {
                        masterCategoriesMap.set(masterCatId, new Set());
                    }
                    // On ajoute le nom complet (cleanName) au Set pour distinguer les variantes
                    masterCategoriesMap.get(masterCatId)!.add(cleanName);
                });
            });
        });

        // 3. Calculer les lignes de scores pour chaque catégorie
        masterCategoriesMap.forEach((uniqueSkills, catId) => {
            // Déterminer le nom lisible
            let catLabel = "Autres (Hors Référentiel)";
            if (catId.startsWith("MYSTIC_")) {
                const mId = catId.replace("MYSTIC_", "");
                const mysticDef = rules.libraries.mysticAbilities?.find(m => m.id === mId);
                catLabel = mysticDef?.name ? mysticDef.name.toUpperCase() : "HABILETÉS MYSTIQUES";
            } else if (catId !== "Col_Comp_Custom") {
                const catConfig = rules.definitions.skillCategories?.find(c => c.id === catId);
                catLabel = catConfig?.label || catId;
            }

            const rows: SkillRow[] = [];
            uniqueSkills.forEach(skillName => {
                // Pour chaque perso, on cherche la compétence dans TOUS ses dossiers, puisqu'on a ignoré son rangement initial
                const scores = characters.map(c => {
                    const charData = c.data as CharacterSheetData;
                    let foundValue = 0;

                    // Parcours de n'importe quel dossier de compétences pour trouver "skillName"
                    for (const [, catSkills] of Object.entries(charData.skills || {})) {
                        const found = catSkills.find(s => {
                            const b = s.name.trim();
                            const v = s.variant?.trim();
                            const cn = v ? `${b} : ${v}` : b;
                            return cn === skillName;
                        });
                        if (found) {
                            foundValue = found.value || 0;
                            break; // On a trouvé la compétence, pas besoin de chercher dans les autres dossiers
                        }
                    }
                    return foundValue;
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

    const formatCurrentDate = () => {
        if (!rules?.configurations?.calendar) return "Non configuré";
        const cal = rules.configurations.calendar;
        if (cal.type === 'fictional') {
            const m = cal.months?.[cal.currentMonthIndex]?.name ?? `Mois ${cal.currentMonthIndex + 1}`;
            return `Jour ${cal.currentDay}, ${m}, An ${cal.currentYear}`;
        } else {
            if (!cal.currentDate) return "Date indéfinie";
            const d = new Date(cal.currentDate);
            if (isNaN(d.getTime())) return cal.currentDate;
            return d.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        }
    };

    const handleAdvanceTime = async (amount: 'day' | 'week' | 'month') => {
        if (!rules || !rules.configurations.calendar) return;
        const calendar = rules.configurations.calendar;
        let newCalendar = { ...calendar };

        if (calendar.type === 'fictional') {
            let { currentDay, currentMonthIndex, currentYear } = calendar;

            const incrementDay = () => {
                let currentMonthDays = calendar.months[currentMonthIndex]?.days ?? 30;
                currentDay++;
                if (currentDay > currentMonthDays) {
                    currentDay = 1;
                    currentMonthIndex++;
                    if (currentMonthIndex >= calendar.months.length) {
                        currentMonthIndex = 0;
                        currentYear++;
                    }
                }
            };

            if (amount === 'day') {
                incrementDay();
            } else if (amount === 'week') {
                for (let i = 0; i < 7; i++) incrementDay();
            } else if (amount === 'month') {
                currentMonthIndex++;
                if (currentMonthIndex >= calendar.months.length) {
                    currentMonthIndex = 0;
                    currentYear++;
                }
                const monthDays = calendar.months[currentMonthIndex]?.days ?? 30;
                currentDay = Math.min(currentDay, monthDays);
            }

            newCalendar = { ...calendar, currentDay, currentMonthIndex, currentYear };

        } else if (calendar.type === 'real') {
            if (!calendar.currentDate) return;
            const date = new Date(calendar.currentDate);
            if (isNaN(date.getTime())) return;

            if (amount === 'day') {
                date.setDate(date.getDate() + 1);
            } else if (amount === 'week') {
                date.setDate(date.getDate() + 7);
            } else if (amount === 'month') {
                date.setMonth(date.getMonth() + 1);
            }
            newCalendar = { ...calendar, currentDate: date.toISOString().split('T')[0] };
        }

        const newRules = {
            ...rules,
            configurations: {
                ...rules.configurations,
                calendar: newCalendar
            }
        };

        setRules(newRules);
        await CampaignService.saveSetting(settingId, newRules);
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
                <div className="flex items-center gap-6">
                    <div className="text-stone-500 text-sm font-mono bg-stone-900/50 px-4 py-2 rounded-sm border border-stone-800 shadow-glass-dark flex items-center gap-2">
                        <span className="text-amber-600 font-bold">{characters.length}</span> <span className="uppercase text-[10px] tracking-widest">Âmes</span>
                    </div>
                </div>
            </header>

            {characters.length === 0 ? (
                <div className="max-w-7xl mx-auto text-center py-32 bg-stone-950/50 rounded-lg border border-stone-800/50 shadow-glass-dark">
                    <p className="text-stone-500 font-serif italic text-2xl">Le registre est vide pour cette chronique.</p>
                </div>
            ) : (
                <main className="max-w-7xl mx-auto space-y-12">
                    {/* SECTION GESTION TEMPORELLE */}
                    <div className="bg-stone-900/40 border border-stone-800 rounded-sm overflow-hidden shadow-glass-dark mb-12">
                        <button
                            onClick={() => setShowTimeManagement(!showTimeManagement)}
                            className="w-full p-4 flex justify-between items-center bg-stone-950 border-b border-stone-800 hover:bg-stone-900 transition-colors"
                        >
                            <h2 className="font-serif font-bold text-lg text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={20} className="text-amber-600" /> Gestion Temporelle
                            </h2>
                            {showTimeManagement ? <ChevronDown size={18} className="text-amber-600" /> : <ChevronRight size={18} className="text-amber-600" />}
                        </button>

                        {showTimeManagement && (
                            <div className="p-6 bg-stone-900/20 flex flex-col items-center gap-6">
                                <div className="text-center">
                                    <div className="text-[10px] text-stone-500 uppercase tracking-[0.2em] font-bold mb-2">
                                        Date Courante de la Chronique
                                    </div>
                                    <div className="text-2xl font-serif font-black text-amber-400 capitalize bg-stone-950 border border-stone-800 px-6 py-3 rounded-sm shadow-glass-dark">
                                        {formatCurrentDate()}
                                    </div>
                                </div>

                                <div className="flex flex-wrap justify-center gap-4">
                                    <button
                                        onClick={() => handleAdvanceTime('day')}
                                        className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-sm font-bold text-sm uppercase tracking-wider border border-stone-700 hover:border-amber-500/50 transition-colors"
                                    >
                                        <CalendarDays size={16} className="text-amber-600" /> +1 Jour
                                    </button>
                                    <button
                                        onClick={() => handleAdvanceTime('week')}
                                        className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-sm font-bold text-sm uppercase tracking-wider border border-stone-700 hover:border-amber-500/50 transition-colors"
                                    >
                                        <CalendarDays size={16} className="text-amber-600" /> +1 Semaine
                                    </button>
                                    <button
                                        onClick={() => handleAdvanceTime('month')}
                                        className="flex items-center gap-2 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-sm font-bold text-sm uppercase tracking-wider border border-stone-700 hover:border-amber-500/50 transition-colors"
                                    >
                                        <CalendarDays size={16} className="text-amber-600" /> +1 Mois
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SECTION HAUT : LE TABLEAU STRICT */}
                    <div className="bg-stone-900/40 border border-stone-800 rounded-sm overflow-hidden shadow-glass-dark mb-12">
                        <button
                            onClick={() => setShowAttributes(!showAttributes)}
                            className="w-full p-4 flex justify-between items-center bg-stone-950 border-b border-stone-800 hover:bg-stone-900 transition-colors"
                        >
                            <h2 className="font-serif font-bold text-lg text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                Tableau Strict (Attributs)
                            </h2>
                            {showAttributes ? <ChevronDown size={18} className="text-amber-600" /> : <ChevronRight size={18} className="text-amber-600" />}
                        </button>

                        {showAttributes && (
                            <div className="overflow-x-auto bg-stone-900/20">
                                <table className="w-full text-left border-collapse min-w-max">
                                    <thead className="bg-[#12100e] border-y border-stone-800/50">
                                        <tr>
                                            <th className="p-3 text-stone-500 font-bold uppercase tracking-widest text-[10px] sticky left-0 bg-[#12100e] z-20 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.5)]">Identité</th>
                                            {allAttributes.map(attr => (
                                                <th key={attr.name} className="p-3 font-bold uppercase tracking-widest text-[9px] text-center border-l border-stone-800/20" style={{ color: getCategoryColor(attr.category) }}>
                                                    {attr.name}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-800/50">
                                        {characters.map(char => {
                                            const data = char.data as CharacterSheetData;
                                            const charAttrs: Record<string, number> = {};
                                            Object.values(data.attributes || {}).forEach(cat => {
                                                cat.forEach(attr => { charAttrs[attr.name] = parseInt(attr.val1 || "0", 10); });
                                            });

                                            return (
                                                <tr key={char.id} className="hover:bg-amber-900/5 transition-colors">
                                                    <td className="p-3 sticky left-0 bg-[#161412] z-10 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.5)] border-r border-stone-800/50">
                                                        <div className="font-serif font-bold text-lg text-amber-50" title={char.character_name}>
                                                            {char.character_name.split(' ')[0]}
                                                        </div>
                                                        <div className="text-[10px] uppercase tracking-widest text-stone-500">{char.player_name}</div>
                                                        <div className="text-xs text-stone-400 italic mt-1 truncate max-w-[150px]">{data.header?.nature || ""}</div>
                                                    </td>
                                                    {allAttributes.map(attr => {
                                                        const val = charAttrs[attr.name] || 0;
                                                        const isExcep = val >= 3;
                                                        const isNegative = val < 0;
                                                        const isZero = val === 0;

                                                        return (
                                                            <td key={attr.name} className="p-3 text-center border-l border-stone-800/10">
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
                        )}
                    </div>

                    {/* SECTION MILIEU : MATRICE DES COMPÉTENCES */}
                    <div className="bg-stone-900/40 border border-stone-800 rounded-sm overflow-hidden shadow-glass-dark">
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

                    {/* SECTION BAS : GRILLE DE DOSSIERS (Traits) */}
                    <div className="bg-stone-900/40 border border-stone-800 rounded-sm overflow-hidden shadow-glass-dark">
                        <button
                            onClick={() => setShowTraits(!showTraits)}
                            className="w-full p-4 flex justify-between items-center bg-stone-950 border-b border-stone-800 hover:bg-stone-900 transition-colors"
                        >
                            <h2 className="font-serif font-bold text-lg text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                Profils & Traits
                            </h2>
                            {showTraits ? <ChevronDown size={18} className="text-amber-600" /> : <ChevronRight size={18} className="text-amber-600" />}
                        </button>

                        {showTraits && (
                            <div className="p-6">
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

                                                    <div className="mt-4 grid grid-cols-2 gap-4 flex-grow items-start">
                                                        {/* Traits (Avantages) */}
                                                        <div className="flex flex-col w-full h-full">
                                                            {hasTraitsAdvs && (
                                                                <>
                                                                    <div className="text-[9px] uppercase tracking-widest text-amber-700/80 mb-2 font-black text-center border-b border-amber-900/30 pb-1">Avantages</div>
                                                                    <div className="space-y-1">
                                                                        {data.page2.avantages.filter(t => t.name).map((trait, i) => (
                                                                            <div key={i} className="text-[11px] leading-tight px-2 py-1 rounded-sm border bg-emerald-950/20 text-emerald-400 border-emerald-900/20 truncate flex justify-between items-center w-full">
                                                                                <span className="font-bold truncate" title={trait.name}>{trait.name}</span>
                                                                                {trait.value && <span className="font-mono text-[10px] opacity-80 shrink-0 ml-1">{trait.value}</span>}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Traits (Désavantages) */}
                                                        <div className="flex flex-col w-full h-full border-l border-stone-800/50 pl-4">
                                                            {hasTraitsDesadvs && (
                                                                <>
                                                                    <div className="text-[9px] uppercase tracking-widest text-amber-700/80 mb-2 font-black text-center border-b border-amber-900/30 pb-1">Désavantages</div>
                                                                    <div className="space-y-1">
                                                                        {data.page2.desavantages.filter(t => t.name).map((trait, i) => (
                                                                            <div key={i} className="text-[11px] leading-tight px-2 py-1 rounded-sm border bg-rose-950/20 text-rose-400 border-rose-900/20 truncate flex justify-between items-center w-full">
                                                                                <span className="font-bold truncate" title={trait.name}>{trait.name}</span>
                                                                                {trait.value && <span className="font-mono text-[10px] opacity-80 shrink-0 ml-1">{trait.value}</span>}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </MotionFade>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            )}
        </div>
    );
};
