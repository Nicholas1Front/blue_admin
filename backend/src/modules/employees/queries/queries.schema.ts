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

export const employeeDashboardQuerySchema = z.object({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(1900).max(2200).optional(),
    movementsCursor: z.string().uuid().optional(),
    movementsLimit: z.coerce.number().int().min(1).max(100).default(20)
}).refine(data => (data.month === undefined) === (data.year === undefined), {
    message: 'Month and year must be provided together',
    path: ['year']
})

export type employeeDashboardQueryDTO = z.infer<typeof employeeDashboardQuerySchema>

export const employeeSummaryQuerySchema = z.object({
    employeeId: z.string().uuid().optional(),
    name: z.string().trim().min(1).optional(),
    document: z.string().trim().min(1).optional(),
    engagementId: z.string().uuid().optional(),
    status: z.string().trim().min(1).optional(),
    modality: z.string().trim().min(1).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(1900).max(2200).optional(),
    cursor,
    limit: pageSize
}).refine(data => (data.month === undefined) === (data.year === undefined), {
    message: 'Month and year must be provided together',
    path: ['year']
})

export type employeeSummaryQueryDTO = z.infer<typeof employeeSummaryQuerySchema>
