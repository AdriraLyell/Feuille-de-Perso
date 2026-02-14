import React, { useState, useEffect } from 'react';
import { X, User, Star, Book, Shield, Backpack, Award, Zap, Download, Sparkles, Clock, Scroll } from 'lucide-react';
import { SyncedCharacter } from '../../services/CharacterSyncService';
import { CharacterSheetData } from '../../types/character';
import { CampaignService } from '../../services/CampaignService';
import { defaultRules } from '../../data/defaultRules';
import LibraryImportWizard from './LibraryImportWizard';
import { MotionFade } from '../../components/ui/motion/MotionFade';
import { MotionCard } from '../../components/ui/motion/MotionCard';
import { ImageSyncResolver } from '../../services/ImageSyncResolver';

interface CharacterReadOnlyViewProps {
    character: SyncedCharacter;
    onClose: () => void;
    onRefreshRules?: () => void;
}

const CharacterReadOnlyView: React.FC<CharacterReadOnlyViewProps> = ({ character, onClose, onRefreshRules }) => {
    const [processedData, setProcessedData] = useState<CharacterSheetData | null>(null);
    const [categoryLabels, setCategoryLabels] = useState<Record<string, string>>({});
    const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);

    // Virtual reference to the data (either raw or processed)
    const data = processedData || (character.data as CharacterSheetData);

    useEffect(() => {
        const inject = async () => {
            const injected = await ImageSyncResolver.injectImagesAfterSync(character.data);
            setProcessedData(injected);
        };
        inject();
    }, [character]);

    useEffect(() => {
        const loadLabels = async () => {
            if (!character.setting_id) {
                // Orphaned character: use default labels
                const defaults: Record<string, string> = {};
                defaultRules.definitions.skillCategories.forEach(cat => {
                    defaults[cat.id] = cat.label;
                });
                setCategoryLabels(defaults);
                return;
            }

            const rules = await CampaignService.loadSetting(character.setting_id);
            if (rules && rules.definitions.skillCategories) {
                const labels: Record<string, string> = {};
                rules.definitions.skillCategories.forEach(cat => {
                    labels[cat.id] = cat.label;
                });
                setCategoryLabels(labels);
            } else {
                // Fallback to defaults if load fails
                const defaults: Record<string, string> = {};
                defaultRules.definitions.skillCategories.forEach(cat => {
                    defaults[cat.id] = cat.label;
                });
                setCategoryLabels(defaults);
            }
        };

        loadLabels();
    }, [character.setting_id]);

    const getCategoryLabel = (id: string) => {
        return categoryLabels[id] || id.replace('Col_Comp_', 'Série ');
    };

    return (
        <div className="fixed inset-0 bg-stone-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-md overflow-hidden">
            {/* Ambient Background Effect */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-10 pointer-events-none" />

            <MotionFade className="w-full max-w-5xl h-full flex items-center justify-center">
                <MotionCard
                    className="w-full max-h-[90vh] overflow-hidden flex flex-col border-amber-900/30 bg-stone-900/90 relative"
                    hoverEffect="glow"
                >
                    {/* Header Decoration */}
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                        <Scroll size={200} className="rotate-12 text-stone-500" />
                    </div>

                    {/* Header */}
                    <div className="bg-stone-950/80 border-b border-stone-800 p-6 flex justify-between items-center z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-amber-900/20 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-500 shadow-glow-gold">
                                <User size={28} />
                            </div>
                            <div>
                                <h2 className="text-3xl font-serif font-black text-amber-500 flex items-center gap-2 tracking-wide uppercase">
                                    {character.character_name}
                                </h2>
                                <div className="flex items-center gap-3 text-stone-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                                    <span className="text-white bg-amber-900/40 px-2 py-0.5 rounded border border-amber-900/30">Maître : {character.player_name}</span>
                                    <span className="text-stone-700 font-serif">•</span>
                                    <span className="flex items-center gap-1"><Clock size={10} /> Sync : {new Date(character.last_synced).toLocaleString('fr-FR')}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsImportWizardOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-sm text-xs font-black transition-all shadow-lg hover:shadow-amber-500/10 active:scale-95 uppercase tracking-widest"
                                title={character.setting_id ? "Importer dans la bibliothèque de la campagne" : "Importer dans la bibliothèque d'une campagne au choix"}
                            >
                                <Download size={16} className="stroke-[3]" />
                                Importer
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-stone-500 hover:text-amber-500 hover:bg-stone-800 rounded-sm transition-all border border-stone-800 hover:border-amber-900/30"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto p-8 flex-grow space-y-8 custom-scrollbar relative z-10 scroll-smooth">

                        {/* Identité Section */}
                        <MotionFade delay={0.1}>
                            <section className="bg-stone-950/40 border border-stone-800 p-6 rounded-sm shadow-glass relative overflow-hidden group">
                                <h3 className="text-sm font-bold text-amber-700 mb-6 flex items-center gap-2 uppercase tracking-[0.2em] border-b border-stone-800 pb-2">
                                    <User size={16} /> Registre d'Identité
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                    {[
                                        { label: "Nom du Personnage", value: data.header?.name },
                                        { label: "Nom du Joueur", value: data.header?.player },
                                        { label: "Chronique", value: data.header?.chronicle },
                                        { label: "Nature Secrète", value: data.header?.nature }
                                    ].map((item, i) => (
                                        <div key={i} className="group-hover:translate-x-1 transition-transform">
                                            <span className="text-stone-600 block text-[10px] font-bold uppercase tracking-widest mb-1">{item.label}</span>
                                            <span className="font-serif font-bold text-lg text-stone-200">{item.value || '-'}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </MotionFade>

                        {/* Suggestions / Notifications */}
                        {data.suggestions && data.suggestions.length > 0 && (
                            <MotionFade delay={0.15}>
                                <section className="bg-amber-950/20 border border-amber-500/30 p-6 rounded-sm shadow-glow-gold/10 animate-pulse-subtle">
                                    <h3 className="text-sm font-bold text-amber-400 mb-4 flex items-center gap-2 uppercase tracking-[0.2em] border-b border-amber-900/30 pb-2">
                                        <Sparkles size={16} /> Écritures Suspectes
                                    </h3>
                                    <div className="space-y-3">
                                        {data.suggestions.map((suggestion, idx) => (
                                            <div key={idx} className="bg-stone-950/40 p-4 rounded-sm border border-amber-900/20 flex justify-between items-center group shadow-sm">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm tracking-tighter shadow-sm ${suggestion.type === 'background' ? 'bg-amber-600 text-stone-950' : 'bg-stone-800 text-amber-500 border border-amber-900/30'}`}>
                                                            {suggestion.type === 'background' ? 'Historique' : 'Compétence'}
                                                        </span>
                                                        <span className="font-serif font-bold text-lg text-stone-200 group-hover:text-amber-400 transition-colors uppercase tracking-wide">{suggestion.name}</span>
                                                    </div>
                                                    <span className="text-[10px] text-stone-600 font-bold uppercase tracking-widest mt-2 ml-1">
                                                        Mentionné dans : <span className="text-stone-400">{getCategoryLabel ? getCategoryLabel(suggestion.category) : suggestion.category}</span>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-stone-600 text-[10px] font-mono border-l border-stone-800 pl-4 h-8">
                                                    <Clock size={12} />
                                                    {new Date(suggestion.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        ))}
                                        <p className="text-[10px] text-amber-700 font-bold uppercase italic mt-4 flex items-center gap-2 px-1">
                                            <Info size={12} className="shrink-0" />
                                            Ces éléments modifiés par le joueur attendent votre approbation pour rejoindre votre bibliothèque.
                                        </p>
                                    </div>
                                </section>
                            </MotionFade>
                        )}

                        {/* Attributes Layer */}
                        <MotionFade delay={0.2}>
                            <section className="bg-stone-950/20 border border-stone-800 p-6 rounded-sm shadow-inner relative overflow-hidden">
                                <h3 className="text-sm font-bold text-amber-700 mb-6 flex items-center gap-2 uppercase tracking-[0.2em] border-b border-stone-800 pb-2">
                                    <Star size={16} /> Éclats des Attributs
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {(data.attributeSettings || []).map((setting, sIdx) => {
                                        const attrs = data.attributes?.[setting.id] || [];
                                        return (
                                            <div key={setting.id} className="space-y-4">
                                                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.25em] mb-4 flex items-center gap-2 bg-stone-900/80 px-3 py-1.5 rounded-sm border border-stone-800 shadow-sm">
                                                    <div className="w-1 h-1 bg-amber-500 rounded-full animate-pulse" />
                                                    {setting.label}
                                                </h4>
                                                <div className="space-y-2">
                                                    {attrs.map((attr, idx) => {
                                                        const total = (parseInt(attr.val1) || 0) + (parseInt(attr.val2) || 0) + (parseInt(attr.val3) || 0);
                                                        return (
                                                            <div key={idx} className="bg-stone-900/60 px-4 py-2.5 rounded-sm flex justify-between items-center text-sm border border-stone-800 group hover:border-amber-900/30 hover:bg-stone-800/40 transition-all shadow-sm">
                                                                <span className="text-stone-400 group-hover:text-stone-200 transition-colors font-medium tracking-wide uppercase text-xs">{attr.name}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-8 h-1 bg-stone-800 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-amber-600" style={{ width: `${(total / 15) * 100}%` }} />
                                                                    </div>
                                                                    <span className="font-serif font-black text-amber-500 text-lg tabular-nums">{total}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </MotionFade>

                        {/* Skills - Tome Layout */}
                        <MotionFade delay={0.25}>
                            <section className="bg-stone-900/40 border border-stone-800 p-6 rounded-sm shadow-glass">
                                <h3 className="text-sm font-bold text-amber-700 mb-6 flex items-center gap-2 uppercase tracking-[0.2em] border-b border-stone-800 pb-2">
                                    <Book size={16} /> Grimoire des Savoirs
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {Object.entries(data.skills || {})
                                        .filter(([category, skills]) => {
                                            const active = skills.filter(s => s.name && s.value > 0);
                                            return active.length > 0 &&
                                                !category.toLowerCase().includes('background') &&
                                                !category.toLowerCase().includes('arrière-plan') &&
                                                category !== 'Col_Comp_8' &&
                                                category !== 'Col_Comp_9';
                                        })
                                        .sort(([a], [b]) => a.localeCompare(b))
                                        .map(([category, skills], cIdx) => (
                                            <div key={category} className="space-y-3">
                                                <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-1 border-l-2 border-amber-900/30 pl-2">
                                                    {getCategoryLabel(category)}
                                                </h4>
                                                <div className="space-y-1.5 font-sans">
                                                    {skills.filter(s => s.name && s.value > 0).map((skill, idx) => {
                                                        const personalSpecs = data.specializations?.[skill.id] || [];
                                                        const imposedSpecs = data.imposedSpecializations?.[skill.id] || [];

                                                        return (
                                                            <div key={idx} className="bg-stone-950/40 px-3 py-2 rounded-sm border border-stone-800/60 flex flex-col gap-1.5 group hover:border-amber-900/20 transition-all">
                                                                <div className="flex justify-between items-center text-[11px]">
                                                                    <span className="text-stone-300 font-bold group-hover:text-amber-500 transition-colors uppercase tracking-tight truncate mr-2" title={skill.name}>{skill.name}</span>
                                                                    <span className="font-serif font-black text-amber-600 text-sm tabular-nums">{skill.value}</span>
                                                                </div>
                                                                {(personalSpecs.length > 0 || imposedSpecs.length > 0) && (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {imposedSpecs.map((spec, sIdx) => (
                                                                            <span key={`imp-${sIdx}`} className="text-[8px] leading-tight px-1.5 py-0.5 bg-amber-900/30 text-amber-400 rounded-sm border border-amber-900/40 font-black uppercase tracking-tighter">
                                                                                {spec.name}
                                                                            </span>
                                                                        ))}
                                                                        {personalSpecs.map((spec, sIdx) => (
                                                                            <span key={`pers-${sIdx}`} className="text-[8px] leading-tight px-1.5 py-0.5 bg-stone-800/50 text-stone-500 rounded-sm italic border border-stone-800">
                                                                                {spec}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </section>
                        </MotionFade>

                        {/* Backgrounds Section */}
                        {Object.entries(data.skills || {})
                            .filter(([category]) => category.toLowerCase().includes('background') || category.toLowerCase().includes('arrière-plan') || category === 'Col_Comp_8')
                            .flatMap(([_, skills]) => skills.filter(s => s.name && s.value > 0)).length > 0 && (
                                <MotionFade delay={0.3}>
                                    <section className="bg-stone-950/40 border border-stone-800 p-6 rounded-sm shadow-glass">
                                        <h3 className="text-sm font-bold text-amber-700 mb-6 flex items-center gap-2 uppercase tracking-[0.2em] border-b border-stone-800 pb-2">
                                            <Award size={16} /> Chroniques Antérieures
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {Object.entries(data.skills || {})
                                                .filter(([category]) => category.toLowerCase().includes('background') || category.toLowerCase().includes('arrière-plan') || category === 'Col_Comp_8')
                                                .flatMap(([_, skills]) => skills.filter(s => s.name && s.value > 0))
                                                .sort((a, b) => a.name.localeCompare(b.name))
                                                .map((bg, idx) => {
                                                    const personalSpecs = data.specializations?.[bg.id] || [];
                                                    const imposedSpecs = data.imposedSpecializations?.[bg.id] || [];

                                                    return (
                                                        <div key={idx} className="bg-stone-900/60 p-4 rounded-sm border border-stone-800 flex flex-col gap-2 group hover:border-amber-900/20 transition-all shadow-sm relative overflow-hidden">
                                                            <div className="flex justify-between items-start z-10">
                                                                <div className="flex flex-col">
                                                                    <span className="font-serif font-black text-lg text-stone-200 group-hover:text-amber-500 transition-all uppercase tracking-wide">{bg.name}</span>
                                                                    {bg.variant && <span className="text-[10px] text-stone-500 italic font-medium uppercase tracking-widest mt-0.5">{bg.variant}</span>}
                                                                </div>
                                                                <span className="font-serif font-black text-amber-600 text-xl tabular-nums bg-stone-950/50 w-10 h-10 flex items-center justify-center rounded-sm border border-stone-800">{bg.value}</span>
                                                            </div>
                                                            {(personalSpecs.length > 0 || imposedSpecs.length > 0) && (
                                                                <div className="flex flex-wrap gap-1.5 mt-2 z-10">
                                                                    {imposedSpecs.map((spec, sIdx) => (
                                                                        <span key={`imp-${sIdx}`} className="text-[8px] leading-tight px-2 py-0.5 bg-amber-900/30 text-amber-500 rounded-sm border border-amber-900/30 font-black uppercase tracking-widest">
                                                                            {spec.name}
                                                                        </span>
                                                                    ))}
                                                                    {personalSpecs.map((spec, sIdx) => (
                                                                        <span key={`pers-${sIdx}`} className="text-[8px] leading-tight px-2 py-0.5 bg-stone-800/80 text-stone-500 rounded-sm italic border border-stone-700/50">
                                                                            {spec}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            {/* Background Motif */}
                                                            <Award size={64} className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:rotate-12 transition-transform duration-500" />
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                    </section>
                                </MotionFade>
                            )}

                        {/* Traits Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {(data.page2?.avantages || []).filter(t => t.name && t.name.trim() !== '').length > 0 && (
                                <MotionFade delay={0.35}>
                                    <section className="bg-stone-900/40 border-l-4 border-emerald-900/50 p-6 rounded-sm shadow-glass">
                                        <h3 className="text-sm font-bold text-emerald-600 mb-6 flex items-center gap-2 uppercase tracking-[0.2em] border-b border-stone-800 pb-2">
                                            <Zap size={16} /> Éclats de Fortune
                                        </h3>
                                        <div className="space-y-3">
                                            {data.page2.avantages
                                                .filter(t => t.name && t.name.trim() !== '')
                                                .map((trait, idx) => (
                                                    <div key={idx} className="bg-stone-950/40 p-3 rounded-sm border border-stone-800 flex justify-between items-start gap-4 group hover:border-emerald-900/30 transition-all">
                                                        <div className="flex flex-col">
                                                            <div className="font-bold text-xs text-stone-300 group-hover:text-emerald-500 uppercase tracking-widest">{trait.name}</div>
                                                            {trait.variant && <div className="text-[10px] text-stone-600 italic font-medium uppercase tracking-tighter mt-1">{trait.variant}</div>}
                                                        </div>
                                                        <span className="font-mono font-black text-emerald-500 bg-emerald-900/20 px-2 py-1 rounded-sm text-xs border border-emerald-900/30 shadow-inner">+{trait.value}</span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </section>
                                </MotionFade>
                            )}

                            {(data.page2?.desavantages || []).filter(t => t.name && t.name.trim() !== '').length > 0 && (
                                <MotionFade delay={0.35}>
                                    <section className="bg-stone-900/40 border-l-4 border-red-900/50 p-6 rounded-sm shadow-glass">
                                        <h3 className="text-sm font-bold text-red-600 mb-6 flex items-center gap-2 uppercase tracking-[0.2em] border-b border-stone-800 pb-2">
                                            <Zap size={16} className="rotate-180" /> Fardeaux de l'Ombre
                                        </h3>
                                        <div className="space-y-3">
                                            {data.page2.desavantages
                                                .filter(t => t.name && t.name.trim() !== '')
                                                .map((trait, idx) => (
                                                    <div key={idx} className="bg-stone-950/40 p-3 rounded-sm border border-stone-800 flex justify-between items-start gap-4 group hover:border-red-900/30 transition-all">
                                                        <div className="flex flex-col">
                                                            <div className="font-bold text-xs text-stone-300 group-hover:text-red-500 uppercase tracking-widest">{trait.name}</div>
                                                            {trait.variant && <div className="text-[10px] text-stone-600 italic font-medium uppercase tracking-tighter mt-1">{trait.variant}</div>}
                                                        </div>
                                                        <span className="font-mono font-black text-red-500 bg-red-900/20 px-2 py-1 rounded-sm text-xs border border-red-900/30 shadow-inner">-{trait.value}</span>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </section>
                                </MotionFade>
                            )}
                        </div>

                        {/* Experience Layer */}
                        <MotionFade delay={0.4}>
                            <section className="bg-stone-950/40 border border-stone-800 p-6 rounded-sm shadow-glass relative overflow-hidden">
                                <h3 className="text-sm font-bold text-amber-700 mb-6 flex items-center gap-2 uppercase tracking-[0.2em] border-b border-stone-800 pb-2">
                                    <Shield size={16} /> Bilan des Expériences
                                </h3>
                                <div className="grid grid-cols-3 gap-8 ">
                                    {[
                                        { label: "Acquise", val: data.experience?.gain, color: "text-amber-500", bg: "bg-amber-900/10", border: "border-amber-900/20" },
                                        { label: "Dépensée", val: data.experience?.spent, color: "text-stone-400", bg: "bg-stone-800/10", border: "border-stone-800/40" },
                                        { label: "Reliquat", val: data.experience?.rest, color: "text-emerald-500", bg: "bg-emerald-900/10", border: "border-emerald-900/40" }
                                    ].map((item, i) => (
                                        <div key={i} className={`${item.bg} ${item.border} border p-4 rounded-sm flex flex-col items-center justify-center shadow-lg group hover:scale-[1.02] transition-transform`}>
                                            <span className="text-stone-600 font-black text-[10px] uppercase tracking-[0.3em] mb-2">{item.label}</span>
                                            <span className={`text-3xl font-serif font-black ${item.color} group-hover:drop-shadow-glow-gold transition-all`}>{item.val || 0}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </MotionFade>

                        {/* Equipment Preview */}
                        {data.page2?.equipement && (
                            <MotionFade delay={0.45}>
                                <section className="bg-stone-900/40 border border-stone-800 p-6 rounded-sm shadow-glass">
                                    <h3 className="text-sm font-bold text-amber-700 mb-6 flex items-center gap-2 uppercase tracking-[0.2em] border-b border-stone-800 pb-2">
                                        <Backpack size={16} /> Inventaire & Effets
                                    </h3>
                                    <div className="bg-stone-950/80 p-6 rounded-sm border border-stone-800 text-stone-400 font-serif leading-relaxed italic text-base whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar shadow-inner">
                                        {data.page2.equipement || '-'}
                                    </div>
                                </section>
                            </MotionFade>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-stone-800 p-6 bg-stone-950/80 flex justify-end z-10 gap-4">
                        <p className="text-[10px] text-stone-600 font-bold uppercase tracking-[0.2em] mr-auto self-center opacity-50">
                            Registre de Vision Only • Sanctuaire d'Administration
                        </p>
                        <button
                            onClick={onClose}
                            className="px-10 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-sm font-black transition-all border border-stone-700 shadow-md uppercase tracking-widest text-xs active:scale-95"
                        >
                            Refermer le Registre
                        </button>
                    </div>
                </MotionCard>
            </MotionFade>

            {/* Import Wizard */}
            {isImportWizardOpen && (
                <LibraryImportWizard
                    character={character}
                    onClose={() => setIsImportWizardOpen(false)}
                    onSuccess={() => {
                        if (onRefreshRules) onRefreshRules();
                    }}
                />
            )}
        </div>
    );
};

const Info = ({ size, className }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 24}
        height={size || 24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

export default CharacterReadOnlyView;
