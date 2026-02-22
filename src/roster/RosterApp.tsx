import React, { useEffect, useState } from 'react';
import { CharacterSyncService, SyncedCharacter } from '../services/CharacterSyncService';
import { CampaignService, RulesData } from '../services/CampaignService';
import { Loader2, Users, AlertCircle, Heart, Shield, Droplets } from 'lucide-react';
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
    let allAttributes: string[] = [];
    if (characters.length > 0) {
        Object.values(characters[0].data.attributes || {}).forEach(cat => {
            cat.forEach(attr => allAttributes.push(attr.name));
        });
    }

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
                                    <th className="p-4 font-black uppercase tracking-widest text-amber-700/80 text-[10px]">Identité</th>
                                    <th className="p-4 font-black uppercase tracking-widest text-amber-700/80 text-[10px] text-center">Jauges & Cpt</th>
                                    {allAttributes.map(attr => (
                                        <th key={attr} className="p-4 font-black uppercase tracking-widest text-amber-700/80 text-[10px] text-center" title={attr}>
                                            {attr.substring(0, 3)}
                                        </th>
                                    ))}
                                    <th className="p-4 font-black uppercase tracking-widest text-amber-700/80 text-[10px] text-right">XP</th>
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
                                            <td className="p-4">
                                                <div className="font-serif font-bold text-lg text-amber-50">{char.character_name}</div>
                                                <div className="text-[10px] uppercase tracking-widest text-stone-500">{char.player_name}</div>
                                                <div className="text-xs text-stone-400 italic mt-1">{data.header?.nature || ""}</div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex flex-col items-center gap-1 font-mono text-xs">
                                                    {/* Standard Counters */}
                                                    {vitalCounters.map(c => (
                                                        <span key={c.id} className="px-2 py-0.5 rounded-sm bg-blue-950/30 text-blue-400" title={c.name}>
                                                            {c.name.substring(0, 3).toUpperCase()}: {c.value} {c.max ? `/ ${c.max}` : ''}
                                                        </span>
                                                    ))}
                                                    {/* Custom Counters (usually Santé, etc) */}
                                                    {customCounters.slice(0, 2).map(c => (
                                                        <span key={c.id} className="px-2 py-0.5 rounded-sm bg-rose-950/30 text-rose-400" title={c.name}>
                                                            {c.name.substring(0, 3).toUpperCase()}: {c.value} {c.max ? `/ ${c.max}` : ''}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            {allAttributes.map(attr => (
                                                <td key={attr} className="p-4 text-center">
                                                    <span className="font-mono text-sm text-stone-300">
                                                        {charAttrs[attr] || 0}
                                                    </span>
                                                </td>
                                            ))}
                                            <td className="p-4 text-right">
                                                <span className="font-mono text-amber-500 bg-amber-950/30 px-2 py-1 rounded-sm text-sm" title={`Reste: ${data.experience?.rest}`}>
                                                    {data.experience?.rest || 0} rst
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* SECTION BAS : GRILLE DE DOSSIERS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {characters.map((char, index) => {
                            const data = char.data as CharacterSheetData;

                            // Top compétences (les 6 meilleures > 0)
                            const allSkills: { name: string, value: number }[] = [];
                            Object.values(data.skills || {}).forEach(cat => {
                                cat.forEach(skill => {
                                    if (skill.value && skill.value > 0) allSkills.push(skill);
                                })
                            });

                            const topSkills = allSkills
                                .sort((a, b) => b.value - a.value)
                                .slice(0, 6);

                            const hasTraitsAdvs = data.page2?.avantages && data.page2.avantages.filter(t => t.name).length > 0;
                            const hasTraitsDesadvs = data.page2?.desavantages && data.page2.desavantages.filter(t => t.name).length > 0;

                            return (
                                <MotionFade key={char.id} delay={0.1 * index}>
                                    <div className="h-full bg-stone-900/30 border border-stone-800 rounded-sm p-5 flex flex-col hover:border-amber-900/50 transition-colors shadow-glass-dark">
                                        <h3 className="font-serif font-bold text-xl text-amber-400 mb-1 border-b border-stone-800 pb-2">
                                            {char.character_name}
                                        </h3>

                                        <div className="mt-4 space-y-4 flex-grow">
                                            {/* Compétences */}
                                            {topSkills.length > 0 && (
                                                <div>
                                                    <div className="text-[9px] uppercase tracking-widest text-amber-700/80 mb-2 font-black">Top Compétences</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {topSkills.map((skill, i) => (
                                                            <span key={i} className="text-[10px] font-bold bg-stone-950 text-stone-300 px-2 py-1 rounded-sm border border-stone-800 shadow-sm">
                                                                {skill.name} <span className="text-amber-500 ml-1">{skill.value}</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Traits (Avantages) */}
                                            {hasTraitsAdvs && (
                                                <div>
                                                    <div className="text-[9px] uppercase tracking-widest text-amber-700/80 mb-2 font-black">Avantages</div>
                                                    <div className="space-y-1">
                                                        {data.page2.avantages.filter(t => t.name).map((trait, i) => (
                                                            <div key={i} className="text-[11px] leading-tight px-2 py-1 rounded-sm border bg-emerald-950/20 text-emerald-400 border-emerald-900/20 truncate">
                                                                <span className="font-bold">{trait.name}</span>
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
                                                            <div key={i} className="text-[11px] leading-tight px-2 py-1 rounded-sm border bg-rose-950/20 text-rose-400 border-rose-900/20 truncate">
                                                                <span className="font-bold">{trait.name}</span>
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
