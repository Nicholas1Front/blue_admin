import {z} from 'zod';

import {
    createContactSchema,
    updateContactSchema,
    findContactByFiltersSchema,
} from './clients.contacts.schema.js';

export type createContactDTO = z.infer<typeof createContactSchema>;
export type updateContactDTO = z.infer<typeof updateContactSchema>;
export type findContactByFiltersDTO = z.infer<typeof findContactByFiltersSchema>;