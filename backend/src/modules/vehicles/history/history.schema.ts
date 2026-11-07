import { z } from 'zod'
import { allowedVehicleEventTypes } from '../shared/allowedVehicleEventTypes.js'

export const createVehicleHistorySchema = z.object({
    eventType: z.enum(allowedVehicleEventTypes),
    description: z.string().trim().min(1),
    kilometerSnapshot: z.coerce.number().int().min(0).nullable().optional(),
    eventDate: z.coerce.date().optional()
})

export const updateVehicleHistorySchema = z.object({
    eventType: z.enum(allowedVehicleEventTypes).optional(),
    description: z.string().trim().min(1).optional(),
    kilometerSnapshot: z.coerce.number().int().min(0).nullable().optional(),
    eventDate: z.coerce.date().optional()
}).refine(
    data => Object.keys(data).length > 0,
    { message: 'At least one field must be provided to update vehicle history' }
)

export type createVehicleHistoryDTO = z.infer<typeof createVehicleHistorySchema>
export type updateVehicleHistoryDTO = z.infer<typeof updateVehicleHistorySchema>
