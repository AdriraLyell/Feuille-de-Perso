
import React, { useEffect, useState } from 'react';
import { GameSettingSummary } from '../services/AdminService';
import { PlayerService } from '../services/PlayerService';
import { Cloud, Wifi, WifiOff, FileJson, Loader2, ArrowRight } from 'lucide-react';
import { RulesData } from '../types/rules';

interface RulesSourceSelectorProps {
    isOpen: boolean;
    onSelectSource: (sourceType: 'online' | 'offline', rules?: RulesData, settingId?: string) => void;
    onClose?: () => void; // Optional if non-blocking
}

const RulesSourceSelector: React.FC<RulesSourceSelectorProps> = ({ isOpen, onSelectSource }) => {
    const [publicSettings, setPublicSettings] = useState<GameSettingSummary[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'initial' | 'online_list'>('initial');

    // Try to load public settings when opening online mode
    const handleOnlineClick = async () => {
        setIsLoading(true);
        const settings = await PlayerService.listPublicSettings();
        setPublicSettings(settings);
        setMode('online_list');
        setIsLoading(false);
    };

    const handleSettingClick = async (setting: GameSettingSummary) => {
        setIsLoading(true);
        const rules = await PlayerService.loadSetting(setting.id);
        if (rules) {
            onSelectSource('online', rules, setting.id);
        } else {
            alert("Erreur de chargement du setting.");
        }
        setIsLoading(false);
    };

    const handleOfflineClick = () => {
        // Just notify parent we want offline. Parent handles loading defaults/cache.
        onSelectSource('offline');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 font-sans">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-700">
                <div className="bg-slate-900 text-white p-6 text-center">
                    <h2 className="text-2xl font-bold tracking-wide flex items-center justify-center gap-3">
                        <Cloud className="text-blue-400" />
                        Source des Règles
                    </h2>
                    <p className="text-slate-400 mt-2 text-sm">Choisissez comment charger les données de jeu.</p>
                </div>

                <div className="p-6">
                    {mode === 'initial' && (
                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={handleOnlineClick}
                                className="group flex items-center justify-between p-4 rounded-lg border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-100 p-3 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Wifi size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">Campagnes en Ligne</h3>
                                        <p className="text-slate-500 text-sm">Parcourir les campagnes publiques (Base de Données).</p>
                                    </div>
                                </div>
                                <ArrowRight className="text-slate-300 group-hover:text-blue-500" />
                            </button>

                            <button
                                onClick={handleOfflineClick}
                                className="group flex items-center justify-between p-4 rounded-lg border-2 border-slate-200 hover:border-amber-500 hover:bg-amber-50 transition-all text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="bg-amber-100 p-3 rounded-full text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                        <WifiOff size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">Mode Hors Ligne</h3>
                                        <p className="text-slate-500 text-sm">Utiliser les règles par défaut ou un fichier local.</p>
                                    </div>
                                </div>
                                <ArrowRight className="text-slate-300 group-hover:text-amber-500" />
                            </button>
                        </div>
                    )}

                    {mode === 'online_list' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <button onClick={() => setMode('initial')} className="text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1">
                                    &larr; Retour
                                </button>
                                <span className="text-xs font-bold text-slate-500 uppercase">Campagnes Disponibles</span>
                            </div>

                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="animate-spin text-blue-500" size={32} />
                                </div>
                            ) : (
                                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                                    {publicSettings.length === 0 ? (
                                        <div className="text-center py-6 text-slate-400 italic bg-gray-50 rounded">
                                            Aucune campagne publique trouvée.
                                        </div>
                                    ) : (
                                        publicSettings.map(setting => (
                                            <button
                                                key={setting.id}
                                                onClick={() => handleSettingClick(setting)}
                                                className="w-full flex items-center justify-between p-3 rounded border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                                            >
                                                <div>
                                                    <div className="font-bold text-slate-800">{setting.name}</div>
                                                    <div className="text-xs text-slate-500 flex gap-2">
                                                        <span>v{setting.version}</span>
                                                        <span>•</span>
                                                        <span>{new Date(setting.last_updated).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                                <Cloud size={16} className="text-slate-300" />
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RulesSourceSelector;
