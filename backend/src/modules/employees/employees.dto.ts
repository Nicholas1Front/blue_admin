import type { z } from 'zod'
import type {
    createEmployeeSchema,
    updateEmployeeSchema,
    findEmployeesByFiltersSchema
} from './employees.schema.js'

export type createEmployeeDTO = z.infer<typeof createEmployeeSchema>
export type updateEmployeeDTO = z.infer<typeof updateEmployeeSchema>
export type findEmployeesByFiltersDTO = z.infer<typeof findEmployeesByFiltersSchema>
