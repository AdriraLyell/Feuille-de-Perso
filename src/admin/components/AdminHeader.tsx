import React from 'react';
import { Settings, ArrowLeft, UploadCloud, Download, Upload, LogOut, AlertTriangle, Cloud } from 'lucide-react';
import { APP_VERSION } from '../../constants/app';
import { MotionFade } from '../../components/ui/motion/MotionFade';

interface AdminHeaderProps {
    currentSettingName: string;
    hasUnsavedChanges: boolean;
    isSaving: boolean;
    onBack: () => void;
    onSave: () => void;
    onImport: () => void;
    onExport: () => void;
    onPublish: () => void;
    onLogout: () => void;
    onShowChangelog: () => void;
    onCheckSchema?: () => void;
    onMigrate?: () => void;
    legacyEffectsCount?: number;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
    currentSettingName,
    hasUnsavedChanges,
    isSaving,
    onBack,
    onSave,
    onImport,
    onExport,
    onPublish,
    onLogout,
    onShowChangelog,
    onCheckSchema,
    onMigrate,
    legacyEffectsCount = 0
}) => {
    return (
        <header className="bg-mystic-deep/95 text-stone-200 p-4 shadow-glass sticky top-0 z-50 border-b border-stone-800 backdrop-blur-md">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <MotionFade delay={0.1}>
                        <button onClick={onBack} className="text-stone-500 hover:text-amber-gold transition-colors p-2 hover:bg-stone-800 rounded-full group" title="Retour au tableau de bord" aria-label="Retour au tableau de bord">
                            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                    </MotionFade>

                    <MotionFade delay={0.2} className="flex items-center gap-2">
                        <Settings className="text-amber-700 animate-spin-slow" size={24} />
                        <h1 className="text-2xl font-serif font-bold tracking-wide text-amber-gold drop-shadow-sm">
                            Éditeur <span className="text-stone-600 font-sans font-normal text-lg mx-2">|</span> <span className="text-stone-300 font-sans font-normal">{currentSettingName || "Campagne"}</span>
                        </h1>
                    </MotionFade>

                    <div className="ml-4 pl-4 border-l border-stone-800 flex items-center" title={hasUnsavedChanges ? "Modifications locales non publiées" : "Synchronisé"}>
                        {hasUnsavedChanges ? (
                            <MotionFade key="unsaved" duration={0.3}>
                                <div className="flex items-center gap-2 text-amber-500 animate-pulse bg-amber-950/20 px-3 py-1 rounded-full border border-amber-900/30">
                                    <AlertTriangle size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Modifications en cours</span>
                                </div>
                            </MotionFade>
                        ) : (
                            <MotionFade key="synced" duration={0.3}>
                                <button
                                    className="flex items-center gap-2 text-green-700/50 cursor-pointer hover:text-green-500 transition-colors bg-transparent border-none p-0"
                                    onClick={onCheckSchema}
                                    title="Vérifier la validité du schéma"
                                    aria-label="Vérifier la validité du schéma"
                                >
                                    <Cloud size={20} />
                                </button>
                            </MotionFade>
                        )}
                    </div>
                    {legacyEffectsCount > 0 && (
                        <MotionFade delay={0.25}>
                            <button
                                onClick={onMigrate}
                                className="flex items-center gap-2 bg-rose-900/50 hover:bg-rose-950/70 text-rose-300 px-3 py-1 rounded-full border border-rose-800/50 animate-pulse"
                                title={`Détecté ${legacyEffectsCount} effets hérités à migrer vers le système de formules.`}
                            >
                                <AlertTriangle size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">{legacyEffectsCount} Effets à migrer</span>
                            </button>
                        </MotionFade>
                    )}
                </div>

                <div className="flex items-center gap-3 text-sm">
                    <MotionFade delay={0.3}>
                        <button
                            onClick={onShowChangelog}
                            className="bg-stone-900/50 px-3 py-1.5 rounded text-[10px] font-black font-mono text-stone-400 hover:text-amber-gold hover:bg-stone-800 transition-colors border border-stone-800"
                            title="Voir le journal des versions"
                        >
                            v{APP_VERSION}
                        </button>
                    </MotionFade>

                    <div className="h-6 w-px bg-stone-800 mx-2" />

                    <MotionFade delay={0.4}>
                        <button
                            onClick={onSave}
                            disabled={isSaving}
                            className={`flex items-center gap-2 px-5 py-2 rounded-sm font-black uppercase tracking-widest text-[10px] transition-all shadow-lg hover:scale-105 active:scale-95 ${hasUnsavedChanges
                                    ? "bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-900/20 animate-pulse ring-2 ring-amber-500/50"
                                    : "bg-stone-800 hover:bg-stone-700 text-stone-400 opacity-80"
                                } disabled:opacity-50 disabled:grayscale`}
                            title="Sauvegarder en BDD"
                        >
                            <UploadCloud size={16} />
                            {isSaving ? "..." : "Sauver"}
                        </button>
                    </MotionFade>

                    <MotionFade delay={0.45}>
                        <button
                            onClick={onImport}
                            className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-stone-300 px-4 py-2 rounded-sm font-black uppercase tracking-widest text-[10px] transition-all border border-stone-800 hover:border-stone-700"
                            title="Importer un JSON (Personnage ou Règles)"
                        >
                            <UploadCloud size={16} className="rotate-180" /> <span className="hidden xl:inline">Importer</span>
                        </button>
                    </MotionFade>

                    <MotionFade delay={0.5}>
                        <button
                            onClick={onExport}
                            className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-stone-300 px-4 py-2 rounded-sm font-black uppercase tracking-widest text-[10px] transition-all border border-stone-800 hover:border-stone-700"
                            title="Exporter le fichier JSON"
                        >
                            <Download size={16} /> <span className="hidden xl:inline">Exporter</span>
                        </button>
                    </MotionFade>

                    <MotionFade delay={0.55}>
                        <button
                            onClick={onPublish}
                            className="flex items-center gap-2 bg-indigo-900/50 hover:bg-indigo-900/70 text-indigo-300 px-4 py-2 rounded-sm font-black uppercase tracking-widest text-[10px] transition-all shadow-lg hover:shadow-indigo-900/20 border border-indigo-900/50"
                            title="Publier sur GitHub"
                        >
                            <Upload size={16} /> <span className="hidden lg:inline">Publier</span>
                        </button>
                    </MotionFade>

                    <div className="h-6 w-px bg-stone-800 mx-1" />

                    <MotionFade delay={0.6}>
                        <button
                            onClick={onLogout}
                            className="bg-stone-950 p-2 rounded hover:bg-crimson-blood hover:text-white text-stone-700 transition-all border border-stone-900 hover:border-crimson-blood/50 group"
                            title="Se déconnecter"
                            aria-label="Se déconnecter"
                        >
                            <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                    </MotionFade>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
