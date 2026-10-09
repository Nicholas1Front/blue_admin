import { z } from 'zod';
import { stringToDate } from '../../../shared/helpers/objects/stringToDateTime.js';

const referenceDateSchema = z.preprocess(
    stringToDate,
    z.date()
);

export const createTransactionSchema = z.object({
    categoryId: z.string().min(1),
    description: z.string().min(1),
    value: z.number().min(1),
    referenceDate: referenceDateSchema,
    originId: z.string().nullable().optional(),
    originType: z.string().nullable().optional()
});

export const updateTransactionSchema = z.object({
    categoryId: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    value: z.number().min(1).optional(),
    referenceDate: referenceDateSchema.optional(),
    originId: z.string().nullable().optional(),
    originType: z.string().nullable().optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message: 'At least one field must be provided to update transaction'
    }
);

export const findTransactionsByFiltersSchema = z.object({
    id: z.string().min(1).optional(),
    categoryId: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    value: z.number().min(1).optional(),
    type: z.string().min(1).optional(),
    referenceDate: referenceDateSchema.optional(),
    originId: z.string().nullable().optional(),
    originType: z.string().nullable().optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message: 'At least one field must be provided to find transaction with filters'
    }
);
