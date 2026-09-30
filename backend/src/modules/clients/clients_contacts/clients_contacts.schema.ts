import { z } from 'zod';

const createClientContactSchema = z.object({
    clientId: z.string().min(1),
    name: z.string().min(1),
    email: z.string().email(),
    phoneNumber: z.string().min(1)
});

const updateClientContactSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phoneNumber: z.string().min(1).optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message: 'At least one field must be provided to update client contact'
    }
);

const findClientContactByClientSchema = z.object({
    clientId: z.string().min(1)
});

export {
    createClientContactSchema,
    updateClientContactSchema,
    findClientContactByClientSchema
};
