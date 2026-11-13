import { z } from 'zod'
import { statusDaJustificativa, tiposDeOcorrencia } from '../shared/index.js'

export const criarMovimentacaoSchema = z.object({
    engagementId: z.string().uuid(),
    type: z.enum(tiposDeOcorrencia),
    title: z.string().trim().min(1).max(160),
    description: z.string().trim().max(2000).nullable().optional(),
    value: z.coerce.number().min(0).nullable().optional(),
    eventDate: z.coerce.date(),
    obligationId: z.string().uuid().nullable().optional(),
    durationMinutes: z.coerce.number().int().positive().nullable().optional(),
    absenceDays: z.coerce.number().positive().nullable().optional(),
    justificationStatus: z.enum(statusDaJustificativa).nullable().optional()
}).superRefine((data, context) => {
    if (data.type === 'falta') {
        if (data.absenceDays === undefined || data.absenceDays === null) {
            context.addIssue({ code: 'custom', path: ['absenceDays'], message: 'Informe a quantidade de dias da falta.' })
        }
        if (!data.justificationStatus) {
            context.addIssue({ code: 'custom', path: ['justificationStatus'], message: 'Informe a situação da justificativa.' })
        }
    }

    if (data.type === 'atraso' || data.type === 'saida_antecipada') {
        if (data.durationMinutes === undefined || data.durationMinutes === null) {
            context.addIssue({ code: 'custom', path: ['durationMinutes'], message: 'Informe a duração em minutos.' })
        }
    }

    if (data.type === 'desconto') {
        if (!data.obligationId) {
            context.addIssue({ code: 'custom', path: ['obligationId'], message: 'Um desconto precisa estar vinculado à competência afetada.' })
        }
        if (data.value === undefined || data.value === null || data.value <= 0) {
            context.addIssue({ code: 'custom', path: ['value'], message: 'Informe um valor de desconto maior que zero.' })
        }
        if (!data.description || data.description.trim().length < 5) {
            context.addIssue({ code: 'custom', path: ['description'], message: 'Informe a justificativa do desconto.' })
        }
    }

    if (data.type !== 'falta' && data.absenceDays !== undefined && data.absenceDays !== null) {
        context.addIssue({ code: 'custom', path: ['absenceDays'], message: 'Dias de ausência só podem ser informados em faltas.' })
    }
})

export type CriarMovimentacaoDTO = z.infer<typeof criarMovimentacaoSchema>
