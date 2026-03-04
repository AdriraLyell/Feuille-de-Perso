
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameSettingSummary, CampaignService } from '../services/CampaignService';
import { Cloud, Wifi, WifiOff, Loader2, ArrowRight, RotateCcw, BookOpen, Scroll, Sparkles, Clock } from 'lucide-react';
import { RulesData } from '../types/rules';
import { ErrorService } from '../services/ErrorService';
import { MotionFade } from './ui/motion/MotionFade';
import { MotionCard } from './ui/motion/MotionCard';


interface RulesSourceSelectorProps {
    isOpen: boolean;
    onSelectSource: (sourceType: 'online' | 'offline', rules?: RulesData, settingId?: string, settingName?: string) => void;
}

const RulesSourceSelector: React.FC<RulesSourceSelectorProps> = ({ isOpen, onSelectSource }) => {
    const [publicSettings, setPublicSettings] = useState<GameSettingSummary[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'initial' | 'online_list'>('initial');

    // Check for existing session in localStorage
    const saved = localStorage.getItem('rpg-sheet-data');
    let resumeInfo: { name: string; campaign: string; settingId: string } | null = null;
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.header?.name || (parsed.syncInfo?.settingId)) {
                resumeInfo = {
                    name: parsed.header?.name || 'Sans Nom',
                    campaign: parsed.syncInfo?.settingName || 'Inconnue',
                    settingId: parsed.syncInfo?.settingId || 'orphan'
                };
            }
        } catch (e) {
            ErrorService.handleError(e, {
                context: 'RulesSourceSelector.parseLocalStorage',
                userMessage: 'Impossible de restaurer la session précédente',
                silent: true
            });
        }
    }

    const handleOnlineClick = async () => {
        setIsLoading(true);
        try {
            const settings = await CampaignService.listPublicSettings();
            setPublicSettings(settings);
            setMode('online_list');
        } catch (e) {
            ErrorService.handleError(e, { context: 'RulesSourceSelector.OnlineClick', userMessage: "Erreur de connexion : Impossible de récupérer la liste des campagnes." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResumeClick = async () => {
        if (!resumeInfo || resumeInfo.settingId === 'orphan') {
            onSelectSource('offline');
            return;
        }
        setIsLoading(true);
        try {
            const rules = await CampaignService.loadSetting(resumeInfo.settingId);
            if (rules) {
                onSelectSource('online', rules, resumeInfo.settingId, resumeInfo.campaign);
            } else {
                onSelectSource('offline');
            }
        } catch (e) {
            ErrorService.handleError(e, { context: 'RulesSourceSelector.Resume' });
            onSelectSource('offline');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSettingClick = async (setting: GameSettingSummary) => {
        setIsLoading(true);
        try {
            const rules = await CampaignService.loadSetting(setting.id);
            if (rules) {
                onSelectSource('online', rules, setting.id, setting.name);
            }
        } catch (e) {
            ErrorService.handleError(e, { context: 'RulesSourceSelector.SettingClick', userMessage: "Une erreur critique est survenue lors du chargement." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOfflineClick = () => {
        onSelectSource('offline');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-stone-950 flex flex-col items-center justify-center z-[100] p-4 font-sans overflow-hidden">
            {/* Background Texture & Effects */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-30 pointer-events-none" />

            {/* Mystic Glows */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-amber-900/30 rounded-full blur-[120px] pointer-events-none"
            />
            <motion.div
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.1, 0.2, 0.1],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-crimson-blood/20 rounded-full blur-[120px] pointer-events-none"
            />

            <div className="max-w-4xl w-full relative z-10 flex flex-col items-center">
                {/* Hero Header */}
                <MotionFade delay={0.2} className="text-center mb-16">
                    <div className="relative inline-block mb-6">
                        <Scroll size={80} className="text-amber-600/40 rotate-12 blur-sm" />
                        <Sparkles className="absolute -top-2 -right-2 text-amber-400 animate-pulse" size={24} />
                        <BookOpen size={64} className="absolute inset-0 m-auto text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                    </div>

                    <h1 className="text-4xl md:text-6xl font-serif font-black tracking-tighter mb-4 text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-500 to-amber-800 drop-shadow-2xl">
                        ADRIRA LYELL
                    </h1>
                    <p className="text-amber-700/80 font-serif italic text-lg md:text-xl tracking-widest uppercase">
                        Les Chroniques de l'Investigateur
                    </p>
                    <div className="w-48 h-px bg-gradient-to-r from-transparent via-amber-900 to-transparent mx-auto mt-6" />
                </MotionFade>

                <AnimatePresence mode="wait">
                    {mode === 'initial' ? (
                        <motion.div
                            key="initial"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
                        >
                            {/* Resume Card (Full width if single column, or part of grid) */}
                            {resumeInfo && (
                                <MotionCard
                                    hoverEffect="glow"
                                    onClick={handleResumeClick}
                                    className="p-8 border-indigo-900/30 bg-indigo-950/10 flex flex-col items-center text-center group"
                                >
                                    <div className="w-16 h-16 rounded-full bg-indigo-900/20 flex items-center justify-center mb-6 border border-indigo-500/30 group-hover:bg-indigo-600/40 transition shadow-[0_0_20px_rgba(79,70,229,0.2)]">
                                        <RotateCcw className="text-indigo-400" size={32} />
                                    </div>
                                    <h3 className="text-2xl font-serif font-bold text-indigo-300 mb-2">Reprendre</h3>
                                    <p className="text-indigo-500/70 text-sm mb-6 font-medium">
                                        {resumeInfo.name}<br />{resumeInfo.campaign}
                                    </p>
                                    <div className="mt-auto text-indigo-400 flex items-center gap-2 font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                        Continuer <ArrowRight size={14} />
                                    </div>
                                </MotionCard>
                            )}

                            {/* Online Card */}
                            <MotionCard
                                hoverEffect="glow"
                                onClick={handleOnlineClick}
                                className={`p-8 border-amber-900/30 bg-amber-950/10 flex flex-col items-center text-center group ${!resumeInfo ? 'md:col-span-1 md:col-start-1' : ''}`}
                            >
                                <div className="w-16 h-16 rounded-full bg-amber-900/20 flex items-center justify-center mb-6 border border-amber-500/30 group-hover:bg-amber-600/40 transition shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                                    <Wifi className="text-amber-400" size={32} />
                                </div>
                                <h3 className="text-2xl font-serif font-bold text-amber-300 mb-2">Chroniques</h3>
                                <p className="text-amber-700/60 text-sm mb-6">
                                    Rejoindre une campagne<br />en ligne
                                </p>
                                <div className="mt-auto text-amber-400 flex items-center gap-2 font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                    Explorer <ArrowRight size={14} />
                                </div>
                            </MotionCard>

                            {/* Offline Card */}
                            <MotionCard
                                hoverEffect="glow"
                                onClick={handleOfflineClick}
                                className={`p-8 border-stone-800 bg-stone-900/20 flex flex-col items-center text-center group ${!resumeInfo ? 'md:col-span-1' : ''}`}
                            >
                                <div className="w-16 h-16 rounded-full bg-stone-800/40 flex items-center justify-center mb-6 border border-stone-700 group-hover:bg-stone-700 transition">
                                    <WifiOff className="text-stone-400" size={32} />
                                </div>
                                <h3 className="text-2xl font-serif font-bold text-stone-300 mb-2">Hors Ligne</h3>
                                <p className="text-stone-500/70 text-sm mb-6">
                                    Fiche indépendante<br />ou fichier local
                                </p>
                                <div className="mt-auto text-stone-400 flex items-center gap-2 font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                    Inscrire <ArrowRight size={14} />
                                </div>
                            </MotionCard>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="online_list"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="w-full max-w-2xl bg-stone-900/60 backdrop-blur-md border border-amber-900/30 rounded-sm p-8 shadow-glass relative"
                        >
                            <div className="flex items-center justify-between mb-8 pb-4 border-b border-amber-900/20">
                                <button
                                    onClick={() => setMode('initial')}
                                    className="text-amber-700 hover:text-amber-500 text-sm flex items-center gap-2 uppercase font-bold tracking-widest transition-colors"
                                >
                                    <ArrowRight size={16} className="rotate-180" /> Retour
                                </button>
                                <h2 className="text-xl font-serif font-bold text-amber-200 flex items-center gap-2">
                                    <Cloud size={20} className="text-amber-500" /> Campanages Publiques
                                </h2>
                            </div>

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="animate-spin text-amber-600" size={48} />
                                    <span className="text-amber-700 font-serif italic">Consultation des archives...</span>
                                </div>
                            ) : (
                                <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-amber-900/50">
                                    {publicSettings.length === 0 ? (
                                        <div className="text-center py-10 text-stone-500 italic font-serif">
                                            Aucune chronique publique n'a été trouvée dans les registres.
                                        </div>
                                    ) : (
                                        publicSettings.map((setting, idx) => (
                                            <motion.button
                                                key={setting.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                onClick={() => handleSettingClick(setting)}
                                                className="w-full group flex items-center justify-between p-4 rounded-sm border border-stone-800 bg-stone-950/40 hover:border-amber-500/50 hover:bg-amber-950/20 transition text-left"
                                            >
                                                <div>
                                                    <div className="font-serif font-bold text-stone-200 group-hover:text-amber-400 transition-colors text-lg">
                                                        {setting.name}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-amber-900 uppercase tracking-widest flex gap-3 mt-1">
                                                        <span className="bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">v{setting.version}</span>
                                                        <span className="flex items-center gap-1"><Clock size={10} /> {new Date(setting.updated_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <ArrowRight size={20} className="text-stone-700 group-hover:text-amber-500 group-hover:translate-x-1 transition" />
                                            </motion.button>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Footer hint */}
                            <p className="mt-8 text-center text-stone-600 text-xs italic font-serif">
                                "Nul secret ne reste enfoui à jamais."
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Bottom decorative elements */}
                <MotionFade delay={1} className="mt-20 flex gap-12 text-amber-900/20 pointer-events-none">
                    <Scroll size={40} className="-rotate-12" />
                    <Sparkles size={30} />
                    <Scroll size={40} className="rotate-12" />
                </MotionFade>
            </div>
        </div>
    );
};

export default RulesSourceSelector;
