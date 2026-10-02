import {z} from 'zod';

import {
    createClientSchema,
    updateClientSchema,
    findClientsByFilters
} from './clients.schema.js';

export type createClientDTO = z.infer<typeof createClientSchema>;
export type updateClientDTO = z.infer<typeof updateClientSchema>;
export type findClientsByFiltersDTO = z.infer<typeof findClientsByFilters>;