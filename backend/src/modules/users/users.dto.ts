import {z} from 'zod';
import {
    createUserSchema,
    updateUserSchema,
    findUserByFiltersSchema
} from './users.schema.js';

export type createUserDTO = z.infer<typeof createUserSchema>;
export type updateUserDTO = z.infer<typeof updateUserSchema>;
export type findUserByFiltersDTO = z.infer<typeof findUserByFiltersSchema>;