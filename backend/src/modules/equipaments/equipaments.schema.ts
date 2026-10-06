import {z} from 'zod'

export const createEquipamentSchema = z.object({
    type : z.string().min(1, {message: "Type is required"}),
    brand : z.string().min(1, {message: "Brand is required"}),
    model : z.string().nullable().optional(),
    mainIdentification : z.string().min(1, {message: "Main Identification is required"}).nullable().optional(),
    additionalIdentification : z.string().nullable().optional()
})

export const updateEquipamentSchema = z.object({
    clientId : z.string().min(1).optional(),
    type : z.string().min(1).optional(),
    brand : z.string().min(1).optional(),
    model : z.string().nullable().optional(),
    mainIdentification : z.string().min(1, {message: "Main Identification is required"}).nullable().optional(),
    additionalIdentification : z.string().nullable().optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message : 'At least one field must be provided to update equipament'
    }
)

export const findEquipamentsByFiltersSchema = z.object({
    id : z.string().min(1).optional(),
    clientId : z.string().min(1).optional(),
    type : z.string().min(1).optional(),
    brand : z.string().min(1).optional(),
    model : z.string().nullable().optional(),
    mainIdentification : z.string().min(1).nullable().optional(),
    additionalIdentification : z.string().nullable().optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message : 'At least one field must be provided to find equipament with filters'
    }
)