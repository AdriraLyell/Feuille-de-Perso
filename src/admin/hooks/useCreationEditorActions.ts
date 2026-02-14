import { RulesData, RulesCreationConfig, RulesCardConfig, RulesXPCosts } from '../../types/rules';

export function useCreationEditorActions(rules: RulesData, onUpdate: (newRules: RulesData) => void) {
    const updateCreationConfig = <K extends keyof RulesCreationConfig>(
        field: K,
        value: RulesCreationConfig[K]
    ) => {
        onUpdate({
            ...rules,
            configurations: {
                ...rules.configurations,
                creation: {
                    ...rules.configurations.creation,
                    [field]: value
                }
            }
        });
    };

    const updatePointsBuckets = (bucket: keyof NonNullable<RulesCreationConfig['pointsBuckets']>, value: number) => {
        const currentBuckets = rules.configurations.creation.pointsBuckets || { attributes: 0, skills: 0, backgrounds: 0 };
        onUpdate({
            ...rules,
            configurations: {
                ...rules.configurations,
                creation: {
                    ...rules.configurations.creation,
                    pointsBuckets: {
                        ...currentBuckets,
                        [bucket]: value
                    }
                }
            }
        });
    };

    const updateCardConfig = <K extends keyof RulesCardConfig>(
        field: K,
        value: RulesCardConfig[K]
    ) => {
        onUpdate({
            ...rules,
            configurations: {
                ...rules.configurations,
                cards: {
                    ...rules.configurations.cards,
                    [field]: value
                }
            }
        });
    };

    const updateXPCost = <K extends keyof RulesXPCosts>(
        field: K,
        value: RulesXPCosts[K]
    ) => {
        onUpdate({
            ...rules,
            configurations: {
                ...rules.configurations,
                xpCosts: {
                    ...rules.configurations.xpCosts,
                    [field]: value
                }
            }
        });
    };

    const updateRankSlot = (rank: number, value: number) => {
        onUpdate({
            ...rules,
            configurations: {
                ...rules.configurations,
                creation: {
                    ...rules.configurations.creation,
                    rankSlots: {
                        ...rules.configurations.creation.rankSlots,
                        [rank]: value
                    }
                }
            }
        });
    };

    const updateRootField = <K extends keyof RulesData>(
        field: K,
        value: RulesData[K]
    ) => {
        onUpdate({
            ...rules,
            [field]: value
        });
    };

    return {
        updateCreationConfig,
        updatePointsBuckets,
        updateCardConfig,
        updateXPCost,
        updateRankSlot,
        updateRootField
    };
}
