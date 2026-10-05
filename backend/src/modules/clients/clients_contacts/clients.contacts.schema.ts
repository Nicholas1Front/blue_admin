import {z} from 'zod';

export const createContactSchema = z.object({
    name : z.string().min(1, 'Name is required'),
    email : z.string().email('Invalid email address').nullable().optional(),
    phoneNumber : z.string().min(1, 'Phone number is required'),
})

export const updateContactSchema = z.object({
    clientId : z.string().optional(),
    name : z.string().min(1, 'Name is required').optional(),
    email : z.string().email('Invalid email address').nullable().optional(),
    phoneNumber : z.string().min(1, 'Phone number is required').optional(),
}).refine(
    data => Object.keys(data).length > 0,
    {
        message : 'At least one field must be provided for update',
    }
)

export const findContactByFiltersSchema = z.object({
    id : z.string().optional(),
    clientId : z.string().optional(),
    name : z.string().optional(),
    email : z.string().email('Invalid email address').nullable().optional(),
    phoneNumber : z.string().optional(),
}).refine(
    data => Object.keys(data).length > 0,
    {
        message : 'At least one filter must be provided for find contact by filters',
    }
)
