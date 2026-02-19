import React from 'react';
import { Database, AlertTriangle, RefreshCw, Trash2, AlertCircle, Flame } from 'lucide-react';
import { useStorageUsage } from '../../hooks/useStorageUsage';
import { MotionFade } from '../ui/motion/MotionFade';
import ThematicModal from '../ui/ThematicModal';
import { OfflineStorageService } from '../../services/OfflineStorageService';
import ThematicButton from '../ui/ThematicButton';

const StorageMonitor: React.FC = () => {
    const { stats, loading, refresh } = useStorageUsage();
    const [showPurgeConfirm, setShowPurgeConfirm] = React.useState(false);
    const [isPurging, setIsPurging] = React.useState(false);

    const handlePurge = async () => {
        setIsPurging(true);
        try {
            await OfflineStorageService.clearAllLocalData();
            // Force reload to clear everything from memory and restart
            window.location.href = window.location.origin + window.location.pathname;
        } catch (error) {
            console.error('Purge failed:', error);
            setIsPurging(false);
            setShowPurgeConfirm(false);
        }
    };

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center p-8">
                <RefreshCw className="animate-spin text-indigo-500" size={24} />
            </div>
        );
    }

    if (!stats) return null;

    const usageMo = (usage: number) => (usage / (1024 * 1024)).toFixed(1);
    const quotaMo = (stats.quota / (1024 * 1024)).toFixed(0);
    const percent = stats.percent;

    // Colors mapping
    let barColor = 'bg-indigo-500';
    let textColor = 'text-indigo-700';
    let bgColor = 'bg-indigo-50';
    let borderColor = 'border-indigo-200';

    if (stats.isCritical) {
        barColor = 'bg-red-600 animate-pulse';
        textColor = 'text-red-700';
        bgColor = 'bg-red-50';
        borderColor = 'border-red-200';
    } else if (stats.isWarning) {
        barColor = 'bg-amber-500';
        textColor = 'text-amber-700';
        bgColor = 'bg-amber-50';
        borderColor = 'border-amber-200';
    }

    return (
        <MotionFade duration={0.4}>
            <div className={`p-4 border ${borderColor} ${bgColor} rounded-sm shadow-sm relative overflow-hidden group transition-all duration-300`}>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 ${stats.isCritical ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'} rounded-sm`}>
                            <Database size={20} />
                        </div>
                        <div>
                            <h4 className={`font-bold text-sm ${textColor}`}>Stockage Local (Disque)</h4>
                            <p className="text-[10px] text-stone-500 uppercase tracking-widest font-mono">Quota Navigateur : {quotaMo} Mo</p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <button
                            onClick={refresh}
                            className="text-stone-400 hover:text-indigo-600 transition-colors p-1"
                            title="Actualiser les stats"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold">
                        <span className={textColor}>{usageMo(stats.usage)} Mo utilisés</span>
                        <span className="text-stone-400">{percent}%</span>
                    </div>
                    <div className="h-2 w-full bg-stone-200/50 rounded-full overflow-hidden border border-stone-200/20">
                        <div
                            className={`h-full ${barColor} transition-all duration-1000 ease-out`}
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200/40 flex justify-between items-center">
                    <div className="text-[10px] text-stone-500 max-w-[150px] leading-tight italic">
                        Images, personnages et règles en cache.
                    </div>
                    <button
                        onClick={() => setShowPurgeConfirm(true)}
                        className="text-[10px] font-bold uppercase tracking-wider text-red-600 hover:text-red-800 flex items-center gap-1.5 transition-colors p-1"
                    >
                        <Trash2 size={12} />
                        Purger tout
                    </button>
                </div>

                {stats.isWarning && (
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-amber-800 animate-in fade-in duration-500">
                        <AlertTriangle size={12} className="shrink-0" />
                        <p>{stats.isCritical ? "Stockage SATURÉ. Impossible de sauvegarder de nouvelles images." : "Espace de stockage bientôt saturé. Pensez à supprimer des images inutiles."}</p>
                    </div>
                )}

                {/* Background Decoration */}
                <div className="absolute -bottom-2 -right-2 opacity-[0.03] rotate-12 transition-transform group-hover:scale-110 duration-700">
                    <Database size={80} />
                </div>
            </div>

            {/* Deep Purge Confirmation Modal */}
            {showPurgeConfirm && (
                <ThematicModal
                    isOpen={showPurgeConfirm}
                    onClose={() => !isPurging && setShowPurgeConfirm(false)}
                    title="Purger toutes les données ?"
                    icon={<AlertCircle size={24} className="text-red-600" />}
                    size="md"
                    footer={
                        <>
                            <ThematicButton
                                variant="secondary"
                                onClick={() => setShowPurgeConfirm(false)}
                                disabled={isPurging}
                            >
                                Annuler
                            </ThematicButton>
                            <ThematicButton
                                variant="danger"
                                onClick={handlePurge}
                                disabled={isPurging}
                                leftIcon={isPurging ? <RefreshCw className="animate-spin" size={16} /> : <Flame size={16} />}
                            >
                                {isPurging ? 'Purge en cours...' : 'Confirmer la Purge'}
                            </ThematicButton>
                        </>
                    }
                >
                    <div className="space-y-4 py-2">
                        <div className="bg-red-50 border border-red-100 p-4 rounded-sm flex gap-4 items-start">
                            <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
                            <div className="text-sm text-red-900 leading-relaxed">
                                <p className="font-bold mb-2">Cette action est IRREVERSIBLE et destructive.</p>
                                <ul className="list-disc ml-4 space-y-1 text-red-800/80">
                                    <li>Toutes les <strong>images</strong> locales seront supprimées.</li>
                                    <li>Toutes les <strong>règles hors-ligne</strong> seront effacées.</li>
                                    <li>Votre <strong>session</strong> et vos préférences seront réinitialisées.</li>
                                </ul>
                            </div>
                        </div>

                        <p className="text-xs text-stone-500 italic">
                            L'application redémarrera immédiatement. Une connexion Internet sera nécessaire pour récupérer vos données depuis le Cloud.
                        </p>
                    </div>
                </ThematicModal>
            )}
        </MotionFade>
    );
};

export default StorageMonitor;
