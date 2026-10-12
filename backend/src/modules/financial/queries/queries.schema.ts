import {z} from 'zod';

export const monthlySummaryQuerySchema = z.object({
    year : z.coerce.number().int().min(1).max(9999),
    month : z.coerce.number().int().min(1).max(12),
    limit : z.coerce.number().int().min(1).max(100).default(5)
});

export type MonthlySummaryQuery = z.infer<typeof monthlySummaryQuerySchema>;
