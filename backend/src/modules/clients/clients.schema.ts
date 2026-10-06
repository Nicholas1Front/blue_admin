import {z} from 'zod';

const createClientSchema = z.object({
    name : z.string().min(1),
    document : z.string().min(11).max(14).nullable().optional(),
    address : z.string().min(1).optional()
})

const updateClientSchema = z.object({
    name : z.string().min(1).optional(),
    document : z.string().min(11).max(14).nullable().optional(),
    address : z.string().min(1).nullable().optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message : 'At least one field must be provided to update client'
    }
)

const findClientsByFilters = z.object({
    id : z.string().min(1).optional(),
    name : z.string().min(1).optional(),
    document : z.string().min(11).max(14).optional(),
    address : z.string().min(1).nullable().optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message : 'At least one field must be provided to find client with filters'
    }
)

export {
    createClientSchema,
    updateClientSchema,
    findClientsByFilters
}