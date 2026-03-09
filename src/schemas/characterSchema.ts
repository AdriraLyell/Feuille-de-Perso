import { z } from 'zod';
import {
    DotEntrySchema,
    AttributeEntrySchema,
    AttributeCategoryDefSchema,
    HeaderInfoSchema,
    SyncInfoSchema,
    CombatEntrySchema,
    ReputationEntrySchema,
    TraitEntrySchema,
    ExperienceDataSchema,
    XPEntrySchema,
    XPTransactionSchema,
    LogEntrySchema,
    ImposedSpecializationSchema,
    PostItDataSchema
} from './character/base';

import {
    LibraryEntrySchema,
    LibrarySkillEntrySchema,
    LibrarySpecializationEntrySchema,
    LibraryCounterEntrySchema,
    LibraryFormulaEntrySchema
} from './character/libraries';

import {
    BookDocumentSchema,
    CampaignNoteEntrySchema,
    FormulaMacroSchema,
    FormulaVariableSchema,
    PartyColumnSchema,
    PartyMemberEntrySchema
} from './character/campaign';

// Re-exports
export * from './character/base';
export * from './character/libraries';
export * from './character/campaign';

// --- System ---

export const CreationConfigSchema = z.object({
    active: z.boolean(),
    mode: z.enum(['points', 'rangs']),
    pointsDistributionMode: z.enum(['global', 'buckets']).optional(),
    startingXP: z.number(),
    pointsBuckets: z.object({
        attributes: z.number(),
        skills: z.number(),
        backgrounds: z.number()
    }).optional(),
    attributePoints: z.number(),
    attributeCost: z.number(),
    attributeMin: z.number(),
    attributeMax: z.number(),
    backgroundPoints: z.number(),
    rankSlots: z.object({
        "1": z.number(),
        "2": z.number(),
        "3": z.number(),
        "4": z.number(),
        "5": z.number()
    }),
    cardConfig: z.object({
        active: z.boolean(),
        bestSkillsCount: z.number(),
        increment: z.number(),
        baseStart: z.number()
    }),
    extendedSkills: z.boolean().optional(),
    backgroundCost: z.number().optional(),
    bonusMJ: z.number().optional().default(5)
});

export const ThemeConfigSchema = z.object({
    creationColor: z.string(),
    xpColor: z.string(),
    dotSymbol: z.string().optional(),
    skillColors: z.object({
        variable: z.string().optional(),
        mysticDefault: z.string().optional(),
        mysticOverrides: z.record(z.string(), z.string()).optional()
    }).optional()
});

export const Page2DataSchema = z.object({
    lieux_importants: z.string(),
    contacts: z.string(),
    reputation: z.array(ReputationEntrySchema),
    connaissances: z.string(),
    valeurs_monetaires: z.string(),
    armes_list: z.string(),
    avantages: z.array(TraitEntrySchema),
    desavantages: z.array(TraitEntrySchema),
    equipement: z.string(),
    notes: z.string(),
    characterImage: z.string().optional(),
    characterImageId: z.string().optional()
});

export const CharacterSheetDataSchema = z.object({
    creationConfig: CreationConfigSchema,
    theme: ThemeConfigSchema,
    header: HeaderInfoSchema,
    attributes: z.record(z.string(), z.array(AttributeEntrySchema)),
    secondaryAttributes: z.record(z.string(), z.array(AttributeEntrySchema)),
    secondaryAttributesActive: z.boolean(),
    attributeSettings: z.array(AttributeCategoryDefSchema),
    xpCosts: z.object({
        attributeFactor: z.number(),
        skillFactor: z.number(),
        specializationFactor: z.number(),
        traitCost: z.number().optional()
    }).optional(),
    skills: z.record(z.string(), z.array(DotEntrySchema)),
    combat: z.object({
        weapons: z.array(CombatEntrySchema),
        armor: z.array(z.object({
            type: z.string(),
            protection: z.string(),
            weight: z.string()
        })),
        stats: z.object({
            agility: z.string(),
            dexterity: z.string(),
            force: z.string(),
            size: z.string()
        })
    }),
    counters: z.object({
        volonte: DotEntrySchema,
        confiance: DotEntrySchema,
        custom: z.array(DotEntrySchema)
    }),
    experience: ExperienceDataSchema,
    page2: Page2DataSchema,
    specializations: z.record(z.string(), z.array(z.string())),
    imposedSpecializations: z.record(z.string(), z.array(ImposedSpecializationSchema)),
    library: z.array(LibraryEntrySchema).optional().default([]),
    skillLibrary: z.array(LibrarySkillEntrySchema).optional().default([]),
    specializationLibrary: z.array(LibrarySpecializationEntrySchema).optional().default([]),
    backgroundLibrary: z.array(LibrarySkillEntrySchema).optional().default([]),
    counterLibrary: z.array(LibraryCounterEntrySchema).optional().default([]),
    postIts: z.array(PostItDataSchema).optional().default([]),
    xpLogs: z.array(XPEntrySchema).optional().default([]),
    xpTransactions: z.array(XPTransactionSchema).optional().default([]),
    appLogs: z.array(LogEntrySchema).optional().default([]),
    campaignNotes: z.array(CampaignNoteEntrySchema).optional().default([]),
    bookDocument: BookDocumentSchema.optional(),
    partyNotes: z.object({
        members: z.array(PartyMemberEntrySchema),
        columns: z.array(PartyColumnSchema),
        staticColWidths: z.object({
            character: z.number(),
            player: z.number()
        }).optional()
    }).optional(),
    appVersion: z.string().optional(),
    syncInfo: SyncInfoSchema.optional(),
    mysticAbilities: z.array(LibrarySkillEntrySchema).optional().default([]),
    formulaMacros: z.array(FormulaMacroSchema).optional().default([]),
    formulaVariables: z.array(FormulaVariableSchema).optional().default([]),
    formulaLibrary: z.array(LibraryFormulaEntrySchema).optional().default([]),
    suggestions: z.array(z.any()).optional().default([]),
    _rulesVersion: z.string().optional(),
    _rulesLastUpdated: z.number().optional(),
    activeLayout: z.object({
        lg: z.array(z.object({
            i: z.string(),
            x: z.number(),
            y: z.number(),
            w: z.number(),
            h: z.number(),
            minW: z.number().optional(),
            minH: z.number().optional()
        })).optional(),
        md: z.array(z.object({
            i: z.string(),
            x: z.number(),
            y: z.number(),
            w: z.number(),
            h: z.number(),
            minW: z.number().optional(),
            minH: z.number().optional()
        })).optional(),
        sm: z.array(z.object({
            i: z.string(),
            x: z.number(),
            y: z.number(),
            w: z.number(),
            h: z.number(),
            minW: z.number().optional(),
            minH: z.number().optional()
        })).optional()
    }).optional(),
    layoutConfigs: z.record(z.string(), z.any()).optional(),
    _schemaVersion: z.number().optional(),
    attributeMigrationMode: z.boolean().optional()
});

export type ValidatedCharacterData = z.infer<typeof CharacterSheetDataSchema>;

export const validateCharacterData = (data: unknown): ValidatedCharacterData => {
    return CharacterSheetDataSchema.parse(data);
};

export const safeValidateCharacterData = (data: unknown) => {
    return CharacterSheetDataSchema.safeParse(data);
};
