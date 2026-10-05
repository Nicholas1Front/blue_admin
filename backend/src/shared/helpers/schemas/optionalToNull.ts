import {z} from 'zod';

export const optionalToNull = <T extends z.ZodTypeAny>(schema: T) => {
  return schema
    .optional()
    .transform((val) => (val === undefined ? null : val))
};