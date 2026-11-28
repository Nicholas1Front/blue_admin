import { z } from 'zod'

export const createFolderSchema = z.object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().min(1).nullable().optional()
})

export const updateFolderSchema = z.object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().min(1).nullable().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided to update folder'
})

export type CreateFolderDTO = z.infer<typeof createFolderSchema>
export type UpdateFolderDTO = z.infer<typeof updateFolderSchema>
