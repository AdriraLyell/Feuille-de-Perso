import React from 'react';
import { Database, AlertTriangle, RefreshCw } from 'lucide-react';
import { useStorageUsage } from '../../hooks/useStorageUsage';
import { MotionFade } from '../ui/motion/MotionFade';

const StorageMonitor: React.FC = () => {
    const { stats, loading, refresh } = useStorageUsage();

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center p-8">
                <RefreshCw className="animate-spin text-indigo-500" size={24} />
            </div>
        );
    }

    if (!stats) return null;

    const usageMo = (stats.usage / (1024 * 1024)).toFixed(1);
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
                            <h4 className={`font-bold text-sm ${textColor}`}>Stockage Local (IndexedDB)</h4>
                            <p className="text-[10px] text-stone-500 uppercase tracking-widest font-mono">Quota Navigateur : {quotaMo} Mo</p>
                        </div>
                    </div>
                    <button
                        onClick={refresh}
                        className="text-stone-400 hover:text-indigo-600 transition-colors p-1"
                        title="Actualiser les stats"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold">
                        <span className={textColor}>{usageMo} Mo utilisés</span>
                        <span className="text-stone-400">{percent}%</span>
                    </div>
                    <div className="h-2 w-full bg-stone-200/50 rounded-full overflow-hidden border border-stone-200/20">
                        <div
                            className={`h-full ${barColor} transition-all duration-1000 ease-out`}
                            style={{ width: `${percent}%` }}
                        />
                    </div>
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
        </MotionFade>
    );
};

export default StorageMonitor;
