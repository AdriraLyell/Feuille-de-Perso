import { LibraryEntry, TraitEffect } from '../../types';

/**
 * Migre les propriétés héritées (legacy effects) vers les nouvelles propriétés directes du trait.
 * supporte hasAutoCounter, autoCounterName et isXPUpgradeable.
 */
export function migrateTraitProperties(trait: LibraryEntry): LibraryEntry {
    const effects = [...(trait.effects || [])];

    // Initialiser avec les valeurs existantes ou défauts
    let hasAutoCounter = trait.hasAutoCounter || false;
    let autoCounterName = trait.autoCounterName;
    let isXPUpgradeable = trait.isXPUpgradeable || false;

    let hasChanges = false;

    // Parcourir les effets à l'envers pour pouvoir les supprimer
    for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i] as TraitEffect;

        if (effect.type === 'auto_counter') {
            hasAutoCounter = true;
            if (!autoCounterName) {
                // @ts-ignore - target can exist on legacy effect
                autoCounterName = effect.target || (effect as any).associatedCounterId;
            }
            effects.splice(i, 1);
            hasChanges = true;
        } else if (effect.type === 'xp_upgradeable') {
            isXPUpgradeable = true;
            effects.splice(i, 1);
            hasChanges = true;
        }
    }

    if (!hasChanges) return trait;

    return {
        ...trait,
        hasAutoCounter,
        autoCounterName,
        isXPUpgradeable,
        effects: effects as any
    };
}

/**
 * Migre une liste complète de traits.
 */
export function migrateTraitLibrary(traits: LibraryEntry[]): LibraryEntry[] {
    return traits.map(migrateTraitProperties);
}
