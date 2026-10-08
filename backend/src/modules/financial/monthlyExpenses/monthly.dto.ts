import {z} from 'zod';

import {
    createExpenseSchema,
    updateExpenseSchema,
    findExpensesByFiltersSchema
} from './monthly.schema.js';

export type createExpenseDTO = z.infer<typeof createExpenseSchema>;
export type updateExpenseDTO = z.infer<typeof updateExpenseSchema>;
export type findExpensesByFiltersDTO = z.infer<typeof findExpensesByFiltersSchema>;