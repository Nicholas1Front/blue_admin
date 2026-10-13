import {z} from 'zod';

const queryBooleanSchema = z.preprocess(
    value => {
        if(value === 'true') return true;
        if(value === 'false') return false;
        return value;
    },
    z.boolean()
);

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
    active : queryBooleanSchema.optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message : 'At least one field must be provided to find category with filters'
    }
)
