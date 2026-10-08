import {z} from 'zod';

export const createExpenseSchema = z.object({
    name : z.string().min(1),
    description : z.string().min(1).nullable().optional(),
    expectedValue : z.number().min(1),
    dueData : z.date().nullable().optional(),
    notes : z.string().min(1).nullable().optional()
})

export const updateExpenseSchema = z.object({
    name : z.string().min(1).optional(),
    description : z.string().min(1).nullable().optional(),
    expectedValue : z.number().min(1).optional(),
    dueData : z.date().nullable().optional(),
    notes : z.string().min(1).nullable().optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message : 'At least one field must be provided to update expense'
    }
)

export const findExpensesByFiltersSchema = z.object({
    id : z.string().min(1).optional(),
    name : z.string().min(1).optional(),
    description : z.string().min(1).nullable().optional(),
    expectedValue : z.number().min(1).optional(),
    dueData : z.date().nullable().optional(),
    notes : z.string().min(1).nullable().optional(),
    active : z.boolean().optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message : 'At least one field must be provided to find expense with filters'
    }
)