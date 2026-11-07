import { z } from 'zod'

const nullableText = z.string().trim().min(1).nullable().optional()

export const createVehicleSchema = z.object({
    title: z.string().trim().min(1),
    plate: z.string().trim().toUpperCase().min(1).nullable().optional(),
    renavam: nullableText,
    crlv: nullableText,
    crv: nullableText,
    currentKilometer: z.coerce.number().int().min(0).nullable().optional(),
    observations: z.string().trim().nullable().optional()
})

export const updateVehicleSchema = z.object({
    title: z.string().trim().min(1).optional(),
    plate: z.string().trim().toUpperCase().min(1).nullable().optional(),
    renavam: nullableText,
    crlv: nullableText,
    crv: nullableText,
    currentKilometer: z.coerce.number().int().min(0).nullable().optional(),
    observations: z.string().trim().nullable().optional()
}).refine(
    data => Object.keys(data).length > 0,
    { message: 'At least one field must be provided to update vehicle' }
)

export const updateVehicleOdometerSchema = z.object({
    kilometer: z.coerce.number().int().min(0),
    isReset: z.boolean().default(false),
    description: z.string().trim().min(1).optional()
})

export type createVehicleDTO = z.infer<typeof createVehicleSchema>
export type updateVehicleDTO = z.infer<typeof updateVehicleSchema>
export type updateVehicleOdometerDTO = z.infer<typeof updateVehicleOdometerSchema>
