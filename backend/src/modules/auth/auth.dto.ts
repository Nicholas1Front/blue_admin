import {z} from 'zod';
import {
    loginSchema
} from './auth.schema.js';

export type LoginDTO = z.infer<typeof loginSchema>;