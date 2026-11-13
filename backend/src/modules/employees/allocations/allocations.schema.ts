import { z } from 'zod'

const alocacaoSchema = z.object({
    obligationId: z.string().uuid(),
    value: z.coerce.number().positive()
})

export const registrarPagamentoSchema = z.object({
    engagementId: z.string().uuid(),
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(2000).nullable().optional(),
    value: z.coerce.number().positive(),
    eventDate: z.coerce.date(),
    categoryId: z.string().uuid().optional(),
    transactionId: z.string().uuid().optional(),
    allocations: z.array(alocacaoSchema).default([]),
    advanceCreditValue: z.coerce.number().min(0).default(0)
}).superRefine((data, context) => {
    if (data.categoryId && data.transactionId) {
        context.addIssue({
            code: 'custom',
            path: ['transactionId'],
            message: 'Informe uma categoria para criar uma nova transação ou transactionId para vincular uma existente, não ambos.'
        })
    }

    const ids = data.allocations.map(item => item.obligationId)
    if (new Set(ids).size !== ids.length) {
        context.addIssue({ code: 'custom', path: ['allocations'], message: 'Uma obrigação só pode aparecer uma vez neste pagamento.' })
    }

    const totalAlocado = data.allocations.reduce((total, item) => total + item.value, 0) + data.advanceCreditValue
    if (Math.abs(totalAlocado - data.value) > 0.001) {
        context.addIssue({
            code: 'custom',
            path: ['allocations'],
            message: 'O pagamento precisa ser totalmente distribuído entre obrigações e crédito de adiantamento.'
        })
    }
})

export const aplicarAdiantamentoSchema = z.object({
    sourceMovementId: z.string().uuid(),
    obligationId: z.string().uuid(),
    value: z.coerce.number().positive(),
    eventDate: z.coerce.date(),
    title: z.string().trim().min(1).max(160).default('Aplicação de adiantamento'),
    description: z.string().trim().max(2000).nullable().optional()
})

export type RegistrarPagamentoDTO = z.infer<typeof registrarPagamentoSchema>
export type AplicarAdiantamentoDTO = z.infer<typeof aplicarAdiantamentoSchema>
