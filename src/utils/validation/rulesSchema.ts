import { z } from 'zod';

// --- Primitives ---

export const TraitEffectSchema = z.object({
    type: z.string(),
    value: z.any().optional(),
    target: z.string().optional(),
    conditions: z.any().optional(),
});

// --- System Libraries ---

export const LibraryEntrySchema = z.object({
    id: z.string(),
    type: z.enum(['avantage', 'desavantage', 'vertu', 'defaut']), // Support legacy terms if needed
    name: z.string(),
    cost: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    tags: z.array(z.string()).nullable().optional(),
    isVariable: z.boolean().nullable().optional(),
    variants: z.array(z.string()).nullable().optional(),
    effects: z.array(TraitEffectSchema).nullable().optional(),
    isGlobal: z.boolean().nullable().optional(),
    isActive: z.boolean().nullable().optional(),
});

export const LibrarySkillEntrySchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    defaultCategory: z.string().nullable().optional(),
    isVariable: z.boolean().nullable().optional(),
    variants: z.array(z.string()).nullable().optional(),
    isGlobal: z.boolean().nullable().optional(),
    isActive: z.boolean().nullable().optional(),
    mysticAbilityId: z.string().nullable().optional(),
});

export const LibrarySpecializationEntrySchema = z.object({
    id: z.string(),
    name: z.string(),
    skillIds: z.array(z.string()).nullable().optional(),
    defaultMinLevel: z.number().nullable().optional(),
    description: z.string().nullable().optional(),
    isGlobal: z.boolean().nullable().optional(),
    isActive: z.boolean().nullable().optional(),
});

export const LibraryBackgroundEntrySchema = LibrarySkillEntrySchema;

export const LibraryCounterEntrySchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    maxValue: z.number().nullable().optional(),
    defaultValue: z.number().nullable().optional(),
    xpCost: z.number().nullable().optional(),
    isGlobal: z.boolean().nullable().optional(),
    isActive: z.boolean().nullable().optional(),
});

// --- Rules Configurations ---

export const RulesCreationConfigSchema = z.object({
    mode: z.enum(['points', 'rangs']),
    startingXP: z.number(),
    pointsDistributionMode: z.enum(['global', 'buckets']).optional(),
    pointsBuckets: z.object({
        attributes: z.number(),
        skills: z.number(),
        backgrounds: z.number(),
    }).optional(),
    attributePoints: z.number().optional(),
    backgroundPoints: z.number().optional(),
    attributeMin: z.number(),
    attributeMax: z.number(),
    attributeCost: z.number().optional(),
    backgroundCost: z.number().optional(),
    rankSlots: z.object({
        1: z.number(),
        2: z.number(),
        3: z.number(),
        4: z.number(),
        5: z.number(),
    }).catchall(z.number()),
    extendedSkills: z.boolean().optional(),
});

export const RulesXPCostsSchema = z.object({
    attributeFactor: z.number(),
    skillFactor: z.number(),
    specializationFactor: z.number(),
    traitCost: z.number().optional().default(5),
});

export const RulesCardConfigSchema = z.object({
    active: z.boolean(),
    baseStart: z.number(),
    increment: z.number(),
    bestSkillsCount: z.number(),
    ranks: z.array(z.string()),
    counts: z.array(z.string()),
    maxLabel: z.string(),
});

export const SkillCategoryConfigSchema = z.object({
    id: z.string(),
    behavior: z.enum(['Compétence', 'Secondaire', 'Arrière-plan', 'Compteur']),
    label: z.string(),
    description: z.string().optional(),
    icon: z.string().optional(),
    allowSpecializations: z.boolean(),
    costConfig: z.object({
        factor: z.number(),
        type: z.enum(['triangular', 'linear']),
    }),
});

export const RulesCounterDefinitionSchema = z.object({
    id: z.string(),
    name: z.string(),
    max: z.number(),
    xpCost: z.number(),
    value: z.number().optional(),
    defaultValue: z.number().optional(),
    description: z.string().optional(),
});

// --- Main Rules Data ---

export const RulesDataSchema = z.object({
    version: z.string(),
    lastUpdated: z.number().optional(),
    configurations: z.object({
        global: z.object({
            maxAttributeScore: z.number(),
            maxSkillScore: z.number(),
            secondaryAttributes: z.boolean().optional(),
        }),
        creation: RulesCreationConfigSchema.passthrough(), // Allow extra props if any
        xpCosts: RulesXPCostsSchema,
        cards: RulesCardConfigSchema,
    }),
    definitions: z.object({
        attributes: z.record(z.string(), z.array(z.string())),
        secondaryAttributes: z.record(z.string(), z.array(z.string())),
        skills: z.record(z.string(), z.array(z.string())),
        skillCategories: z.array(SkillCategoryConfigSchema),
        counters: z.record(z.string(), RulesCounterDefinitionSchema),
        backgrounds: z.array(z.string()),
        labels: z.record(z.string(), z.string()),
    }),
    libraries: z.object({
        traits: z.array(LibraryEntrySchema),
        skills: z.array(LibrarySkillEntrySchema),
        backgrounds: z.array(LibraryBackgroundEntrySchema),
        counters: z.array(LibraryCounterEntrySchema),
        specializations: z.array(LibrarySpecializationEntrySchema),
        mysticAbilities: z.array(LibrarySkillEntrySchema).optional().default([]),
    }),
});

export type RulesDataParsed = z.infer<typeof RulesDataSchema>;
