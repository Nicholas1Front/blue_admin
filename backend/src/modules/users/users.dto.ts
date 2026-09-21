import {z} from 'zod';
import {firstUserSchema} from './users.schema.js';

export type createUserDTO = z.infer<typeof firstUserSchema>;