import { z } from 'zod'
import { statusDaJustificativa } from '../shared/index.js'

export const criarMovimentacaoSchema = z.object({
    engagementId: z.string().uuid(),
    type: z.enum(['falta', 'atraso', 'saida_antecipada', 'ajuste', 'bonus', 'registro_administrativo']),
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

    if (data.type !== 'falta' && data.absenceDays !== undefined && data.absenceDays !== null) {
        context.addIssue({ code: 'custom', path: ['absenceDays'], message: 'Dias de ausência só podem ser informados em faltas.' })
    }
})

export type CriarMovimentacaoDTO = z.infer<typeof criarMovimentacaoSchema>
