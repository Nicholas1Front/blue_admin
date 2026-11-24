import { z } from 'zod'

const cursor = z.string().uuid().optional()
const pageSize = z.coerce.number().int().min(1).max(100).default(20)

export const employeeOverviewQuerySchema = z.object({
    obligationsCursor: cursor,
    obligationsLimit: pageSize,
    movementsCursor: cursor,
    movementsLimit: pageSize,
    historyCursor: cursor,
    historyLimit: pageSize
})

export type employeeOverviewQueryDTO = z.infer<typeof employeeOverviewQuerySchema>
