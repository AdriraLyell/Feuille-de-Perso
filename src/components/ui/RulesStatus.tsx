import React from 'react';
import { useRules } from '../../context/RulesContext';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

const RulesStatus: React.FC = () => {
    const { rules, isLoading, error, reloadRules } = useRules();

    if (isLoading) return <RefreshCw size={14} className="animate-spin text-slate-400" />;

    // Safety check if rules are null but not loading
    if (!rules) return (
        <button onClick={() => reloadRules()} className="flex items-center gap-1 text-red-500 hover:text-red-700 text-xs font-bold" title="Erreur chargement. Réessayer ?">
            <AlertTriangle size={14} /> Erreur
        </button>
    );

    return (
        <div className="flex items-center gap-2 text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
            <span className="font-bold text-slate-700">Règles v{rules.version}</span>
            <button
                onClick={() => reloadRules()}
                title="Forcer la mise à jour des règles"
                className="hover:bg-white hover:text-blue-600 rounded-full p-0.5 transition-colors"
            >
                <RefreshCw size={12} />
            </button>
        </div>
    );
};

export default RulesStatus;
