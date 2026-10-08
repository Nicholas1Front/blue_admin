import {z} from 'zod';

export const createTransactionSchema = z.object({
    categoryId : z.string().min(1),
    description : z.string().min(1),
    value : z.number().min(1),
    type : z.enum(['income', 'expense']),
    referenceDate : z.date(),
    originId : z.string().nullable().optional(),
    originType : z.string().nullable().optional()
})

export const updateTransactionSchema = z.object({
    categoryId : z.string().min(1).optional(),
    description : z.string().min(1).optional(),
    value : z.number().min(1).optional(),
    type : z.enum(['income', 'expense']).optional(),
    referenceDate : z.date().optional(),
    originId : z.string().nullable().optional(),
    originType : z.string().nullable().optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message : 'At least one field must be provided to update transaction'
    }
)

export const findTransactionsByFiltersSchema = z.object({
    id : z.string().min(1).optional(),
    categoryId : z.string().min(1).optional(),
    description : z.string().min(1).optional(),
    value : z.number().min(1).optional(),
    type : z.enum(['income', 'expense']).optional(),
    referenceDate : z.date().optional(),
    originId : z.string().nullable().optional(),
    originType : z.string().nullable().optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message : 'At least one field must be provided to find transaction with filters'
    }
)