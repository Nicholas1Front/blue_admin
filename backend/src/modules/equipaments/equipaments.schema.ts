import {z} from 'zod'
import {optionalToNull} from '../../shared/helpers/schemas/optionalToNull.js'

export const createEquipamentSchema = z.object({
    type : z.string().min(1, {message: "Type is required"}),
    brand : z.string().min(1, {message: "Brand is required"}),
    model : optionalToNull(z.string()),
    mainIdentification : optionalToNull(z.string().min(1, {message: "Main Identification is required"})),
    additionalIdentification : optionalToNull(z.string())
})

export const updateEquipamentSchema = z.object({
    clientId : z.string().min(1).optional(),
    type : z.string().min(1).optional(),
    brand : z.string().min(1).optional(),
    model : optionalToNull(z.string().optional()),
    mainIdentification : optionalToNull(z.string().min(1).optional()),
    additionalIdentification : optionalToNull(z.string().optional())
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
    model : z.string().optional(),
    mainIdentification : z.string().min(1).optional(),
    additionalIdentification : z.string().optional()
}).refine(
    data => Object.keys(data).length > 0,
    {
        message : 'At least one field must be provided to find equipament with filters'
    }
)