import {z} from 'zod';

import {
    createEquipamentSchema,
    updateEquipamentSchema,
    findEquipamentsByFiltersSchema
} from './equipaments.schema.js';

export type createEquipamentDTO = z.infer<typeof createEquipamentSchema>;
export type updateEquipamentDTO = z.infer<typeof updateEquipamentSchema>;
export type findEquipamentsByFiltersDTO = z.infer<typeof findEquipamentsByFiltersSchema>;
