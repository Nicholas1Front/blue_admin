import { z } from 'zod';

import {
    createClientContactSchema,
    updateClientContactSchema,
    findClientContactByClientSchema
} from './clients_contacts.schema.js';

export type createClientContactDTO = z.infer<typeof createClientContactSchema>;
export type updateClientContactDTO = z.infer<typeof updateClientContactSchema>;
export type findClientContactByClientDTO = z.infer<typeof findClientContactByClientSchema>;
