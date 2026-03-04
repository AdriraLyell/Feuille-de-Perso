import { z } from 'zod';

export const DotEntrySchema = z.object({
    id: z.string(),
    name: z.string(),
    value: z.number(),
    creationValue: z.number().optional(),
    current: z.number().optional(),
    max: z.number(),
    variant: z.string().optional(),
    definitionId: z.string().optional(),
    mysticAbilityId: z.string().optional(),
    description: z.string().optional(),
    tag: z.string().optional()
});

export const AttributeEntrySchema = z.object({
    id: z.string(),
    name: z.string(),
    val1: z.string(),
    val2: z.string(),
    val3: z.string(),
    creationVal1: z.number().optional(),
    creationVal2: z.number().optional(),
    creationVal3: z.number().optional()
});

export const AttributeCategoryDefSchema = z.object({
    id: z.string(),
    label: z.string()
});

export const HeaderInfoSchema = z.object({
    name: z.string(),
    age: z.string(),
    sex: z.string(),
    player: z.string(),
    born: z.string(),
    height: z.string(),
    chronicle: z.string(),
    nature: z.string(),
    hair: z.string(),
    status: z.string(),
    conduct: z.string(),
    eyes: z.string(),
    campaignStartDate: z.string().optional(),
    fictionCurrentDate: z.string().optional()
});

export const SyncInfoSchema = z.object({
    settingId: z.string().optional(),
    settingName: z.string().optional(),
    syncId: z.string().optional(),
    lastSynced: z.number().optional(),
    isAutoSyncEnabled: z.boolean().optional(),
    localSettings: z.object({
        expertMode: z.boolean().optional(),
        activeRulesId: z.string().optional()
    }).optional()
});

export const CombatEntrySchema = z.object({
    id: z.string(),
    weapon: z.string(),
    level: z.string(),
    init: z.string(),
    attack: z.string(),
    damage: z.string(),
    parry: z.string()
});

export const ReputationEntrySchema = z.object({
    reputation: z.string(),
    lieu: z.string(),
    valeur: z.string()
});

export const TraitEntrySchema = z.object({
    name: z.string(),
    value: z.string(),
    description: z.string().optional(),
    tag: z.string().optional(),
    variant: z.string().optional(),
    definitionId: z.string().optional(),
    mysticAbilityId: z.string().optional(),
    associatedCounterId: z.string().optional(),
    hasAutoCounter: z.boolean().optional(),
    autoCounterName: z.string().optional(),
    isXPUpgradeable: z.boolean().optional(),
    masterSkillTarget: z.string().optional(),
    isPostCreation: z.boolean().optional(),
    creationValue: z.string().optional()
});

export const TraitEffectSchema = z.object({
    id: z.string().default(() => Math.random().toString(36).substr(2, 9)),
    type: z.enum(['free_skill_rank', 'master_skill', 'block_skill_increase', 'formula']),
    value: z.number().optional(),
    method: z.enum(['fixed', 'per_scenario']).optional(),
    target: z.string().optional(),
    source: z.string().optional(),
    associatedCounterId: z.string().optional(),
    formula: z.string().optional(),
    formulaId: z.string().optional()
});

export const ExperienceDataSchema = z.object({
    gain: z.string(),
    spent: z.string(),
    rest: z.string()
});

export const LogEntrySchema = z.object({
    id: z.string(),
    timestamp: z.string(),
    message: z.string(),
    type: z.enum(['success', 'danger', 'info']),
    category: z.enum(['sheet', 'settings', 'both']),
    deduplicationId: z.string().optional()
});

export const XPEntrySchema = z.object({
    id: z.string(),
    date: z.string().nullable().optional(),
    scenario: z.string().nullable().optional(),
    spendingLocation: z.string().nullable().optional(),
    amount: z.preprocess((val) => Number(val), z.number()),
    mj: z.string().nullable().optional(),
    countsAsScenario: z.boolean().optional()
});

export const XPTransactionSchema = z.object({
    id: z.string(),
    timestamp: z.string(),
    type: z.enum(['earn', 'spend', 'refund']),
    description: z.string(),
    amount: z.number(),
    source: z.string().optional(),
    relatedId: z.string().optional()
});

export const ImposedSpecializationSchema = z.object({
    name: z.string(),
    minLevel: z.number()
});
