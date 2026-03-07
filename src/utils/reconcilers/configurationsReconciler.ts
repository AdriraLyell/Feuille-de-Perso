import { CharacterSheetData } from '../../types';
import { RulesData } from '../../types/rules';

/**
 * Synchronizes metadata and global configurations from rules.
 * Updates character info, XP costs, and creation rules.
 * 
 * @param newState - The current draft state being updated
 * @param rules - The new rules to apply
 */
export const reconcileConfigurations = (newState: CharacterSheetData, rules: RulesData) => {
    // 1. Sync Info
    const ruleSettingId = rules.settingId;
    if (ruleSettingId) {
        newState.syncInfo = {
            ...newState.syncInfo,
            settingId: ruleSettingId,
            settingName: rules.settingName || newState.syncInfo?.settingName || 'Inconnue',
            syncId: newState.syncInfo?.syncId || '',
            lastSynced: Date.now()
        };
    }

    const isMigrationPending = !!newState.syncInfo?.pendingAttributeMigration;

    // 2. XP Costs
    if (rules.configurations?.xpCosts) {
        newState.xpCosts = {
            ...newState.xpCosts,
            attributeFactor: isMigrationPending ? (newState.xpCosts?.attributeFactor || 6) : (rules.configurations.xpCosts.attributeFactor || 6),
            skillFactor: rules.configurations.xpCosts.skillFactor || 1,
            specializationFactor: rules.configurations.xpCosts.specializationFactor || 0,
            traitCost: rules.configurations.xpCosts.traitCost || 5
        };
    }

    // 3. Creation Config
    if (rules.configurations?.creation) {
        newState.creationConfig = {
            ...newState.creationConfig,
            ...rules.configurations.creation,
            cardConfig: rules.configurations.cards ? {
                ...newState.creationConfig.cardConfig,
                ...rules.configurations.cards
            } : newState.creationConfig.cardConfig,
            rankSlots: rules.configurations.creation.rankSlots,
            // Preserve attribute rules if a migration is pending
            attributePoints: (isMigrationPending ? newState.creationConfig.attributePoints : rules.configurations.creation.attributePoints) ?? 15,
            attributeMin: isMigrationPending ? newState.creationConfig.attributeMin : rules.configurations.creation.attributeMin,
            attributeMax: isMigrationPending ? newState.creationConfig.attributeMax : rules.configurations.creation.attributeMax,
            attributeCost: (isMigrationPending ? newState.creationConfig.attributeCost : rules.configurations.creation.attributeCost) ?? 6,
            pointsBuckets: isMigrationPending ? {
                ...rules.configurations.creation.pointsBuckets,
                attributes: newState.creationConfig.pointsBuckets?.attributes || 0,
                skills: newState.creationConfig.pointsBuckets?.skills || 0,
                backgrounds: newState.creationConfig.pointsBuckets?.backgrounds || 0
            } : rules.configurations.creation.pointsBuckets
        };
    }

    // 4. Secondary Attributes Toggle
    if (rules.configurations?.global?.secondaryAttributes !== undefined) {
        if (!isMigrationPending) {
            newState.secondaryAttributesActive = rules.configurations.global.secondaryAttributes;
        }
    }
};
