```
import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useCharacterState } from '../../context/CharacterContext';
import { useRules } from '../../context/RulesContext';

export const CreationGuidance: React.FC = () => {
    const { data } = useCharacterState();
    const { rules } = useRules();
    const [isVisible, setIsVisible] = useState(true);

    // Check configuration
    const mysticConfig = rules?.configurations?.creation?.mysticAbilities;
    const isMysticActive = mysticConfig?.active;

    // Check if user already has a mystic trait
    const hasMysticTrait = data.page2.avantages.some(t => t.mysticAbilityId);

    // Logic: Active feature AND no mystic trait selected yet
    const shouldShow = isMysticActive && !hasMysticTrait && isVisible;

    if (!shouldShow) return null;

    return (
        <div className="fixed bottom-[140px] xl:bottom-[130px] left-0 right-0 z-[89] flex justify-center pointer-events-none animate-in slide-in-from-bottom-4 duration-700 delay-500 no-print">
            <div className="pointer-events-auto bg-gradient-to-r from-amber-700/90 via-amber-600/90 to-amber-700/90 backdrop-blur-md text-amber-50 px-6 py-2 rounded-t-lg shadow-[0_-4px_15px_rgba(245,158,11,0.3)] border-t border-x border-amber-400/30 flex items-center gap-4 max-w-3xl mx-4">
                <div className="bg-amber-100/20 p-1.5 rounded-full animate-pulse-slow">
                    <Sparkles size={16} className="text-amber-200" />
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                    <span className="font-serif font-bold text-amber-200 uppercase tracking-wider text-xs whitespace-nowrap">
                        Conseil de l'Oracle
                    </span>
                    <span className="hidden md:inline text-amber-400/50">|</span>
                    <span className="text-sm font-medium leading-tight">
                        Configurez vos <strong className="text-white">Habilités Mystiques</strong> (Avantages) pour révéler les compétences liées.
                    </span>
                </div>

                <button
                    onClick={() => setIsVisible(false)}
                    className="ml-2 p-1 hover:bg-amber-800/50 rounded-full transition-colors text-amber-200/70 hover:text-white"
                    title="Masquer le conseil"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
};
