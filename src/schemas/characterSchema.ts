import { z } from 'zod';

// --- Primitives ---

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
    value: z.number(),
    method: z.enum(['fixed', 'per_scenario']).optional(),
    target: z.string().optional(),
    source: z.string().optional(),
    associatedCounterId: z.string().optional(),
    formula: z.string().optional(),
    formulaId: z.string().optional()
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
    }),
    extendedSkills: z.boolean().optional(),
    backgroundCost: z.number().optional()
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

export const ExperienceDataSchema = z.object({
    gain: z.string(),
    spent: z.string(),
    rest: z.string()
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
    timestamp: z.string(), // ISO string with time
    type: z.enum(['earn', 'spend', 'refund']),
    description: z.string(),
    amount: z.number(),
    source: z.string().optional(),
    relatedId: z.string().optional()
});


export const LibraryEntrySchema = z.object({
    id: z.string(),
    type: z.enum(['avantage', 'desavantage', 'vertu', 'defaut']), // Added legacy support
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
    description: z.string().optional()
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
    formulaId: z.string().optional() // ID de la formule globale à utiliser pour le Max
});

export const LibraryBackgroundEntrySchema = LibrarySkillEntrySchema;


export const LogEntrySchema = z.object({
    id: z.string(),
    timestamp: z.string(),
    message: z.string(),
    type: z.enum(['success', 'danger', 'info']),
    category: z.enum(['sheet', 'settings', 'both']),
    deduplicationId: z.string().optional()
});

// --- Campaign ---

export const BookDocumentSchema = z.object({
    id: z.string().optional(),
    content: z.any(), // Tiptap JSONContent is too complex for strict Zod validation
    formatVersion: z.number(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional()
});

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

// --- Formulas ---

export const FormulaMacroSchema = z.object({
    id: z.string(),
    name: z.string(),
    formula: z.string(),
    description: z.string().optional()
});

export const FormulaVariableSchema = z.object({
    id: z.string(),
    name: z.string(),
    operation: z.enum(['sum', 'count', 'highest', 'average']),
    target: z.enum(['skills', 'attributes', 'traits', 'specializations', 'mysticAbilities']),
    filterTarget: z.string().optional(), // 'category', 'tag', 'name'
    filterValue: z.string().optional(),  // e.g. "Habiletés Mystiques" or "Artisanat"
    description: z.string().optional()
});

export const LibraryFormulaEntrySchema = z.object({
    id: z.string(),
    name: z.string(),
    formula: z.string(),
    type: z.enum(['modifier', 'variable']), // 'modifier' = Affecte une carac, 'variable' = Calcul pur
    target: z.string().optional(),
    effectType: z.string().optional(),
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
    formulaLibrary: z.array(LibraryFormulaEntrySchema).optional().default([]), // Nouveau : Dictionnaire central
    suggestions: z.array(z.any()).optional().default([]),
    _rulesVersion: z.string().optional(),
    _schemaVersion: z.number().optional()
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
