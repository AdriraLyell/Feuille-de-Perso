import React from 'react';
import { RulesCreationConfig } from '../../../types/rules';
import { Sparkles, Lock, Unlock } from 'lucide-react';

interface CreationMysticSettingsProps {
    config: RulesCreationConfig['mysticAbilities'];
    onUpdate: (field: keyof NonNullable<RulesCreationConfig['mysticAbilities']>, value: any) => void;
    onSync?: () => boolean;
}

const CreationMysticSettings: React.FC<CreationMysticSettingsProps> = ({ config, onUpdate, onSync }) => {
    // Default safe values if config is undefined (legacy rules)
    const active = config?.active ?? false;
    const progressionWithoutTrait = config?.progressionWithoutTrait ?? false;
    const skillsPerLevel = config?.skillsPerLevel || { "1": 1, "2": 2, "3": 4, "4": 7, "5": -1 };

    const handleLevelChange = (level: string, value: string) => {
        const numValue = parseInt(value, 10);
        onUpdate('skillsPerLevel', {
            ...skillsPerLevel,
            [level]: isNaN(numValue) ? 0 : numValue
        });
    };

    return (
        <div className="bg-stone-900/40 p-6 rounded border border-stone-700 space-y-6">
            <div className="flex items-center gap-3 mb-4 border-b border-stone-700/50 pb-2">
                <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <Sparkles size={18} />
                </div>
                <h3 className="text-lg font-serif font-bold text-stone-200">Habilités Mystiques</h3>
            </div>

            {/* Main Toggle */}
            <div className="flex items-start gap-4 p-4 bg-stone-800/50 rounded border border-stone-700/50">
                <input
                    type="checkbox"
                    id="mystic_active"
                    checked={active}
                    onChange={(e) => onUpdate('active', e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-stone-600 bg-stone-700 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
                <div className="flex-1">
                    <label htmlFor="mystic_active" className="block text-sm font-medium text-stone-200 cursor-pointer select-none">
                        Lier les Habilités Mystiques aux Avantages
                    </label>
                    <p className="text-xs text-stone-400 mt-1">
                        Si activé, les compétences mystiques nécessitent de posséder l'Avantage correspondant pour être débloquées.
                        Le niveau de l'Avantage détermine le nombre de compétences accessibles.
                    </p>
                </div>
            </div>

            {active && (
                <div className="space-y-6 pl-6 border-l-2 border-purple-500/20 animate-in slide-in-from-left-2 fade-in">

                    {/* Sub Option: Progression Without Trait */}
                    <div className="flex items-start gap-4 p-4 bg-stone-800/30 rounded border border-stone-700/30">
                        <div className={`mt-0.5 ${progressionWithoutTrait ? 'text-green-400' : 'text-amber-400'}`}>
                            {progressionWithoutTrait ? <Unlock size={16} /> : <Lock size={16} />}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <label htmlFor="mystic_progression" className="block text-sm font-medium text-stone-300 cursor-pointer select-none">
                                    Progression sans Avantage (XP)
                                </label>
                                <input
                                    type="checkbox"
                                    id="mystic_progression"
                                    checked={progressionWithoutTrait}
                                    onChange={(e) => onUpdate('progressionWithoutTrait', e.target.checked)}
                                    className="w-4 h-4 rounded border-stone-600 bg-stone-700 text-green-600 focus:ring-green-500 cursor-pointer"
                                />
                            </div>
                            <p className="text-xs text-stone-500 mt-1">
                                <strong>ON (Vert):</strong> Après la création, les joueurs peuvent apprendre de nouvelles compétences mystiques en payant leur coût d'XP standard, sans être limités par le niveau de l'Avantage (capacité dépassable).
                                <br />
                                <strong>OFF (Orange):</strong> Le niveau de l'Avantage limite strictement le nombre de compétences connues, même après la création. Il faut augmenter l'Avantage pour apprendre de nouvelles compétences.
                            </p>
                        </div>
                    </div>

                    {/* Matrix Config */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                            Compétences octroyées par niveau d'Avantage
                        </h4>
                        <div className="grid grid-cols-5 gap-4">
                            {[1, 2, 3, 4, 5].map((level) => (
                                <div key={level} className="space-y-1">
                                    <label className="block text-[10px] text-stone-400 text-center">
                                        Niveau {level}
                                    </label>
                                    <input
                                        type="number"
                                        value={skillsPerLevel[level.toString()] ?? (level === 5 ? -1 : level)}
                                        onChange={(e) => handleLevelChange(level.toString(), e.target.value)}
                                        className="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1 text-center text-sm text-stone-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                                    />
                                    <div className="text-[9px] text-stone-500 text-center">
                                        {(skillsPerLevel[level.toString()] === -1) ? 'Infini' : 'slots'}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-stone-500 mt-2 italic text-center">
                            Utilisez -1 pour "Infini"
                        </p>
                    </div>

                    {/* Sync Button */}
                    <div className="pt-4 border-t border-stone-700/50">
                        <button
                            onClick={() => {
                                if (onSync) {
                                    const changed = onSync();
                                    if (changed) {
                                        alert("Synchronisation réussie ! Les Avantages correspondants ont été créés ou mis à jour.");
                                    } else {
                                        alert("Tous les Avantages sont déjà synchronisés.");
                                    }
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 rounded text-sm font-bold transition-colors"
                        >
                            <Sparkles size={14} /> Synchroniser les Avantages manquants
                        </button>
                        <p className="text-[10px] text-stone-500 mt-2">
                            Parcourt la bibliothèque des habilités mystiques pour créer automatiquement les Avantages (Traits) liés s'ils n'existent pas encore.
                        </p>
                    </div>

                </div>
            )}
        </div>
    );
};

export default CreationMysticSettings;
