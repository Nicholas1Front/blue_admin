import { z } from 'zod'

const noteReferenceSchema = z.object({
    entityType: z.enum([
        'service',
        'financial_transaction',
        'budget',
        'vehicle',
        'client',
        'equipament',
        'user'
    ]),
    entityId: z.string().trim().min(1)
})

const queryBoolean = z.preprocess(value => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
}, z.boolean())

const uniqueReferences = (references: Array<{ entityType: string; entityId: string }>) =>
    new Set(references.map(reference => `${reference.entityType}:${reference.entityId}`)).size === references.length

export const createNoteSchema = z.object({
    title: z.string().trim().min(1).max(150),
    content: z.string().trim().min(1),
    happenedAt: z.coerce.date().optional(),
    folderId: z.string().min(1).nullable().optional(),
    isPinned: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    references: z.array(noteReferenceSchema).refine(uniqueReferences, {
        message: 'Note references must be unique'
    }).optional()
})

export const updateNoteSchema = z.object({
    title: z.string().trim().min(1).max(150).optional(),
    content: z.string().trim().min(1).optional(),
    happenedAt: z.coerce.date().optional(),
    folderId: z.string().min(1).nullable().optional(),
    isPinned: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    references: z.array(noteReferenceSchema).refine(uniqueReferences, {
        message: 'Note references must be unique'
    }).optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update note'
})

export const findNotesSchema = z.object({
    search: z.string().trim().min(1).optional(),
    folderId: z.string().min(1).optional(),
    withoutFolder: queryBoolean.optional(),
    isPinned: queryBoolean.optional(),
    isArchived: queryBoolean.default(false),
    happenedFrom: z.coerce.date().optional(),
    happenedTo: z.coerce.date().optional(),
    referenceType: noteReferenceSchema.shape.entityType.optional(),
    referenceId: z.string().min(1).optional()
})

export type CreateNoteDTO = z.infer<typeof createNoteSchema>
export type UpdateNoteDTO = z.infer<typeof updateNoteSchema>
export type FindNotesDTO = z.infer<typeof findNotesSchema>
export type NoteReferenceDTO = z.infer<typeof noteReferenceSchema>
