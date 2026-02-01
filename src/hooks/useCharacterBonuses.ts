import { useMemo } from 'react';
import { TraitEntry, LibraryEntry, BonusInfo } from '../types';

/**
 * Hook chirurgical pour extraire la logique de calcul des bonus d'attributs.
 * Cette logique était auparavant située dans CharacterSheet.tsx.
 */
export const useCharacterBonuses = (
    avantages: TraitEntry[] = [],
    desavantages: TraitEntry[] = [],
    library: LibraryEntry[] = []
) => {
    return useMemo(() => {
        const bonuses: Record<string, BonusInfo> = {};
        const allTraits = [...(avantages || []), ...(desavantages || [])];

        allTraits.forEach(trait => {
            if (!trait.name) return;
            // Find corresponding library entry to get active effects
            const libEntry = library?.find(l => l.name.trim().toLowerCase() === trait.name.trim().toLowerCase());

            if (libEntry && libEntry.effects) {
                libEntry.effects.forEach(effect => {
                    if (effect.type === 'attribute_bonus' && effect.target) {
                        const targetName = effect.target.trim().toLowerCase();

                        if (!bonuses[targetName]) {
                            bonuses[targetName] = { value: 0, sources: [] };
                        }

                        bonuses[targetName].value += effect.value;
                        bonuses[targetName].sources.push(`${trait.name} (${effect.value > 0 ? '+' : ''}${effect.value})`);
                    }
                });
            }
        });
        return bonuses;
    }, [avantages, desavantages, library]);
};
