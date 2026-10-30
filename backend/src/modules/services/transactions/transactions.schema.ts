import {z} from 'zod';

export const findAvailableTransactionsSchema = z.object({
    year: z.coerce.number().int().min(1).max(9999).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(8),
    categoryId: z.string().min(1).optional(),
    value: z.coerce.number().min(1).optional(),
    type: z.enum(['income', 'expense']).optional(),
    search: z.string().trim().min(1).optional()
}).refine(
    filters => filters.month === undefined || filters.year !== undefined,
    {
        message: 'Year is required when filtering by month',
        path: ['year']
    }
);

export type FindAvailableTransactionsQuery = z.infer<typeof findAvailableTransactionsSchema>;

export const updateTransactionsOriginSchema = z.object({
    id : z.string().min(1)
})

//DTos

export type updateTransactionsOriginDTO = z.infer<typeof updateTransactionsOriginSchema>