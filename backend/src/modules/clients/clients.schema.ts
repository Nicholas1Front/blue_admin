import { z } from 'zod';

const createClientSchema = z.object({
    name: z.string().min(1),
    document: z.string().min(1).max(14),
    address: z.string().min(1)
});

const updateClientSchema = z.object({
    name: z.string().min(1).optional(),
    document: z.string().min(1).max(14).optional(),
    address: z.string().min(1).optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message: 'At least one field must be provided to update client'
    }
);

const findClientByFiltersSchema = z.object({
    id: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    document: z.string().min(1).max(14).optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message: 'At least one field must be provided to find client'
    }
);

export {
    createClientSchema,
    updateClientSchema,
    findClientByFiltersSchema
};
