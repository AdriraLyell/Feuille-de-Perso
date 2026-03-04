import { z } from 'zod';
import { TraitEffectSchema } from './base';

export const LibraryEntrySchema = z.object({
    id: z.string(),
    type: z.enum(['avantage', 'desavantage', 'vertu', 'defaut']),
    name: z.string(),
    cost: z.string().nullable().optional(),
    pointsLabel: z.string().optional().default(''),
    isVariableCost: z.boolean().optional(),
    description: z.string().nullable().optional(),
    tags: z.array(z.string()).nullable().optional(),
    isVariable: z.boolean().optional(),
    hasAutoCounter: z.boolean().optional(),
    autoCounterName: z.string().optional(),
    isXPUpgradeable: z.boolean().optional(),
    variants: z.array(z.string()).nullable().optional(),
    effects: z.array(TraitEffectSchema).nullable().optional(),
    isGlobal: z.boolean().optional(),
    isActive: z.boolean().optional(),
    isLocked: z.boolean().optional(),
    globalUsage: z.number().optional(),
    mysticAbilityId: z.string().optional()
});

export const LibrarySkillEntrySchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    defaultCategory: z.string().nullable().optional(),
    isVariable: z.boolean().optional(),
    variants: z.array(z.string()).nullable().optional(),
    isGlobal: z.boolean().optional(),
    isActive: z.boolean().optional(),
    isLocked: z.boolean().optional(),
    globalUsage: z.number().optional(),
    mysticAbilityId: z.string().nullable().optional(),
    isCustomized: z.boolean().optional(),
    masterDefinition: z.any().optional()
});

export const LibrarySpecializationEntrySchema = z.object({
    id: z.string(),
    name: z.string(),
    skillIds: z.array(z.string()),
    defaultMinLevel: z.number(),
    description: z.string().optional(),
    isImposed: z.boolean().optional()
});

export const LibraryCounterEntrySchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable().optional(),
    maxValue: z.number().nullable().optional(),
    defaultValue: z.number().nullable().optional(),
    xpCost: z.number().nullable().optional(),
    isGlobal: z.boolean().optional(),
    isActive: z.boolean().optional(),
    defaultCategory: z.string().nullable().optional(),
    isNumeric: z.boolean().optional(),
    formula: z.string().optional(),
    formulaId: z.string().optional()
});

export const LibraryFormulaEntrySchema = z.object({
    id: z.string(),
    name: z.string(),
    formula: z.string(),
    type: z.enum(['modifier', 'variable']),
    target: z.string().optional(),
    effectType: z.string().nullable().optional(),
    description: z.string().optional(),
    isGlobal: z.boolean().optional(),
    isActive: z.boolean().optional(),
    aggregateConfig: z.object({
        operation: z.enum(['sum', 'count', 'max', 'avg']),
        targetType: z.enum(['skills', 'attributes', 'traits']),
        filterTarget: z.enum(['category', 'tag', 'name']),
        filterValue: z.string()
    }).optional()
});
