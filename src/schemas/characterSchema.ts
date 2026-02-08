import { z } from 'zod';

// --- Primitives ---

export const DotEntrySchema = z.object({
    id: z.string(),
    name: z.string(),
    value: z.number(),
    creationValue: z.number().optional(),
    current: z.number().optional(),
    max: z.number(),
    variant: z.string().optional()
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
    eyes: z.string()
});

export const SyncInfoSchema = z.object({
    settingId: z.string().optional(),
    settingName: z.string().optional(),
    syncId: z.string().optional(),
    lastSynced: z.number().optional()
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
    value: z.string()
});

export const TraitEffectSchema = z.object({
    id: z.string(),
    type: z.enum(['xp_bonus', 'free_skill_rank', 'attribute_bonus']),
    value: z.number(),
    target: z.string().optional()
});

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
    })
});

export const ThemeConfigSchema = z.object({
    creationColor: z.string(),
    xpColor: z.string(),
    dotSymbol: z.string().optional()
});

export const ExperienceDataSchema = z.object({
    gain: z.string(),
    spent: z.string(),
    rest: z.string()
});

export const XPEntrySchema = z.object({
    id: z.string(),
    date: z.string(),
    scenario: z.string(),
    spendingLocation: z.string().optional(),
    amount: z.number(),
    mj: z.string()
});

export const LibraryEntrySchema = z.object({
    id: z.string(),
    type: z.enum(['avantage', 'desavantage']),
    name: z.string(),
    cost: z.string(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
    effects: z.array(TraitEffectSchema).optional()
});

export const LibrarySkillEntrySchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    defaultCategory: z.string().optional(),
    isVariable: z.boolean().optional()
});

export const LibrarySpecializationEntrySchema = z.object({
    id: z.string(),
    name: z.string(),
    skillIds: z.array(z.string()),
    defaultMinLevel: z.number(),
    description: z.string().optional()
});

export const LogEntrySchema = z.object({
    id: z.string(),
    timestamp: z.string(),
    message: z.string(),
    type: z.enum(['success', 'danger', 'info']),
    category: z.enum(['sheet', 'settings', 'both']),
    deduplicationId: z.string().optional()
});

// --- Campaign ---

export const ImageConfigSchema = z.object({
    width: z.number(),
    height: z.number(),
    marginTop: z.number(),
    align: z.enum(['left', 'right']),
    x: z.number().optional(),
    y: z.number().optional(),
    mode: z.enum(['flow', 'absolute']).optional(),
    fit: z.enum(['cover', 'contain', 'fill']).optional()
});

export const NoteImageSchema = z.object({
    id: z.string(),
    imageId: z.string(),
    config: ImageConfigSchema
});

export const CampaignNoteEntrySchema = z.object({
    id: z.string(),
    date: z.string(),
    title: z.string(),
    content: z.string(),
    imageId: z.string().optional(),
    imageConfig: ImageConfigSchema.optional(),
    images: z.array(NoteImageSchema).optional()
});

export const PartyColumnSchema = z.object({
    id: z.string(),
    label: z.string(),
    width: z.number().optional()
});

export const PartyMemberEntrySchema = z.object({
    id: z.string(),
    name: z.string(),
    player: z.string(),
    data: z.record(z.string(), z.string())
});

export const ImposedSpecializationSchema = z.object({
    name: z.string(),
    minLevel: z.number()
});

// --- Main Schema ---

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
    library: z.array(LibraryEntrySchema),
    skillLibrary: z.array(LibrarySkillEntrySchema),
    specializationLibrary: z.array(LibrarySpecializationEntrySchema).optional(),
    xpLogs: z.array(XPEntrySchema),
    appLogs: z.array(LogEntrySchema),
    campaignNotes: z.array(CampaignNoteEntrySchema),
    partyNotes: z.object({
        members: z.array(PartyMemberEntrySchema),
        columns: z.array(PartyColumnSchema),
        staticColWidths: z.object({
            character: z.number(),
            player: z.number()
        }).optional()
    }),
    appVersion: z.string().optional(),
    syncInfo: SyncInfoSchema.optional()
});

export type ValidatedCharacterData = z.infer<typeof CharacterSheetDataSchema>;

/**
 * Valide les données et retourne l'objet validé ou lance une erreur détaillée.
 */
export const validateCharacterData = (data: unknown): ValidatedCharacterData => {
    return CharacterSheetDataSchema.parse(data);
};

/**
 * Tentative de validation silencieuse.
 */
export const safeValidateCharacterData = (data: unknown) => {
    return CharacterSheetDataSchema.safeParse(data);
};
