
import React, { useState, useEffect } from 'react';
import { useCharacter } from '../../context/CharacterContext';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

const SafetyAlert: React.FC = () => {
    const { data, sync, isSyncing } = useCharacter();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const isDirty = data.syncInfo?.isDirty;
        const isAutoSync = data.syncInfo?.isAutoSyncEnabled;
        const lastSynced = data.syncInfo?.lastSynced || 0;
        const syncId = data.syncInfo?.syncId;

        // Only show if Cloud Sync is configured, Auto-Sync is OFF, and data is dirty
        if (!syncId || isAutoSync || !isDirty) {
            setIsVisible(false);
            return;
        }

        const checkSafety = () => {
            const now = Date.now();
            const alertThreshold = 60 * 60 * 1000; // 60 minutes

            if (now - lastSynced > alertThreshold) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        // Check every 5 seconds
        const interval = setInterval(checkSafety, 5000);
        checkSafety(); // Initial check

        return () => clearInterval(interval);
    }, [data.syncInfo?.isDirty, data.syncInfo?.isAutoSyncEnabled, data.syncInfo?.lastSynced, data.syncInfo?.syncId]);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-20 right-4 z-[100] animate-in slide-in-from-bottom-10 duration-500 no-print">
            <div className="bg-[#8b2e2e] border-2 border-amber-600/50 rounded-lg shadow-2xl p-4 max-w-sm relative overflow-hidden text-white">

                {/* Decorative background glow */}
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-2 right-2 text-white/50 hover:text-white transition-colors"
                >
                    <X size={16} />
                </button>

                <div className="flex gap-3 items-start">
                    <div className="bg-amber-500/20 text-amber-400 p-2 rounded-full border border-amber-500/30 mt-1">
                        <AlertTriangle size={20} />
                    </div>

                    <div>
                        <h4 className="font-serif font-bold text-lg leading-none mb-1 text-amber-100">
                            Attention : Oubli ?
                        </h4>
                        <p className="text-xs text-white/80 mb-3 font-medium leading-relaxed">
                            Votre feuille n'a pas été sauvegardée depuis plus de 60 minutes.
                            Vos dernières modifications risquent d'être perdues en cas de fermeture.
                        </p>

                        <button
                            onClick={() => sync('manual')}
                            disabled={isSyncing}
                            className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-[#1c1917] px-4 py-2 rounded-sm text-xs font-black uppercase tracking-widest transition shadow-md w-full disabled:opacity-50"
                        >
                            {isSyncing ? (
                                <RefreshCw size={14} className="animate-spin" />
                            ) : (
                                <RefreshCw size={14} />
                            )}
                            Sauvegarder maintenant
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SafetyAlert;
