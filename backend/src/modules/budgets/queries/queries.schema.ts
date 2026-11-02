import { z } from 'zod'

export const findBudgetByIdParamsSchema = z.object({
    id: z.string().trim().min(1)
})

export type FindBudgetByIdParamsDTO = z.infer<typeof findBudgetByIdParamsSchema>
