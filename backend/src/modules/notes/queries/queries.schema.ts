import { z } from 'zod'

export const findNotesByDaySchema = z.object({
    date: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/, 'Date must use YYYY-MM-DD format'),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
})

export type FindNotesByDayDTO = z.infer<typeof findNotesByDaySchema>
