import {z} from 'zod';

import {
    createCategorySchema,
    updateCategorySchema,
    findCategoryByFiltersSchema
} from './category.schema.js';

export type createCategoryDTO = z.infer<typeof createCategorySchema>;
export type updateCategoryDTO = z.infer<typeof updateCategorySchema>;
export type findCategoryByFiltersDTO = z.infer<typeof findCategoryByFiltersSchema>;