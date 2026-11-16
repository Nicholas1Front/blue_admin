import type { z } from 'zod'
import type {
    createEngagementSchema,
    updateEngagementSchema,
    findEngagementsByFiltersSchema
} from './engagements.schema.js'

export type createEngagementDTO = z.infer<typeof createEngagementSchema>
export type updateEngagementDTO = z.infer<typeof updateEngagementSchema>
export type findEngagementsByFiltersDTO = z.infer<typeof findEngagementsByFiltersSchema>
