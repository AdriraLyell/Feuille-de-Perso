import { LibraryEntry } from '../../types';

export interface TraitMigrationInfo {
    id: string;
    name: string;
    changes: string[];
}

export interface LibraryMigrationResult {
    traits: LibraryEntry[];
    stats: {
        traitsMigrated: number;
        details: TraitMigrationInfo[];
    };
}

/**
 * Migre les propriétés héritées (legacy effects) vers les nouvelles propriétés directes du trait.
 * Retourne le trait (migré ou non) et la liste des changements effectués.
 */
export function migrateTraitProperties(trait: LibraryEntry): { trait: LibraryEntry, changes: string[] } {
    const effects = [...(trait.effects || [])];
    const changes: string[] = [];

    // Initialiser avec les valeurs existantes ou défauts
    let hasAutoCounter = trait.hasAutoCounter || false;
    let autoCounterName = trait.autoCounterName;
    let isXPUpgradeable = trait.isXPUpgradeable || false;

    let hasChanges = false;

    // Parcourir les effets à l'envers pour pouvoir les supprimer
    for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];

        if (effect.type === 'auto_counter') {
            hasAutoCounter = true;
            if (!autoCounterName) {
                autoCounterName = effect.target || (effect as unknown as Record<string, string>).associatedCounterId;
            }
            effects.splice(i, 1);
            hasChanges = true;
            changes.push(`Compteur Auto -> Propriété (Nom: ${autoCounterName || 'Par défaut'})`);
        } else if (effect.type === 'xp_upgradeable') {
            isXPUpgradeable = true;
            effects.splice(i, 1);
            hasChanges = true;
            changes.push('Éligibilité XP -> Propriété');
        }
    }

    if (!hasChanges) return { trait, changes: [] };

    return {
        trait: {
            ...trait,
            hasAutoCounter,
            autoCounterName,
            isXPUpgradeable,
            effects
        },
        changes
    };
}

/**
 * Migre une liste complète de traits et retourne les statistiques détaillées.
 */
export function migrateTraitLibrary(traits: LibraryEntry[]): LibraryMigrationResult {
    const details: TraitMigrationInfo[] = [];
    const updatedTraits = traits.map(t => {
        const { trait: migrated, changes } = migrateTraitProperties(t);
        if (changes.length > 0) {
            details.push({
                id: migrated.id,
                name: migrated.name,
                changes
            });
        }
        return migrated;
    });

    return {
        traits: updatedTraits,
        stats: {
            traitsMigrated: details.length,
            details
        }
    };
}

