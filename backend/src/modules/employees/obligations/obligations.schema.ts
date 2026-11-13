import { z } from 'zod'
import { origensDaObrigacao, tiposDeObrigacao } from '../shared/index.js'

const nullableDate = z.coerce.date().nullable().optional()
const nullableText = (max: number) => z.string().trim().max(max).nullable().optional()

export const criarObrigacaoSchema = z.object({
    engagementId: z.string().uuid(),
    type: z.enum(tiposDeObrigacao),
    title: z.string().trim().min(1).max(160),
    description: nullableText(2000),
    originalValue: z.coerce.number().min(0).nullable().optional(),
    referenceStart: nullableDate,
    referenceEnd: nullableDate,
    dueDate: nullableDate,
    source: z.enum(origensDaObrigacao).default('manual'),
    referenceKey: z.string().trim().max(120).nullable().optional(),
    calculationDetails: z.record(z.string(), z.unknown()).optional()
})

export const atualizarObrigacaoSchema = z.object({
    title: z.string().trim().min(1).max(160).optional(),
    description: nullableText(2000),
    originalValue: z.coerce.number().min(0).nullable().optional(),
    referenceStart: nullableDate,
    referenceEnd: nullableDate,
    dueDate: nullableDate,
    referenceKey: z.string().trim().max(120).nullable().optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar a obrigação.'
})

export const revisarObrigacaoSchema = z.object({
    finalValue: z.coerce.number().positive(),
    dueDate: nullableDate
})

export const cancelarObrigacaoSchema = z.object({
    reason: z.string().trim().min(5).max(1000)
})

export type CriarObrigacaoDTO = z.infer<typeof criarObrigacaoSchema>
export type AtualizarObrigacaoDTO = z.infer<typeof atualizarObrigacaoSchema>
export type RevisarObrigacaoDTO = z.infer<typeof revisarObrigacaoSchema>
export type CancelarObrigacaoDTO = z.infer<typeof cancelarObrigacaoSchema>
