import React, { useEffect, useState } from 'react';
import { useRules } from '../../context/RulesContext';
import { checkForUpdate } from '../../services/RulesLoader';
import { RefreshCw, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const RulesStatus: React.FC = () => {
    const { rules, isLoading, reloadRules } = useRules();
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        if (rules && !isLoading) {
            check();
        }
    }, [rules, isLoading]);

    const check = async () => {
        setIsChecking(true);
        const hasUpdate = await checkForUpdate(rules);
        setUpdateAvailable(hasUpdate);
        setIsChecking(false);
    };

    const handleRefresh = async () => {
        setIsChecking(true);
        await reloadRules();
        setUpdateAvailable(false);
        setIsChecking(false);
    };

    if (isLoading) return <RefreshCw size={14} className="animate-spin text-slate-400" />;

    if (!rules) return (
        <button onClick={handleRefresh} className="flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-bold" title="Erreur chargement. Réessayer ?">
            <AlertTriangle size={14} /> Erreur
        </button>
    );

    // Format Date
    const dateStr = rules.lastUpdated
        ? new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(rules.lastUpdated))
        : 'Inconnue';

    return (
        <div className={`flex items-center gap-2 text-[10px] px-2 py-1.5 rounded-lg border transition-colors ${updateAvailable ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-slate-800/50 text-slate-300 border-slate-700'}`}>

            {/* Version / Date Info */}
            <div className="flex flex-col leading-none items-end min-w-[60px]">
                <span className="font-bold flex items-center gap-1">
                    {updateAvailable && <AlertTriangle size={10} />}
                    v{rules.version}
                </span>
                <span className="text-[9px] opacity-70 whitespace-nowrap">{dateStr}</span>
            </div>

            {/* Refresh Button */}
            <button
                onClick={handleRefresh}
                title={updateAvailable ? "Nouvelle version disponible ! Cliquez pour mettre à jour." : "Vérifier les mises à jour"}
                className={`hover:bg-white/20 rounded-full p-1 transition-colors ${isChecking ? 'animate-spin' : ''}`}
            >
                <RefreshCw size={12} className={updateAvailable ? "text-amber-600" : ""} />
            </button>
        </div>
    );
};

export default RulesStatus;
