import {z} from 'zod';

export const createCategorySchema = z.object({
    name : z.string().min(1),
    description : z.string().min(1).nullable().optional(),
    type : z.string().min(1)
})

export const updateCategorySchema = z.object({
    name : z.string().min(1).optional(),
    description : z.string().min(1).nullable().optional(),
    type : z.string().min(1).optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message : 'At least one field must be provided to update category'
    }
)

export const findCategoryByFiltersSchema = z.object({
    id : z.string().min(1).optional(),
    name : z.string().min(1).optional(),
    description : z.string().min(1).nullable().optional(),
    type : z.string().optional(),
    active : z.boolean().optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message : 'At least one field must be provided to find category with filters'
    }
)