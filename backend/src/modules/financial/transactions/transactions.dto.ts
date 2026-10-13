import {z} from 'zod';

import {
    createTransactionSchema,
    updateTransactionSchema,
    findTransactionsByFiltersSchema,
    findTransactionsPaginatedSchema
} from './transactions.schema.js';

export type createTransactionDTO = z.infer<typeof createTransactionSchema>;
export type updateTransactionDTO = z.infer<typeof updateTransactionSchema>;
export type findTransactionsByFiltersDTO = z.infer<typeof findTransactionsByFiltersSchema>;
export type findTransactionsPaginatedDTO = z.infer<typeof findTransactionsPaginatedSchema>;
