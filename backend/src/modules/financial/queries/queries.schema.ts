import {z} from 'zod';

export const monthlySummaryQuerySchema = z.object({
    year : z.coerce.number().int().min(1).max(9999),
    month : z.coerce.number().int().min(1).max(12),
    limit : z.coerce.number().int().min(1).max(100).default(5)
});

export type MonthlySummaryQuery = z.infer<typeof monthlySummaryQuerySchema>;

export const yearlySummaryQuerySchema = z.object({
    year : z.coerce.number().int().min(1).max(9999)
});

export type YearlySummaryQuery = z.infer<typeof yearlySummaryQuerySchema>;

export const periodSummaryQuerySchema = z.object({
    start : z.iso.date(),
    end : z.iso.date(),
    limit : z.coerce.number().int().min(1).max(100).default(5)
}).refine(
    filters => filters.start <= filters.end,
    {
        message : 'The start date must be before or equal to the end date',
        path : ['end']
    }
);

export type PeriodSummaryQuery = z.infer<typeof periodSummaryQuerySchema>;
