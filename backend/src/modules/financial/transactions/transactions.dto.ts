import {z} from 'zod';

import {
    createTransactionSchema,
    updateTransactionSchema,
    findTransactionsByFiltersSchema
} from './transactions.schema.js';

export type createTransactionDTO = z.infer<typeof createTransactionSchema>;
export type updateTransactionDTO = z.infer<typeof updateTransactionSchema>;
export type findTransactionsByFiltersDTO = z.infer<typeof findTransactionsByFiltersSchema>;