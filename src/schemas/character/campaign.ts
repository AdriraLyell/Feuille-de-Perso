import { z } from 'zod';

export const BookDocumentSchema = z.object({
    id: z.string().optional(),
    content: z.any(),
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
    filterTarget: z.string().optional(),
    filterValue: z.string().optional(),
    description: z.string().optional()
});
