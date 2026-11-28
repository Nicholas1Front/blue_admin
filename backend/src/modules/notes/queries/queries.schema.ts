import { z } from 'zod'

const dateSchema = z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format')
    .refine(value => {
        const [year, month, day] = value.split('-').map(Number)
        const date = new Date(Date.UTC(year, month - 1, day))
        return date.getUTCFullYear() === year
            && date.getUTCMonth() === month - 1
            && date.getUTCDate() === day
    }, 'Date is invalid')

export const findNotesByDaySchema = z.object({
    date: dateSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
})

export type FindNotesByDayDTO = z.infer<typeof findNotesByDaySchema>
