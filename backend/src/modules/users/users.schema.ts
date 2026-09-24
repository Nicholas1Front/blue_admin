import {z} from 'zod';

const createUserSchema = z.object({
    name : z.string().min(1),
    email : z.string().email(),
    password : z.string().min(6)
})

const updateUserSchema = z.object({
    name : z.string().min(1).optional(),
    email : z.string().email().optional(),
    password : z.string().min(6).optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message : 'At least one field must be provided to update user'
    }
)

const findUserByFiltersSchema = z.object({
    id : z.string().min(1).optional(),
    name : z.string().min(1).optional(),
    email : z.string().email().optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message : 'At least one field must be provided to find user'
    }
)

export {
    createUserSchema,
    updateUserSchema,
    findUserByFiltersSchema
}